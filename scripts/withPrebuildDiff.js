/**
 * withPrebuildDiff.js — Expo Config Plugin
 *
 * Automatically runs after every `expo prebuild`:
 *   1. withAndroidManifest — strips permissions / meta-data expo adds that we don't want
 *   2. restore-android.js  — copies customized files back from PreviousAndroid/ and PreviousIos/
 *   3. prebuild-diff.js    — checks for any remaining differences (runs once, after all phases)
 *
 * Registered FIRST in app.json plugins array so withAndroidManifest runs after all others.
 * (First registered = innermost callback = runs last, just before the provider writes to disk.)
 */

const { withDangerousMod, withAndroidManifest } = require("@expo/config-plugins");
const { execSync } = require("child_process");
const path = require("path");

// ─── Color palette ────────────────────────────────────────────────────────────
const C = {
  reset:   "\x1b[0m",
  bold:    "\x1b[1m",
  dim:     "\x1b[2m",
  cyan:    "\x1b[36m",
  green:   "\x1b[32m",
  yellow:  "\x1b[33m",
  red:     "\x1b[31m",
  blue:    "\x1b[34m",
  magenta: "\x1b[35m",
  white:   "\x1b[97m",
  gray:    "\x1b[90m",
  bgCyan:  "\x1b[46m",
  bgBlue:  "\x1b[44m",
};

// ─── UI helpers ───────────────────────────────────────────────────────────────
const W = 54; // box width (inner)

function pad(str, len) {
  const visible = str.replace(/\x1b\[[0-9;]*m/g, "");
  return str + " ".repeat(Math.max(0, len - visible.length));
}

function bar(pct, width = 20) {
  const filled = Math.round((pct / 100) * width);
  const empty  = width - filled;
  return (
    `${C.green}${"█".repeat(filled)}${C.reset}` +
    `${C.gray}${"░".repeat(empty)}${C.reset}`
  );
}

function header(platform) {
  const title = `  NESSNA UP  ·  POST-PREBUILD  ·  ${platform.toUpperCase()}  `;
  const time  = new Date().toLocaleTimeString("en-GB");
  console.log();
  console.log(`${C.bold}${C.cyan}╔${"═".repeat(W)}╗${C.reset}`);
  console.log(`${C.bold}${C.cyan}║${C.reset}${C.bold}${C.white}${pad(title, W)}${C.reset}${C.bold}${C.cyan}║${C.reset}`);
  console.log(`${C.bold}${C.cyan}╚${"═".repeat(W)}╝${C.reset}`);
  console.log(`${C.dim}  ⏱  Started at ${time}${C.reset}`);
  console.log();
}

function sectionHeader(index, total, label) {
  const pct  = Math.round((index / total) * 100);
  const prog = bar(pct);
  console.log(
    `${C.bold}${C.blue}  ┌─ Step ${index}/${total}${C.reset}  ` +
    `${C.bold}${label}${C.reset}`
  );
  console.log(
    `${C.blue}  │${C.reset}  ${prog}  ` +
    `${C.bold}${C.yellow}${String(pct).padStart(3)}%${C.reset}`
  );
  console.log(`${C.blue}  │${C.reset}`);
}

function sectionDone(label, detail = "") {
  const detailStr = detail ? `  ${C.dim}${detail}${C.reset}` : "";
  console.log(`${C.blue}  │${C.reset}`);
  console.log(
    `${C.blue}  └─${C.reset}  ${C.bold}${C.green}✔${C.reset}  ` +
    `${C.green}${label}${C.reset}${detailStr}`
  );
  console.log();
}

function sectionFail(label) {
  console.log(`${C.blue}  │${C.reset}`);
  console.log(
    `${C.blue}  └─${C.reset}  ${C.bold}${C.red}✖${C.reset}  ${C.red}${label}${C.reset}`
  );
  console.log();
}

function manifestRow(icon, color, label, value) {
  const col1 = pad(`${C.blue}  │${C.reset}  ${color}${icon}${C.reset}  ${C.bold}${label}${C.reset}`, 42);
  console.log(`${col1}  ${color}${value}${C.reset}`);
}

function footer(platform, allOk) {
  const statusIcon  = allOk ? `${C.green}✔` : `${C.yellow}⚠`;
  const statusLabel = allOk ? `${C.green}ALL DONE` : `${C.yellow}DONE WITH WARNINGS`;
  console.log(`${C.bold}${C.cyan}  ${"═".repeat(W - 2)}${C.reset}`);
  console.log(
    `${C.bold}  ${statusIcon}  ${statusLabel}  ${C.reset}` +
    `${C.dim}·  ${platform}  ·  ${new Date().toLocaleTimeString("en-GB")}${C.reset}`
  );
  console.log(`${C.bold}${C.cyan}  ${"═".repeat(W - 2)}${C.reset}`);
  console.log();
}

// ─── Script runners ───────────────────────────────────────────────────────────
function runRestore(projectRoot) {
  const restoreScript = path.join(projectRoot, "scripts", "restore-android.js");
  try {
    execSync(`node "${restoreScript}"`, { cwd: projectRoot, stdio: "inherit" });
    return true;
  } catch (e) {
    console.log(`${C.blue}  │${C.reset}  ${C.bold}${C.red}✖  restore-android.js failed:${C.reset} ${e.message}`);
    return false;
  }
}

function runDiff(projectRoot) {
  const diffScript = path.join(projectRoot, "scripts", "prebuild-diff.js");
  try {
    execSync(`node "${diffScript}"`, { cwd: projectRoot, stdio: "inherit" });
    return true;
  } catch (e) {
    console.log(`${C.blue}  │${C.reset}  ${C.bold}${C.yellow}⚠  prebuild-diff.js failed:${C.reset} ${e.message}`);
    return false;
  }
}

// ─── Exact permissions list the app requires ──────────────────────────────────
const DESIRED_PERMISSIONS = [
  { $: { "android:name": "android.permission.INTERNET" } },
  { $: { "android:name": "android.permission.USE_BIOMETRIC" } },
  { $: { "android:name": "android.permission.USE_FINGERPRINT" } },
  { $: { "android:name": "android.permission.VIBRATE" } },
  { $: { "android:name": "android.permission.WRITE_EXTERNAL_STORAGE", "android:maxSdkVersion": "28" } },
  { $: { "android:name": "android.permission.ACCESS_MEDIA_LOCATION",           "tools:node": "remove" } },
  { $: { "android:name": "android.permission.READ_EXTERNAL_STORAGE",           "tools:node": "remove" } },
  { $: { "android:name": "android.permission.READ_MEDIA_AUDIO",                "tools:node": "remove" } },
  { $: { "android:name": "android.permission.READ_MEDIA_IMAGES",               "tools:node": "remove" } },
  { $: { "android:name": "android.permission.READ_MEDIA_VIDEO",                "tools:node": "remove" } },
  { $: { "android:name": "android.permission.READ_MEDIA_VISUAL_USER_SELECTED", "tools:node": "remove" } },
  { $: { "android:name": "android.permission.RECORD_AUDIO",                    "tools:node": "remove" } },
  { $: { "android:name": "android.permission.SYSTEM_ALERT_WINDOW",             "tools:node": "remove" } },
];

// ─── Meta-data keys added by Firebase / expo-notifications that we remove ─────
const REMOVE_META_DATA = [
  "com.google.firebase.messaging.default_notification_channel_id",
  "com.google.firebase.messaging.default_notification_color",
  "com.google.firebase.messaging.default_notification_icon",
  "expo.modules.notifications.default_notification_color",
  "expo.modules.notifications.default_notification_icon",
];

// ─── Patch the manifest and return stats for logging ──────────────────────────
function patchAndroidManifest(cfg) {
  const manifest    = cfg.modResults.manifest;
  const before      = (manifest["uses-permission"] || []).length;

  // 1. Replace permissions with exact desired list
  manifest["uses-permission"] = DESIRED_PERMISSIONS;
  const removedCount = Math.max(0, before - DESIRED_PERMISSIONS.length);

  // 2. Patch <application>
  const application = manifest.application?.[0];
  let metaRemoved = 0;
  if (application) {
    application.$["android:allowBackup"]           = "false";
    application.$["android:networkSecurityConfig"] = "@xml/network_security_config";
    application.$["android:usesCleartextTraffic"]  = "true";

    if (application["meta-data"]) {
      const before2 = application["meta-data"].length;
      application["meta-data"] = application["meta-data"].filter(
        (m) => !REMOVE_META_DATA.includes(m.$?.["android:name"])
      );
      metaRemoved = before2 - application["meta-data"].length;
    }

    // 3. Set exact intent filters
    const activity = application.activity?.[0];
    if (activity) {
      activity["intent-filter"] = [
        {
          action:   [{ $: { "android:name": "android.intent.action.MAIN" } }],
          category: [{ $: { "android:name": "android.intent.category.LAUNCHER" } }],
        },
        {
          action:   [{ $: { "android:name": "android.intent.action.VIEW" } }],
          category: [
            { $: { "android:name": "android.intent.category.DEFAULT" } },
            { $: { "android:name": "android.intent.category.BROWSABLE" } },
          ],
          data: [{ $: { "android:scheme": "attijariup" } }],
        },
        {
          $: { "android:autoVerify": "true" },
          action:   [{ $: { "android:name": "android.intent.action.VIEW" } }],
          category: [
            { $: { "android:name": "android.intent.category.DEFAULT" } },
            { $: { "android:name": "android.intent.category.BROWSABLE" } },
          ],
          data: [{ $: { "android:scheme": "https", "android:host": "www.attijariup.com.tn" } }],
        },
      ];
    }
  }

  // ── Log manifest patch summary ──────────────────────────────────────────────
  const keep    = DESIRED_PERMISSIONS.filter(p => !p.$["tools:node"]).length;
  const stripped = DESIRED_PERMISSIONS.filter(p =>  p.$["tools:node"]).length;

  console.log();
  console.log(`${C.bold}${C.magenta}  ◆  AndroidManifest.xml patch${C.reset}`);
  console.log(`${C.magenta}  ${"─".repeat(46)}${C.reset}`);
  manifestRow("⚙", C.cyan,    "permissions",    `${keep} active  +  ${stripped} stripped  (−${removedCount} dangerous)`);
  manifestRow("⊘", C.yellow,  "meta-data",      `${metaRemoved} removed  (Firebase / notifications)`);
  manifestRow("⇒", C.green,   "intent-filters", `3 set  (MAIN · attijariup:// · https app-link)`);
  manifestRow("🔒", C.green,  "allowBackup",    `false`);
  console.log(`${C.magenta}  ${"─".repeat(46)}${C.reset}`);
  console.log(`  ${C.bold}${C.green}✔  Manifest locked${C.reset}  ${C.dim}· ${bar(100, 16)}  100%${C.reset}`);
  console.log();

  return cfg;
}

// ─── Plugin ───────────────────────────────────────────────────────────────────
const withPrebuildDiff = (config) => {

  // ── Manifest patch (withAndroidManifest pipeline, innermost = last to run) ──
  config = withAndroidManifest(config, (cfg) => patchAndroidManifest(cfg));

  // ── Android dangerous mod — file restore ────────────────────────────────────
  config = withDangerousMod(config, [
    "android",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const TOTAL = 2; // restore + manifest patch

      header("Android");

      sectionHeader(1, TOTAL, "Restoring Native Files");
      const ok = runRestore(projectRoot);
      ok
        ? sectionDone("34 Android + 5 iOS files restored", "Kotlin · Gradle · Resources · Mipmap · Manifests")
        : sectionFail("Restore encountered errors — check output above");

      sectionHeader(TOTAL, TOTAL, "AndroidManifest.xml  (patched via withAndroidManifest)");
      sectionDone("Manifest will be patched after this phase", "permissions · meta-data · intent-filters · allowBackup");

      footer("Android", ok);
      return cfg;
    },
  ]);

  // ── iOS dangerous mod — file restore + diff check ───────────────────────────
  config = withDangerousMod(config, [
    "ios",
    async (cfg) => {
      const projectRoot = cfg.modRequest.projectRoot;
      const TOTAL = 2;

      header("iOS");

      sectionHeader(1, TOTAL, "Restoring Native Files");
      const ok1 = runRestore(projectRoot);
      ok1
        ? sectionDone("iOS files restored", "Info.plist · Podfile · SecureSign modules · Bridging Header")
        : sectionFail("Restore encountered errors — check output above");

      sectionHeader(TOTAL, TOTAL, "Running Diff Check");
      const ok2 = runDiff(projectRoot);
      ok2
        ? sectionDone("Diff check passed", "android/ and ios/ match PreviousAndroid / PreviousIos")
        : sectionFail("Diff check reported differences — see report above");

      footer("iOS", ok1 && ok2);
      return cfg;
    },
  ]);

  return config;
};

module.exports = withPrebuildDiff;
