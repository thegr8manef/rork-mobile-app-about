#!/usr/bin/env node
/**
 * prebuild-diff.js
 * Compares PreviousAndroid/ and PreviousIos/ against the freshly generated
 * android/ and ios/ folders after `expo prebuild`.
 *
 * Reports:
 *   - MISSING FILES  : in Previous* but absent in new build
 *   - MISSING LINES  : lines present in Previous* file but gone from new file
 *   - NEW FILES      : files added by prebuild (not in Previous*)
 *
 * Usage:
 *   node scripts/prebuild-diff.js
 *   (or via: npm run prebuild:check)
 */

const fs = require("fs");
const path = require("path");

// ─── Config ────────────────────────────────────────────────────────────────
const ROOT = path.resolve(__dirname, "..");

const PAIRS = [
  { prev: "PreviousAndroid", curr: "android", label: "Android" },
  { prev: "PreviousIos",     curr: "ios",     label: "iOS" },
];

// Directory/path segments to skip entirely (build artifacts, IDE files, caches)
// Use (^|[\\\/]) so paths starting at root (e.g. ".gradle\...") are also matched
const EXCLUDE_PATHS = [
  // Build artifacts / IDE
  /(^|[\\\/])\.gradle([\\\/]|$)/,
  /(^|[\\\/])\.idea([\\\/]|$)/,
  /(^|[\\\/])\.cxx([\\\/]|$)/,
  /(^|[\\\/])build([\\\/]|$)/,
  /(^|[\\\/])\.build([\\\/]|$)/,
  /(^|[\\\/])xcuserdata([\\\/]|$)/,
  /(^|[\\\/])DerivedData([\\\/]|$)/,
  /(^|[\\\/])\.DS_Store$/,
  /(^|[\\\/])Pods([\\\/]|$)/,
  /(^|[\\\/])node_modules([\\\/]|$)/,
  /(^|[\\\/])__pycache__([\\\/]|$)/,
  // Splash screen assets — always regenerated fresh by expo-splash-screen
  /splashscreen_logo\.png$/,
  /splashscreen_logo\.webp$/,
  // machine-specific, restored separately by restore-android.js
  /(^|[\\\/])local\.properties$/,
];

// File extensions that get a full line-by-line diff
const TEXT_EXTENSIONS = new Set([
  ".gradle", ".properties", ".xml", ".json", ".plist",
  ".swift", ".kt", ".java", ".mm", ".m", ".h",
  ".js", ".ts", ".tsx", ".jsx",
  ".rb", ".podspec", ".sh", ".txt", ".md", ".yml", ".yaml",
  ".pbxproj", ".xcscheme", ".xcconfig",
]);

// Key files that always get deep line-diff regardless of extension
const CRITICAL_FILE_PATTERNS = [
  /build\.gradle$/i,
  /settings\.gradle$/i,
  /gradle\.properties$/i,
  /AndroidManifest\.xml$/i,
  /MainApplication\.(kt|java)$/i,
  /MainActivity\.(kt|java)$/i,
  /Podfile$/i,
  /Podfile\.lock$/i,
  /Info\.plist$/i,
  /project\.pbxproj$/i,
  /AppDelegate\.(swift|mm|m)$/i,
  /strings\.xml$/i,
  /styles\.xml$/i,
  /colors\.xml$/i,
  /google-services\.json$/i,
  /GoogleService-Info\.plist$/i,
];

// ─── Intentional differences to IGNORE in line diff ───────────────────────
//
// Package names: this app ships under two IDs (prod vs internal dev).
// Both are treated as the same — differences are intentional and not a bug.
const KNOWN_PACKAGE_NAMES = [
  "tn.attijariup.plus",
  "tn.attijari.android.prod",
];
// Regex to match any known package name (will be replaced with a placeholder)
const PACKAGE_NAME_RE = new RegExp(
  KNOWN_PACKAGE_NAMES.map((n) => n.replace(/\./g, "\\.")).join("|"),
  "g"
);

// Line patterns to skip entirely from the diff (version numbers, timestamps, etc.)
const IGNORE_LINE_PATTERNS = [
  // Android version
  /versionCode\s*=/i,
  /versionName\s*=/i,
  // iOS version
  /CFBundleShortVersionString/i,
  /CFBundleVersion/i,
  /CURRENT_PROJECT_VERSION/i,
  /MARKETING_VERSION/i,
  // Gradle wrapper version
  /gradle-[0-9]+\.[0-9]/i,
  // Auto-generated timestamps / hashes (pbxproj, lock files)
  /lastKnownFileType/i,
  /archiveVersion/i,
  /objectVersion/i,
  /\/\/ !\\$\*UTF8\*\$!/,          // pbxproj header
];

/**
 * Normalizes a line for comparison:
 *  - Replaces any known package name with __PKG__ so prod vs dev differences are ignored
 */
function normalizeLine(line) {
  return line.trimEnd().replace(PACKAGE_NAME_RE, "__PKG__");
}

/**
 * Returns true if this line should be skipped in the diff entirely
 * (version numbers, auto-generated values, etc.)
 */
function shouldIgnoreLine(line) {
  return IGNORE_LINE_PATTERNS.some((re) => re.test(line));
}

// ─── Colors ────────────────────────────────────────────────────────────────
const C = {
  reset:  "\x1b[0m",
  bold:   "\x1b[1m",
  red:    "\x1b[31m",
  green:  "\x1b[32m",
  yellow: "\x1b[33m",
  cyan:   "\x1b[36m",
  gray:   "\x1b[90m",
};

function color(c, s) { return `${c}${s}${C.reset}`; }

// ─── Utilities ─────────────────────────────────────────────────────────────
function shouldExclude(relativePath) {
  return EXCLUDE_PATHS.some((p) => p.test(relativePath));
}

/**
 * If a backup folder contains a single same-named subfolder (e.g. PreviousAndroid/android/),
 * return that subfolder as the effective root to avoid double-nesting false positives.
 */
function resolveEffectiveDir(prevDir, currName) {
  const nested = path.join(prevDir, currName);
  if (fs.existsSync(nested) && fs.statSync(nested).isDirectory()) {
    // Only treat as nested root if it looks like the actual folder
    // (contains more than just miscellaneous files that happen to share the name)
    return nested;
  }
  return prevDir;
}

function walkDir(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  function recurse(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      const rel  = path.relative(dir, full);
      if (shouldExclude(rel)) continue;
      if (e.isDirectory()) {
        recurse(full);
      } else {
        results.push(rel);
      }
    }
  }
  recurse(dir);
  return results;
}

function isTextFile(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (TEXT_EXTENSIONS.has(ext)) return true;
  const base = path.basename(filePath);
  if (CRITICAL_FILE_PATTERNS.some((p) => p.test(base))) return true;
  // Treat files with no extension as text (Makefile, Podfile, etc.)
  if (!ext) return true;
  return false;
}

function isCritical(filePath) {
  return CRITICAL_FILE_PATTERNS.some((p) => p.test(filePath));
}

function readLines(filePath) {
  try {
    return fs.readFileSync(filePath, "utf8").split("\n");
  } catch {
    return null;
  }
}

/**
 * Returns lines that exist in `prevLines` but are NOT present in `currLines`
 * (simple set-based diff — order-independent).
 */
function missingLines(prevLines, currLines) {
  const currSet = new Set(currLines.map((l) => normalizeLine(l)));
  return prevLines
    .map((l) => l.trimEnd())
    .filter((l) => {
      if (l.trim() === "") return false;
      if (shouldIgnoreLine(l)) return false;         // skip version / auto-gen lines
      return !currSet.has(normalizeLine(l));          // ignore package-name differences
    });
}

// ─── Main ──────────────────────────────────────────────────────────────────
function runDiff() {
  const reportLines = [];
  let totalMissingFiles = 0;
  let totalMissingLineFiles = 0;
  let totalNewFiles = 0;

  function log(line = "") {
    console.log(line);
    reportLines.push(line.replace(/\x1b\[[0-9;]*m/g, "")); // strip ANSI for file
  }

  const now = new Date().toLocaleString();
  log(`${color(C.bold + C.cyan, "═══════════════════════════════════════════════════")}`);
  log(`${color(C.bold + C.cyan, "  PREBUILD DIFF REPORT")}  ${color(C.gray, now)}`);
  log(`${color(C.bold + C.cyan, "═══════════════════════════════════════════════════")}`);
  log();

  for (const { prev, curr, label } of PAIRS) {
    const prevDirRaw = path.join(ROOT, prev);
    const currDir    = path.join(ROOT, curr);
    // Auto-resolve if backup contains a redundant subfolder (e.g. PreviousAndroid/android/)
    const prevDir = resolveEffectiveDir(prevDirRaw, curr);

    log(`${color(C.bold, `── ${label} ──────────────────────────────────────`)}`);

    if (!fs.existsSync(prevDirRaw)) {
      log(color(C.yellow, `  ⚠  ${prev}/ not found — skipping ${label}`));
      log();
      continue;
    }
    if (!fs.existsSync(currDir)) {
      log(color(C.red, `  ✖  ${curr}/ not found — run expo prebuild first!`));
      log();
      continue;
    }

    const prevFiles = new Set(walkDir(prevDir));
    const currFiles = new Set(walkDir(currDir));

    // ── Missing files ──────────────────────────────────────────────────────
    const missing = [...prevFiles].filter((f) => !currFiles.has(f));
    if (missing.length > 0) {
      log(color(C.red, `\n  ✖  MISSING FILES (${missing.length}):`));
      for (const f of missing) {
        const marker = isCritical(f) ? color(C.bold + C.red, " ★ CRITICAL") : "";
        log(`     ${color(C.red, f)}${marker}`);
        totalMissingFiles++;
      }
    } else {
      log(color(C.green, "  ✔  No missing files"));
    }

    // ── New files ──────────────────────────────────────────────────────────
    const newFiles = [...currFiles].filter((f) => !prevFiles.has(f));
    if (newFiles.length > 0) {
      log(color(C.cyan, `\n  ＋  NEW FILES (${newFiles.length}):`));
      for (const f of newFiles) {
        log(`     ${color(C.cyan, f)}`);
        totalNewFiles++;
      }
    }

    // ── Line-by-line diff on shared text files ─────────────────────────────
    const shared = [...prevFiles].filter((f) => currFiles.has(f));
    const filesWithMissingLines = [];

    for (const f of shared) {
      if (!isTextFile(f)) continue;

      const prevPath = path.join(prevDir, f);
      const currPath = path.join(currDir, f);

      const prevLines = readLines(prevPath);
      const currLines = readLines(currPath);
      if (!prevLines || !currLines) continue;

      const absent = missingLines(prevLines, currLines);
      if (absent.length > 0) {
        filesWithMissingLines.push({ f, absent });
      }
    }

    if (filesWithMissingLines.length > 0) {
      log(color(C.yellow, `\n  ⚠  FILES WITH MISSING LINES (${filesWithMissingLines.length}):`));
      for (const { f, absent } of filesWithMissingLines) {
        const critical = isCritical(f) ? color(C.bold + C.red, " ★ CRITICAL") : "";
        log(`\n     ${color(C.yellow, f)}${critical}`);
        for (const line of absent) {
          log(`       ${color(C.red, "- ")}${color(C.gray, line)}`);
        }
        totalMissingLineFiles++;
      }
    } else {
      log(color(C.green, "\n  ✔  No missing lines in shared files"));
    }

    log();
  }

  // ── Summary ───────────────────────────────────────────────────────────────
  log(`${color(C.bold + C.cyan, "═══════════════════════════════════════════════════")}`);
  log(`${color(C.bold, "  SUMMARY")}`);
  log(`  Missing files       : ${totalMissingFiles > 0 ? color(C.red, totalMissingFiles) : color(C.green, "0")}`);
  log(`  Files with missing lines : ${totalMissingLineFiles > 0 ? color(C.yellow, totalMissingLineFiles) : color(C.green, "0")}`);
  log(`  New files (info)    : ${color(C.cyan, totalNewFiles)}`);
  log(`${color(C.bold + C.cyan, "═══════════════════════════════════════════════════")}`);

  if (totalMissingFiles === 0 && totalMissingLineFiles === 0) {
    log(color(C.bold + C.green, "\n  ✔  Prebuild looks good — nothing missing!\n"));
  } else {
    log(color(C.bold + C.red, "\n  ✖  Issues found — review the report above!\n"));
  }

  // ── Save report to file ───────────────────────────────────────────────────
  const reportPath = path.join(ROOT, "prebuild-diff-report.md");
  const header = `# Prebuild Diff Report\nGenerated: ${now}\n\n\`\`\`\n`;
  const footer = "\n```\n";
  fs.writeFileSync(reportPath, header + reportLines.join("\n") + footer, "utf8");
  console.log(color(C.gray, `  Report saved → prebuild-diff-report.md`));
}

runDiff();
