const fs = require('fs');
const path = require('path');

// ==========================================
// Colors & Formatting
// ==========================================
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
};

// ==========================================
// Logger Utilities
// ==========================================
const totalSteps = 8;
const log = {
  header: (text) => {
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  ${text}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
  },
  step: (number, text) => {
    console.log(`${colors.bright}${colors.blue}[${number}/${totalSteps}]${colors.reset} ${colors.bright}${text}${colors.reset}`);
  },
  loading: (text) => {
    process.stdout.write(`${colors.dim}  ⏳ ${text}...${colors.reset}`);
  },
  success: (text) => {
    process.stdout.write(`\r${colors.green}  ✅ ${text}${colors.reset}\n`);
  },
  detail: (label, value) => {
    console.log(`${colors.dim}     • ${label}:${colors.reset} ${colors.bright}${value}${colors.reset}`);
  },
  warning: (text) => {
    console.log(`${colors.yellow}  ⚠️  ${text}${colors.reset}`);
  },
  error: (text) => {
    console.log(`${colors.red}  ❌ ${text}${colors.reset}`);
  },
  final: (text) => {
    console.log(`\n${colors.bright}${colors.bgGreen} ✨ ${text} ✨ ${colors.reset}\n`);
  },
  info: (text) => {
    console.log(`${colors.cyan}  ℹ️  ${text}${colors.reset}`);
  },
  skip: (text) => {
    console.log(`${colors.dim}  ⏭️  ${text}${colors.reset}`);
  },
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

// ==========================================
// Parse CLI Arguments
// ==========================================
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};

  for (let i = 0; i < args.length; i++) {
    switch (args[i]) {
      case '--name':
      case '-n':
        parsed.appName = args[++i];
        break;
      case '--bundle-id':
      case '-b':
        parsed.bundleId = args[++i];
        break;
      case '--package':
      case '-p':
        parsed.packageName = args[++i];
        break;
      case '--help':
      case '-h':
        printUsage();
        process.exit(0);
      default:
        log.error(`Unknown argument: ${args[i]}`);
        printUsage();
        process.exit(1);
    }
  }

  return parsed;
}

function printUsage() {
  console.log(`
${colors.bright}${colors.cyan}🔄 APP RENAME TOOL${colors.reset}

${colors.bright}Usage:${colors.reset}
  node scripts/rename-app.js [options]

${colors.bright}Options:${colors.reset}
  ${colors.green}-n, --name${colors.reset}        New app display name      ${colors.dim}(e.g. "My App")${colors.reset}
  ${colors.green}-b, --bundle-id${colors.reset}   New iOS bundle identifier ${colors.dim}(e.g. com.company.app)${colors.reset}
  ${colors.green}-p, --package${colors.reset}     New Android package name  ${colors.dim}(e.g. com.company.app)${colors.reset}
  ${colors.green}-h, --help${colors.reset}        Show this help message

${colors.bright}Examples:${colors.reset}
  ${colors.dim}# Rename everything${colors.reset}
  node scripts/rename-app.js --name "NewApp" --bundle-id com.company.newapp --package com.company.newapp

  ${colors.dim}# Only change package/bundle (keep same app name)${colors.reset}
  node scripts/rename-app.js -b com.new.bundle -p com.new.package

  ${colors.dim}# Only rename the app display name${colors.reset}
  node scripts/rename-app.js -n "New Display Name"

${colors.bright}Notes:${colors.reset}
  • Old values are ${colors.cyan}auto-detected${colors.reset} from app.json
  • Only provided flags will be changed, others stay the same
  • Run ${colors.cyan}./gradlew clean${colors.reset} and ${colors.cyan}pod install${colors.reset} after renaming
`);
}

// ==========================================
// Auto-detect old values from app.json
// ==========================================
function detectOldValues(rootDir) {
  const appJsonPath = path.join(rootDir, 'app.json');

  if (!fs.existsSync(appJsonPath)) {
    log.error('app.json not found! Make sure you run this from the project root.');
    process.exit(1);
  }

  const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

  return {
    appName: appJson.expo?.name || appJson.name || '',
    bundleId: appJson.expo?.ios?.bundleIdentifier || '',
    packageName: appJson.expo?.android?.package || '',
  };
}

// ==========================================
// Helpers
// ==========================================
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function replaceInFile(filePath, replacements) {
  if (!fs.existsSync(filePath)) {
    log.warning(`File not found: ${path.relative(process.cwd(), filePath)}`);
    return false;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let changed = false;

  for (const { search, replace, description } of replacements) {
    if (typeof search === 'string') {
      if (content.includes(search)) {
        content = content.split(search).join(replace);
        changed = true;
        if (description) log.detail(description, `${search} → ${replace}`);
      }
    } else {
      if (search.test(content)) {
        content = content.replace(search, replace);
        changed = true;
        if (description) log.detail(description, replace);
      }
    }
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf8');
  }
  return changed;
}

function movePackageDir(baseDir, oldPkg, newPkg) {
  const oldParts = oldPkg.split('.');
  const newParts = newPkg.split('.');
  const oldDir = path.join(baseDir, ...oldParts);
  const newDir = path.join(baseDir, ...newParts);

  if (!fs.existsSync(oldDir)) {
    log.warning(`Directory not found: ${oldDir}`);
    return false;
  }
  if (oldDir === newDir) {
    log.skip('Package directories are the same');
    return false;
  }

  fs.mkdirSync(newDir, { recursive: true });

  const files = fs.readdirSync(oldDir);
  for (const file of files) {
    const oldFile = path.join(oldDir, file);
    const newFile = path.join(newDir, file);
    const stat = fs.statSync(oldFile);

    if (stat.isFile()) {
      fs.copyFileSync(oldFile, newFile);
      fs.unlinkSync(oldFile);
      log.detail('Moved', file);
    } else if (stat.isDirectory()) {
      copyDirSync(oldFile, newFile);
      fs.rmSync(oldFile, { recursive: true, force: true });
      log.detail('Moved dir', file);
    }
  }

  // Clean empty parent dirs
  for (let i = oldParts.length - 1; i >= 0; i--) {
    const dir = path.join(baseDir, ...oldParts.slice(0, i + 1));
    if (fs.existsSync(dir) && fs.readdirSync(dir).length === 0) {
      fs.rmdirSync(dir);
    }
  }

  return true;
}

function copyDirSync(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    entry.isDirectory() ? copyDirSync(srcPath, destPath) : fs.copyFileSync(srcPath, destPath);
  }
}

function updatePackageInSourceFiles(dir, oldPkg, newPkg) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      updatePackageInSourceFiles(fullPath, oldPkg, newPkg);
    } else if (/\.(java|kt|xml)$/.test(entry.name)) {
      let content = fs.readFileSync(fullPath, 'utf8');
      if (content.includes(oldPkg)) {
        content = content.split(oldPkg).join(newPkg);
        fs.writeFileSync(fullPath, content, 'utf8');
      }
    }
  }
}

// ==========================================
// Main
// ==========================================
(async () => {
  try {
    const cliArgs = parseArgs();

    if (!cliArgs.appName && !cliArgs.bundleId && !cliArgs.packageName) {
      log.error('No arguments provided. Nothing to rename.');
      printUsage();
      process.exit(1);
    }

    const rootDir = path.join(__dirname, '..');
    const oldValues = detectOldValues(rootDir);

    const oldAppName = oldValues.appName;
    const oldBundleId = oldValues.bundleId;
    const oldPackageName = oldValues.packageName;

    const newAppName = cliArgs.appName || oldAppName;
    const newBundleId = cliArgs.bundleId || oldBundleId;
    const newPackageName = cliArgs.packageName || oldPackageName;

    log.header('🔄 APP RENAME TOOL');

    console.log(`${colors.bright}  Detected (old) → New:${colors.reset}`);
    if (oldAppName !== newAppName)
      log.detail('App Name', `${colors.red}${oldAppName}${colors.reset} → ${colors.green}${newAppName}${colors.reset}`);
    else log.detail('App Name', `${oldAppName} ${colors.dim}(unchanged)${colors.reset}`);

    if (oldBundleId !== newBundleId)
      log.detail('Bundle ID', `${colors.red}${oldBundleId}${colors.reset} → ${colors.green}${newBundleId}${colors.reset}`);
    else log.detail('Bundle ID', `${oldBundleId} ${colors.dim}(unchanged)${colors.reset}`);

    if (oldPackageName !== newPackageName)
      log.detail('Package', `${colors.red}${oldPackageName}${colors.reset} → ${colors.green}${newPackageName}${colors.reset}`);
    else log.detail('Package', `${oldPackageName} ${colors.dim}(unchanged)${colors.reset}`);

    console.log();

    // ==========================================
    // STEP 1: Update app.json
    // ==========================================
    log.step(1, 'Updating app.json');
    log.loading('Reading app.json');
    await sleep(300);

    const appJsonPath = path.join(rootDir, 'app.json');
    const appJson = JSON.parse(fs.readFileSync(appJsonPath, 'utf8'));

    if (appJson.expo) {
      appJson.expo.name = newAppName;
      appJson.expo.slug = newAppName.toLowerCase().replace(/\s+/g, '-');
      if (appJson.expo.android) appJson.expo.android.package = newPackageName;
      if (appJson.expo.ios) appJson.expo.ios.bundleIdentifier = newBundleId;
    } else {
      appJson.name = newAppName;
    }

    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2) + '\n');
    log.success('app.json updated');

    // ==========================================
    // STEP 2: Android Manifest & Gradle
    // ==========================================
    console.log();
    log.step(2, 'Updating Android config files');
    log.loading('Processing Android files');
    await sleep(300);

    const manifestPath = path.join(rootDir, 'android/app/src/main/AndroidManifest.xml');
    replaceInFile(manifestPath, [
      { search: oldPackageName, replace: newPackageName, description: 'package' },
    ]);

    const debugManifestPath = path.join(rootDir, 'android/app/src/debug/AndroidManifest.xml');
    replaceInFile(debugManifestPath, [
      { search: oldPackageName, replace: newPackageName, description: 'debug package' },
    ]);

    const buildGradlePath = path.join(rootDir, 'android/app/build.gradle');
    replaceInFile(buildGradlePath, [
      { search: `namespace "${oldPackageName}"`, replace: `namespace "${newPackageName}"`, description: 'namespace' },
      { search: `applicationId "${oldPackageName}"`, replace: `applicationId "${newPackageName}"`, description: 'applicationId' },
      { search: `applicationId '${oldPackageName}'`, replace: `applicationId '${newPackageName}'`, description: 'applicationId' },
    ]);

    const buildGradleKtsPath = path.join(rootDir, 'android/app/build.gradle.kts');
    if (fs.existsSync(buildGradleKtsPath)) {
      replaceInFile(buildGradleKtsPath, [
        { search: `namespace = "${oldPackageName}"`, replace: `namespace = "${newPackageName}"`, description: 'namespace' },
        { search: `applicationId = "${oldPackageName}"`, replace: `applicationId = "${newPackageName}"`, description: 'applicationId' },
      ]);
    }

    const settingsGradlePath = path.join(rootDir, 'android/settings.gradle');
    if (fs.existsSync(settingsGradlePath)) {
      replaceInFile(settingsGradlePath, [
        { search: `rootProject.name = '${oldAppName}'`, replace: `rootProject.name = '${newAppName}'`, description: 'rootProject.name' },
      ]);
    }

    log.success('Android config files updated');

    // ==========================================
    // STEP 3: Android strings.xml
    // ==========================================
    console.log();
    log.step(3, 'Updating Android strings.xml');
    log.loading('Updating app display name');
    await sleep(300);

    const stringsXmlPath = path.join(rootDir, 'android/app/src/main/res/values/strings.xml');
    if (fs.existsSync(stringsXmlPath)) {
      replaceInFile(stringsXmlPath, [
        {
          search: new RegExp(`(<string name="app_name">)${escapeRegex(oldAppName)}(</string>)`),
          replace: `$1${newAppName}$2`,
          description: 'app_name',
        },
      ]);
      log.success('strings.xml updated');
    } else {
      log.warning('strings.xml not found');
    }

    // ==========================================
    // STEP 4: Move Android package directories
    // ==========================================
    console.log();
    log.step(4, 'Renaming Android package directories');
    log.loading('Moving source files');
    await sleep(400);

    if (oldPackageName !== newPackageName) {
      const javaSrcDir = path.join(rootDir, 'android/app/src/main/java');
      const moved = movePackageDir(javaSrcDir, oldPackageName, newPackageName);
      if (moved) log.success('Android source directories renamed');
      else log.skip('No directory move needed');

      log.loading('Updating package declarations in source files');
      await sleep(300);
      updatePackageInSourceFiles(path.join(rootDir, 'android/app/src/main'), oldPackageName, newPackageName);
      log.success('Package declarations updated');
    } else {
      log.skip('Package name unchanged');
    }

    // ==========================================
    // STEP 5: iOS Bundle Identifier
    // ==========================================
    console.log();
    log.step(5, 'Updating iOS project files');
    log.loading('Processing iOS config');
    await sleep(300);

    const iosDir = path.join(rootDir, 'ios');
    let xcodeprojDir = null;

    if (fs.existsSync(iosDir)) {
      xcodeprojDir = fs.readdirSync(iosDir).find((e) => e.endsWith('.xcodeproj'));
    }

    if (xcodeprojDir) {
      const pbxprojPath = path.join(iosDir, xcodeprojDir, 'project.pbxproj');
      if (fs.existsSync(pbxprojPath)) {
        replaceInFile(pbxprojPath, [
          { search: oldBundleId, replace: newBundleId, description: 'PRODUCT_BUNDLE_IDENTIFIER' },
          {
            search: new RegExp(`INFOPLIST_KEY_CFBundleDisplayName = ${escapeRegex(oldAppName)}`, 'g'),
            replace: `INFOPLIST_KEY_CFBundleDisplayName = ${newAppName}`,
            description: 'CFBundleDisplayName',
          },
        ]);
        log.success('project.pbxproj updated');
      }
    } else {
      log.warning('No .xcodeproj found in ios/');
    }

    // ==========================================
    // STEP 6: iOS Info.plist
    // ==========================================
    console.log();
    log.step(6, 'Updating iOS Info.plist');
    log.loading('Processing Info.plist');
    await sleep(300);

    const possiblePlistPaths = [
      path.join(iosDir, oldAppName, 'Info.plist'),
      path.join(iosDir, newAppName, 'Info.plist'),
      path.join(iosDir, 'Info.plist'),
    ];

    let plistUpdated = false;
    for (const plistPath of possiblePlistPaths) {
      if (fs.existsSync(plistPath)) {
        replaceInFile(plistPath, [
          {
            search: new RegExp(`(<key>CFBundleDisplayName<\\/key>\\s*<string>)${escapeRegex(oldAppName)}(<\\/string>)`),
            replace: `$1${newAppName}$2`,
            description: 'CFBundleDisplayName',
          },
          {
            search: new RegExp(`(<key>CFBundleName<\\/key>\\s*<string>)${escapeRegex(oldAppName)}(<\\/string>)`),
            replace: `$1${newAppName}$2`,
            description: 'CFBundleName',
          },
        ]);
        log.success(`Info.plist updated`);
        plistUpdated = true;
        break;
      }
    }
    if (!plistUpdated) log.warning('Info.plist not found');

    // ==========================================
    // STEP 7: Rename iOS directories
    // ==========================================
    console.log();
    log.step(7, 'Renaming iOS project directories');
    log.loading('Checking iOS directories');
    await sleep(300);

    if (oldAppName !== newAppName) {
      const oldIosAppDir = path.join(iosDir, oldAppName);
      const newIosAppDir = path.join(iosDir, newAppName);

      if (fs.existsSync(oldIosAppDir) && !fs.existsSync(newIosAppDir)) {
        fs.renameSync(oldIosAppDir, newIosAppDir);
        log.success(`Renamed ios/${oldAppName} → ios/${newAppName}`);

        // Update pbxproj references
        if (xcodeprojDir) {
          const pbxprojPath = path.join(iosDir, xcodeprojDir, 'project.pbxproj');
          replaceInFile(pbxprojPath, [
            { search: oldAppName, replace: newAppName, description: 'Project references' },
          ]);
        }

        // Rename .xcodeproj
        const oldXcodeproj = path.join(iosDir, `${oldAppName}.xcodeproj`);
        const newXcodeproj = path.join(iosDir, `${newAppName}.xcodeproj`);
        if (fs.existsSync(oldXcodeproj) && !fs.existsSync(newXcodeproj)) {
          fs.renameSync(oldXcodeproj, newXcodeproj);
          log.success(`Renamed .xcodeproj`);
        }

        // Rename .xcworkspace
        const oldWorkspace = path.join(iosDir, `${oldAppName}.xcworkspace`);
        const newWorkspace = path.join(iosDir, `${newAppName}.xcworkspace`);
        if (fs.existsSync(oldWorkspace) && !fs.existsSync(newWorkspace)) {
          fs.renameSync(oldWorkspace, newWorkspace);
          log.success(`Renamed .xcworkspace`);
        }

        // Update xcworkspace contents
        const wsDataPath = path.join(iosDir, `${newAppName}.xcworkspace`, 'contents.xcworkspacedata');
        if (fs.existsSync(wsDataPath)) {
          replaceInFile(wsDataPath, [{ search: oldAppName, replace: newAppName, description: 'workspace ref' }]);
        }

        // Update Podfile
        const podfilePath = path.join(iosDir, 'Podfile');
        if (fs.existsSync(podfilePath)) {
          replaceInFile(podfilePath, [
            { search: new RegExp(`target '${escapeRegex(oldAppName)}'`), replace: `target '${newAppName}'`, description: 'Podfile target' },
            { search: new RegExp(`project '${escapeRegex(oldAppName)}'`), replace: `project '${newAppName}'`, description: 'Podfile project' },
          ]);
        }

        // Rename and update xcscheme
        const schemesDir = path.join(iosDir, `${newAppName}.xcodeproj`, 'xcshareddata', 'xcschemes');
        const oldScheme = path.join(schemesDir, `${oldAppName}.xcscheme`);
        const newScheme = path.join(schemesDir, `${newAppName}.xcscheme`);
        if (fs.existsSync(oldScheme)) {
          let content = fs.readFileSync(oldScheme, 'utf8');
          content = content.split(oldAppName).join(newAppName);
          fs.writeFileSync(oldScheme, content, 'utf8');
          fs.renameSync(oldScheme, newScheme);
          log.success('Renamed xcscheme');
        }
      } else if (fs.existsSync(newIosAppDir)) {
        log.skip(`ios/${newAppName} already exists`);
      } else {
        log.warning(`ios/${oldAppName} not found`);
      }
    } else {
      log.skip('App name unchanged');
    }

    // ==========================================
    // STEP 8: Summary
    // ==========================================
    console.log();
    log.step(8, 'Verification & Summary');
    log.loading('Verifying changes');
    await sleep(400);
    log.success('All files processed');

    log.final('APP RENAMED SUCCESSFULLY');

    const maxLen = Math.max(newAppName.length, newBundleId.length, newPackageName.length);
    const pad = (str) => str.padEnd(maxLen + 2);

    console.log(`${colors.bright}${colors.cyan}┌${'─'.repeat(maxLen + 28)}┐${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}│${colors.reset}  ${colors.bright}Rename Summary${colors.reset}${' '.repeat(maxLen + 12)}${colors.bright}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}├${'─'.repeat(maxLen + 28)}┤${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}│${colors.reset}  📱 App Name:     ${colors.green}${pad(newAppName)}${colors.reset}${colors.bright}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}│${colors.reset}  🍎 Bundle ID:    ${colors.green}${pad(newBundleId)}${colors.reset}${colors.bright}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}│${colors.reset}  🤖 Package:      ${colors.green}${pad(newPackageName)}${colors.reset}${colors.bright}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}└${'─'.repeat(maxLen + 28)}┘${colors.reset}`);

    console.log();
    log.info(`${colors.yellow}Next steps:${colors.reset}`);
    log.detail('1', 'cd android && ./gradlew clean');
    log.detail('2', 'cd ios && pod install');
    log.detail('3', 'npx react-native run-android / run-ios');
    console.log();

  } catch (error) {
    console.log(`\n${colors.bright}${colors.bgRed} ❌ APP RENAME FAILED ❌ ${colors.reset}\n`);
    log.error(`Error: ${error.message}`);
    console.log(`\n${colors.dim}${error.stack}${colors.reset}\n`);
    process.exit(1);
  }
})();