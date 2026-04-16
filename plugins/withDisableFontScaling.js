// plugins/withDisableFontScaling.js
const { withMainActivity } = require("expo/config-plugins");

const withDisableFontScaling = (config) => {
  return withMainActivity(config, (config) => {
    let contents = config.modResults.contents;

    // 1. Add imports if not present
    if (!contents.includes("import android.content.Context")) {
      contents = contents.replace(
        "import android.os.Bundle",
        "import android.content.Context\nimport android.content.res.Configuration\nimport android.os.Bundle"
      );
    }

    // 2. Add attachBaseContext override before onCreate if not present
    if (!contents.includes("override fun attachBaseContext")) {
      contents = contents.replace(
        "override fun onCreate(savedInstanceState: Bundle?)",
        `/**
   * Disable system font scaling — forces fontScale to 1.0
   * Uses modern createConfigurationContext (no deprecated APIs)
   */
  override fun attachBaseContext(newBase: Context) {
    val config = Configuration(newBase.resources.configuration)
    config.fontScale = 1.0f
    val context = newBase.createConfigurationContext(config)
    super.attachBaseContext(context)
  }

  override fun onCreate(savedInstanceState: Bundle?)`
      );
    }

    config.modResults.contents = contents;
    return config;
  });
};

module.exports = withDisableFontScaling;