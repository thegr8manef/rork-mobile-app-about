// plugins/withKeepAndroidIcons.js
//
// 🖼️  Prevents Expo prebuild from overwriting the correct Android mipmap folders.
//
// WHY: Expo's default `withAndroidIcons` plugin regenerates all mipmap files
// from `android.adaptiveIcon.foregroundImage` in app.json on every prebuild.
// The generated icon is clipped by Android's adaptive icon safe-zone mask.
// The correct (already pixel-perfect) mipmap files are stored in:
//   android-icon-backup/mipmap-*/
//
// HOW: This plugin registers a `withDangerousMod` that runs AFTER the default
// icon plugin, then copies the backup mipmaps back over the generated ones.
//
// TO DISABLE (re-enable Expo icon generation):
//   Remove "./plugins/withKeepAndroidIcons" from the `plugins` array in app.json.
//   The android-icon-backup/ folder is kept as reference.
//
// TO UPDATE THE BACKUP (new icon):
//   1. Update android.adaptiveIcon in app.json with the new source image
//   2. Remove this plugin from app.json (or temporarily disable it)
//   3. Run `npx expo prebuild --platform android`
//   4. Verify the icon looks correct on device
//   5. Copy the new mipmaps to android-icon-backup/:
//      for dir in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi mipmap-anydpi-v26; do
//        cp -r android/app/src/main/res/$dir android-icon-backup/$dir
//      done
//   6. Re-add this plugin to app.json

const { withDangerousMod } = require("expo/config-plugins");
const fs = require("fs");
const path = require("path");

const MIPMAP_DIRS = [
  "mipmap-mdpi",
  "mipmap-hdpi",
  "mipmap-xhdpi",
  "mipmap-xxhdpi",
  "mipmap-xxxhdpi",
  "mipmap-anydpi-v26",
];

/**
 * Copies all files from src directory into dst directory (non-recursive).
 * Creates dst if it doesn't exist.
 */
function copyDirFiles(src, dst) {
  if (!fs.existsSync(src)) return;
  if (!fs.existsSync(dst)) fs.mkdirSync(dst, { recursive: true });
  const files = fs.readdirSync(src);
  for (const file of files) {
    const srcFile = path.join(src, file);
    const dstFile = path.join(dst, file);
    if (fs.statSync(srcFile).isFile()) {
      fs.copyFileSync(srcFile, dstFile);
    }
  }
}

const withKeepAndroidIcons = (config) => {
  return withDangerousMod(config, [
    "android",
    (config) => {
      const projectRoot = config.modRequest.projectRoot;
      const resDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res",
      );
      const backupDir = path.join(projectRoot, "android-icon-backup");

      if (!fs.existsSync(backupDir)) {
        console.warn(
          "\n⚠️  [withKeepAndroidIcons] Backup folder not found: android-icon-backup/\n" +
          "   Skipping mipmap restore — Expo-generated icons will be used.\n" +
          "   To create the backup, run:\n" +
          "     for dir in mipmap-mdpi mipmap-hdpi mipmap-xhdpi mipmap-xxhdpi mipmap-xxxhdpi mipmap-anydpi-v26; do\n" +
          "       cp -r android/app/src/main/res/$dir android-icon-backup/$dir\n" +
          "     done\n",
        );
        return config;
      }

      let restored = 0;
      for (const dir of MIPMAP_DIRS) {
        const src = path.join(backupDir, dir);
        const dst = path.join(resDir, dir);
        if (fs.existsSync(src)) {
          copyDirFiles(src, dst);
          restored++;
        }
      }

      console.log(
        `\n✅ [withKeepAndroidIcons] Restored ${restored} mipmap folder(s) from android-icon-backup/\n`,
      );

      return config;
    },
  ]);
};

module.exports = withKeepAndroidIcons;
