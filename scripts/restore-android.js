#!/usr/bin/env node
/**
 * restore-android.js
 *
 * After `expo prebuild --clean`, copies all customized files back into
 * android/ and ios/ from PreviousAndroid/ and PreviousIos/.
 *
 * Android restores:
 *   - gradle.properties / local.properties
 *   - app/build.gradle, proguard-rules.pro, google-services.json
 *   - All AndroidManifest.xml variants (main, debug, debugOptimized, previewRelease)
 *   - Custom Kotlin/Java sources (MainActivity, MainApplication, native modules)
 *   - Resources: network_security_config, colors, strings, mipmap PNGs
 *   - mipmap-anydpi-v26 XMLs (need background/foreground/monochrome refs)
 *
 * iOS restores:
 *   - Info.plist, Podfile
 *   - SecureSignModule.m, SecureSignModule.swift
 *   - AttijariUpPlus-Bridging-Header.h (registers the SecureSign native modules)
 *
 * Splash screen files are intentionally NOT restored —
 * they are always regenerated fresh by expo-splash-screen.
 */

const fs   = require("fs");
const path = require("path");

const ROOT     = path.resolve(__dirname, "..");
const PREV     = path.join(ROOT, "PreviousAndroid");
const CURR     = path.join(ROOT, "android");
const PREV_IOS = path.join(ROOT, "PreviousIos");
const CURR_IOS = path.join(ROOT, "ios");

const RESTORE_FILES = [
  // ── Gradle config ─────────────────────────────────────────────────────
  "gradle.properties",
  "local.properties",

  // ── App build config ──────────────────────────────────────────────────
  "app/build.gradle",
  "app/proguard-rules.pro",
  "app/google-services.json",

  // ── Android Manifests ─────────────────────────────────────────────────
  // NOTE: app/src/main/AndroidManifest.xml is managed by withAndroidManifest
  // in withPrebuildDiff.js — do NOT restore it here or it will overwrite
  // the patched version that withAndroidManifest produces.
  "app/src/debug/AndroidManifest.xml",
  "app/src/debugOptimized/AndroidManifest.xml",
  "app/src/previewRelease/AndroidManifest.xml",

  // ── Custom Java/Kotlin sources ────────────────────────────────────────
  "app/src/main/java/tn/attijariup/plus/MainActivity.kt",
  "app/src/main/java/tn/attijariup/plus/MainApplication.kt",
  "app/src/main/java/tn/attijariup/plus/BuildConfigModule.kt",
  "app/src/main/java/tn/attijariup/plus/BuildConfigPackage.kt",
  "app/src/main/java/tn/attijariup/plus/DownloadCompleteReceiver.kt",
  "app/src/main/java/tn/attijariup/plus/SecureSignModule.java",
  "app/src/main/java/tn/attijariup/plus/SecureSignPackage.kt",
  "app/src/main/java/tn/attijariup/plus/security/SecurityNativeModule.kt",
  "app/src/main/java/tn/attijariup/plus/security/SecurityNativePackage.kt",

  // ── Resources: individual files not covered by folder replace ────────
  // (values, values-night, xml, mipmap-* are replaced as whole folders below)
];

const RESTORE_IOS_FILES = [
  // ── Podfile ───────────────────────────────────────────────────────────
  "Podfile",

  // ── Info.plist ────────────────────────────────────────────────────────
  "AttijariUpPlus/Info.plist",

  // ── Native SecureSign module ──────────────────────────────────────────
  "SecureSignModule.m",
  "SecureSignModule.swift",

  // ── Bridging header — imports SecureSignModule.m into Swift ──────────
  "AttijariUpPlus/AttijariUpPlus-Bridging-Header.h",
];

// ─── ANSI colors ───────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  red:    "\x1b[31m",
  cyan:   "\x1b[36m",
  gray:   "\x1b[90m",
};

function log(c, msg) { console.log(`${c}${msg}${C.reset}`); }

// ─── Copy entire directory recursively ─────────────────────────────────────
function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath  = path.join(src,  entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// ─── Replace entire folders from PreviousAndroid ───────────────────────────
function restoreFolders(relFolders, prevDir, currDir) {
  console.log(`\n${C.bold}${C.cyan}── Replacing res folders from PreviousAndroid ──────────${C.reset}\n`);

  let replaced = 0;
  let missing  = 0;

  for (const rel of relFolders) {
    const src  = path.join(prevDir, rel.replace(/\//g, path.sep));
    const dest = path.join(currDir, rel.replace(/\//g, path.sep));

    if (!fs.existsSync(src)) {
      log(C.yellow, `  ⚠  not in PreviousAndroid: ${rel}`);
      missing++;
      continue;
    }

    // Wipe dest folder then copy fresh from PreviousAndroid
    if (fs.existsSync(dest)) {
      fs.rmSync(dest, { recursive: true, force: true });
    }
    copyDirSync(src, dest);
    log(C.gray, `  ✔  ${rel}  (replaced)`);
    replaced++;
  }

  console.log();
  log(C.bold, `  Replaced : ${C.green}${replaced}${C.reset}`);
  if (missing > 0) log(C.bold, `  Missing  : ${C.yellow}${missing}${C.reset}`);
  console.log();
}

// ─── Helper ────────────────────────────────────────────────────────────────

function restoreFiles(files, prevDir, currDir, label) {
  if (!fs.existsSync(currDir)) {
    log(C.red, `✖  ${label} folder not found — run expo prebuild first`);
    return;
  }

  if (!fs.existsSync(prevDir)) {
    log(C.red, `✖  Previous${label}/ source not found — cannot restore`);
    return;
  }

  console.log(`\n${C.bold}${C.cyan}── Restoring customized ${label} files ──────────────────${C.reset}\n`);

  let restored = 0;
  let missing  = 0;

  for (const rel of files) {
    const src  = path.join(prevDir, rel.replace(/\//g, path.sep));
    const dest = path.join(currDir, rel.replace(/\//g, path.sep));

    if (!fs.existsSync(src)) {
      log(C.yellow, `  ⚠  not in Previous${label}: ${rel}`);
      missing++;
      continue;
    }

    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    log(C.gray, `  ✔  ${rel}`);
    restored++;
  }

  console.log();
  log(C.bold, `  Restored : ${C.green}${restored}${C.reset}`);
  if (missing > 0) log(C.bold, `  Missing  : ${C.yellow}${missing}${C.reset}`);
  console.log();
}

// ─── Main ──────────────────────────────────────────────────────────────────
restoreFiles(RESTORE_FILES, PREV, CURR, "Android");
restoreFiles(RESTORE_IOS_FILES, PREV_IOS, CURR_IOS, "iOS");

// ── Replace entire res folders (values, values-night, xml) ──────────────────
const foldersToReplace = [
  "app/src/main/res/values",
  "app/src/main/res/values-night",
  "app/src/main/res/xml",
];
restoreFolders(foldersToReplace, PREV, CURR);

// ── Restore mipmap icons from PreviousAndroid ───────────────────────────────
(function restoreMipmaps() {
  const srcRes  = path.join(PREV, "app", "src", "main", "res");
  const destRes = path.join(CURR, "app", "src", "main", "res");
  if (!fs.existsSync(srcRes)) {
    log(C.yellow, "  ⚠  PreviousAndroid res/ not found — skipping mipmap restore");
    return;
  }

  console.log(`\n${C.bold}${C.cyan}── Restoring mipmap icons from PreviousAndroid ──────────${C.reset}\n`);
  let restored = 0;
  for (const entry of fs.readdirSync(srcRes, { withFileTypes: true })) {
    if (!entry.isDirectory() || !entry.name.startsWith("mipmap-")) continue;
    const src  = path.join(srcRes, entry.name);
    const dest = path.join(destRes, entry.name);
    if (fs.existsSync(dest)) fs.rmSync(dest, { recursive: true, force: true });
    copyDirSync(src, dest);
    log(C.gray, `  ✔  res/${entry.name}  (replaced)`);
    restored++;
  }
  console.log();
  log(C.bold, `  Restored : ${C.green}${restored}${C.reset} mipmap folders`);
  console.log();
})();

// ── Patch rootProject.name in settings.gradle to "Nessna Up" ────────────────
(function patchSettingsGradle() {
  const settingsPath = path.join(CURR, "settings.gradle");
  if (!fs.existsSync(settingsPath)) {
    log(C.yellow, "  ⚠  settings.gradle not found — skipping name patch");
    return;
  }
  const content = fs.readFileSync(settingsPath, "utf8");
  const patched = content.replace(
    /rootProject\.name\s*=\s*['"][^'"]*['"]/,
    "rootProject.name = 'Nessna Up'"
  );
  if (patched !== content) {
    fs.writeFileSync(settingsPath, patched, "utf8");
    log(C.green, "  ✔  settings.gradle — rootProject.name set to 'Nessna Up'");
  } else {
    log(C.gray, "  ✔  settings.gradle — rootProject.name already 'Nessna Up'");
  }
  console.log();
})();
