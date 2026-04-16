const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withMyNativeModule(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const iosProjectRoot = config.modRequest.platformProjectRoot;
      const appName = config.modRequest.projectName;

      const sourceDir = path.resolve(
        config.modRequest.projectRoot,
        "native/ios"
      );

      const targetDir = path.join(iosProjectRoot, appName);

      if (!fs.existsSync(sourceDir)) {
        console.warn("⚠️ native/ios folder not found");
        return config;
      }

      const files = fs.readdirSync(sourceDir);

      files.forEach((file) => {
        const src = path.join(sourceDir, file);
        const dest = path.join(targetDir, file);

        fs.copyFileSync(src, dest);
        console.log(`✅ Copied ${file} → ios/${appName}`);
      });

      return config;
    },
  ]);
};
