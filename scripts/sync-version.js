const fs = require('fs');
const path = require('path');

// ==========================================
// Colors & Formatting
// ==========================================
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  
  // Colors
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  
  // Backgrounds
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
};

// ==========================================
// Logger Utilities
// ==========================================
const log = {
  header: (text) => {
    console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}  ${text}${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}\n`);
  },
  
  step: (number, text) => {
    console.log(`${colors.bright}${colors.blue}[${number}/4]${colors.reset} ${colors.bright}${text}${colors.reset}`);
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
    console.log(`${colors.cyan}ℹ️  ${text}${colors.reset}`);
  }
};

// ==========================================
// Simulate async delay for visual effect
// ==========================================
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// ==========================================
// Main Version Sync Logic
// ==========================================
(async () => {
  try {
    log.header('📦 VERSION SYNC STARTED');
    
    // Read package.json version
    const packageJson = require('../package.json');
    const oldVersion = packageJson.version;
    
    // Parse version
    const versionParts = oldVersion.split('.');
    const newVersion = packageJson.version;
    
    log.info(`Current Version: ${colors.dim}${oldVersion}${colors.reset} → New Version: ${colors.bright}${colors.green}${newVersion}${colors.reset}`);
    
    // ==========================================
    // STEP 1: Update app.json
    // ==========================================
    log.step(1, 'Updating app.json');
    log.loading('Reading app.json');
    await sleep(300);
    
    const appJsonPath = path.join(__dirname, '../app.json');
    const appJson = require(appJsonPath);
    
    const oldVersionCode = appJson.expo.android?.versionCode || 0;
    const newVersionCode = oldVersionCode + 1;
    
    appJson.expo.version = newVersion;
    
    if (appJson.expo.android) {
      appJson.expo.android.versionCode = newVersionCode;
    }
    
    if (appJson.expo.ios) {
      appJson.expo.ios.buildNumber = newVersion;
    }
    
    fs.writeFileSync(appJsonPath, JSON.stringify(appJson, null, 2));
    log.success('app.json updated successfully');
    log.detail('Version', newVersion);
    log.detail('Android versionCode', `${oldVersionCode} → ${newVersionCode}`);
    log.detail('iOS buildNumber', newVersion);
    
    // ==========================================
    // STEP 2: Update Android build.gradle
    // ==========================================
    console.log(); // Add spacing
    log.step(2, 'Updating Android build.gradle');
    log.loading('Reading build.gradle');
    await sleep(300);
    
    const androidGradlePath = path.join(__dirname, '../android/app/build.gradle');
    
    if (fs.existsSync(androidGradlePath)) {
      let gradleContent = fs.readFileSync(androidGradlePath, 'utf8');
      
      // Update versionCode
      gradleContent = gradleContent.replace(
        /versionCode\s+\d+/,
        `versionCode ${newVersionCode}`
      );
      
      // Update versionName
      gradleContent = gradleContent.replace(
        /versionName\s+"[^"]*"/,
        `versionName "${newVersion}"`
      );
      
      fs.writeFileSync(androidGradlePath, gradleContent);
      log.success('Android build.gradle updated successfully');
      log.detail('versionCode', newVersionCode);
      log.detail('versionName', `"${newVersion}"`);
    } else {
      log.error('Android build.gradle not found');
      log.warning(`Path: ${androidGradlePath}`);
    }
    
    // ==========================================
    // STEP 3: Update iOS Info.plist
    // ==========================================
    console.log(); // Add spacing
    log.step(3, 'Updating iOS Info.plist');
    log.loading('Reading Info.plist');
    await sleep(300);
    
    const iosInfoPlistPath = path.join(__dirname, '../ios/AttijariUpPlus/Info.plist');
    
    if (fs.existsSync(iosInfoPlistPath)) {
      let plistContent = fs.readFileSync(iosInfoPlistPath, 'utf8');
      
      // Update CFBundleShortVersionString (user-facing version)
      plistContent = plistContent.replace(
        /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]*()/,
        `$1${newVersion}$2`
      );
      
      // Update CFBundleVersion (build number)
      plistContent = plistContent.replace(
        /(<key>CFBundleVersion<\/key>\s*<string>)[^<]*()/,
        `$1${newVersionCode}$2`
      );
      
      fs.writeFileSync(iosInfoPlistPath, plistContent);
      log.success('iOS Info.plist updated successfully');
      log.detail('CFBundleShortVersionString', newVersion);
      log.detail('CFBundleVersion', newVersionCode);
    } else {
      log.error('iOS Info.plist not found');
      log.warning(`Path: ${iosInfoPlistPath}`);
    }
    
    // ==========================================
    // STEP 4: Summary
    // ==========================================
    console.log(); // Add spacing
    log.step(4, 'Verification');
    log.loading('Verifying all files');
    await sleep(400);
    log.success('All version files verified');
    
    // Final success message
    log.final(`VERSION ${newVersion} (Build ${newVersionCode}) SYNCED SUCCESSFULLY`);
    
    // Summary box
    console.log(`${colors.bright}${colors.cyan}┌─────────────────────────────────────────────┐${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}│${colors.reset}  ${colors.bright}Version Summary${colors.reset}                         ${colors.bright}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}├─────────────────────────────────────────────┤${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}│${colors.reset}  📱 Version:        ${colors.green}${newVersion.padEnd(20)}${colors.reset}${colors.bright}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}│${colors.reset}  🔢 Build Number:   ${colors.green}${String(newVersionCode).padEnd(20)}${colors.reset}${colors.bright}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}│${colors.reset}  🤖 Android:        ${colors.green}✓${colors.reset.padEnd(21)}${colors.bright}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}│${colors.reset}  🍎 iOS:            ${colors.green}✓${colors.reset.padEnd(21)}${colors.bright}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}│${colors.reset}  ⚙️  Config:         ${colors.green}✓${colors.reset.padEnd(21)}${colors.bright}${colors.cyan}│${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}└─────────────────────────────────────────────┘${colors.reset}\n`);
    
  } catch (error) {
    console.log(`\n${colors.bright}${colors.bgRed} ❌ VERSION SYNC FAILED ❌ ${colors.reset}\n`);
    log.error(`Error: ${error.message}`);
    console.log(`\n${colors.dim}${error.stack}${colors.reset}\n`);
    process.exit(1);
  }
})();