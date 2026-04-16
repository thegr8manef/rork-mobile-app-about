// plugins/withSecureAndroid.js
//
// 🔒 Security config plugin — fixes all Android security findings:
//
// 1. android:debuggable="false"         (image WhatsApp 10.17.24)
// 2. android:allowBackup="false"        (image WhatsApp 10.22.47)
// 3. android:usesCleartextTraffic="false" (images 12, 5 — HTTP intercepted)
// 4. network_security_config.xml        (blocks cleartext at OS level)
// 5. Strip react_native_dev_server_ip   (image 66.jpeg)
// 6. Remove unnecessary permissions     (reduce attack surface)

const {
  withAndroidManifest,
  withStringsXml,
  withAppBuildGradle,
} = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

// ════════════════════════════════════════════════════════
// 1. Fix AndroidManifest.xml
// ════════════════════════════════════════════════════════
function withSecureManifest(config) {
  return withAndroidManifest(config, (mod) => {
    const manifest = mod.modResults.manifest;
    const app = manifest.application?.[0];
    if (!app) return mod;

    const isProd =
      process.env.APP_ENV === "production" ||
      process.env.APP_ENV === "staging";

    // ────────────────────────────────────────────
    // ✅ FIX: debuggable = false (always for release)
    // ────────────────────────────────────────────
    app.$["android:debuggable"] = "false";

    // ────────────────────────────────────────────
    // ✅ FIX: allowBackup = false
    // Prevents: adb backup extracting app data
    // ────────────────────────────────────────────
    app.$["android:allowBackup"] = "false";

    // ────────────────────────────────────────────
    // ✅ FIX: block cleartext HTTP in production
    // ────────────────────────────────────────────
    if (isProd) {
      app.$["android:usesCleartextTraffic"] = "false";
    }

    // ────────────────────────────────────────────
    // ✅ ADD: network security config
    // ────────────────────────────────────────────
    app.$["android:networkSecurityConfig"] =
      "@xml/network_security_config";

    // Write the network_security_config.xml file
    const resXmlDir = path.join(
      mod.modRequest.platformProjectRoot,
      "app/src/main/res/xml"
    );
    fs.mkdirSync(resXmlDir, { recursive: true });

    const nscPath = path.join(resXmlDir, "network_security_config.xml");
    // Only write if it doesn't exist (don't overwrite secure_store files)
    if (!fs.existsSync(nscPath)) {
      fs.writeFileSync(
        nscPath,
        `<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
    <base-config cleartextTrafficPermitted="false">
        <trust-anchors>
            <certificates src="system" />
        </trust-anchors>
    </base-config>
</network-security-config>
`
      );
    }

    // ────────────────────────────────────────────
    // ✅ REMOVE: unnecessary permissions
    // These increase attack surface on a banking app
    // ────────────────────────────────────────────
    const permissionsToRemove = [
      // Dev-only permission, not needed in release
      "android.permission.SYSTEM_ALERT_WINDOW",
      // Only remove these if you DON'T use them:
      // "android.permission.RECORD_AUDIO",
      // "android.permission.ACCESS_FINE_LOCATION",
      // "android.permission.ACCESS_COARSE_LOCATION",
      // "android.permission.REQUEST_INSTALL_PACKAGES",
    ];

    if (isProd && manifest["uses-permission"]) {
      manifest["uses-permission"] = manifest["uses-permission"].filter(
        (perm) => {
          const name = perm.$?.["android:name"];
          return !permissionsToRemove.includes(name);
        }
      );
    }

    // ────────────────────────────────────────────
    // ✅ AUDIT: exported components
    // Only the main activity with intent-filters
    // should have exported="true"
    // ────────────────────────────────────────────
    const activities = app.activity || [];
    activities.forEach((activity) => {
      const hasIntentFilter =
        activity["intent-filter"] && activity["intent-filter"].length > 0;
      if (!hasIntentFilter) {
        activity.$["android:exported"] = "false";
      }
    });

    return mod;
  });
}

// ════════════════════════════════════════════════════════
// 2. Strip dev server IP from strings.xml
//    (image 66.jpeg — react_native_dev_server_ip leaked)
// ════════════════════════════════════════════════════════
function withStripDevStrings(config) {
  return withStringsXml(config, (mod) => {
    const isProd =
      process.env.APP_ENV === "production" ||
      process.env.APP_ENV === "staging";

    if (isProd && mod.modResults.resources?.string) {
      const devStringNames = [
        "react_native_dev_server_ip",
        "ReactNativeDevServerPort",
      ];

      mod.modResults.resources.string =
        mod.modResults.resources.string.filter(
          (s) => !devStringNames.includes(s.$.name)
        );
    }

    return mod;
  });
}

// ════════════════════════════════════════════════════════
// 3. Enable ProGuard/R8 + APK signing v2
// ════════════════════════════════════════════════════════
function withProguardAndSigning(config) {
  return withAppBuildGradle(config, (mod) => {
    let contents = mod.modResults.contents;

    // ✅ Enable minification
    contents = contents.replace(
      /minifyEnabled\s+false/g,
      "minifyEnabled true"
    );

    // ✅ Add shrinkResources if not present
    if (!contents.includes("shrinkResources")) {
      contents = contents.replace(
        /minifyEnabled true/,
        `minifyEnabled true
            shrinkResources true`
      );
    }

    // ✅ Add proguard file reference if not present
    if (!contents.includes("proguard-rules.pro")) {
      contents = contents.replace(
        /shrinkResources true/,
        `shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'`
      );
    }

    // ✅ Disable v1 signing (Janus vulnerability)
    if (
      contents.includes("signingConfig") &&
      !contents.includes("v1SigningEnabled")
    ) {
      contents = contents.replace(
        /(signingConfig\s+signingConfigs\.release)/,
        `$1
            v1SigningEnabled false
            v2SigningEnabled true`
      );
    }

    mod.modResults.contents = contents;
    return mod;
  });
}

// ════════════════════════════════════════════════════════
// Combine all fixes into one plugin
// ════════════════════════════════════════════════════════
function withSecureAndroid(config) {
  config = withSecureManifest(config);
  config = withStripDevStrings(config);
  config = withProguardAndSigning(config);
  return config;
}

module.exports = withSecureAndroid;