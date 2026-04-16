const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

module.exports = function withFirebaseNonModularHeadersFix(config) {
  return withDangerousMod(config, [
    "ios",
    async (config) => {
      const podfilePath = path.join(
        config.modRequest.platformProjectRoot,
        "Podfile"
      );

      let podfile = fs.readFileSync(podfilePath, "utf-8");

      // Avoid double-patching
      if (podfile.includes("CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES")) {
        console.log("ℹ️ Podfile already patched for non-modular headers");
        return config;
      }

      const patch = `
    # Workaround: allow non-modular React headers inside framework modules (RNFirebase)
    installer.pods_project.targets.each do |target|
      if target.name.start_with?('RNFB')
        target.build_configurations.each do |config|
          config.build_settings['CLANG_ALLOW_NON_MODULAR_INCLUDES_IN_FRAMEWORK_MODULES'] = 'YES'
        end
      end
    end
`;

      // Inject before the final "end" of post_install
      podfile = podfile.replace(
        /post_install do \|installer\|([\s\S]*?)end/,
        (match, body) => {
          return `post_install do |installer|${body}${patch}  end`;
        }
      );

      fs.writeFileSync(podfilePath, podfile);
      console.log("✅ Patched Podfile for RNFirebase non-modular headers");

      return config;
    },
  ]);
};
