// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const { resolve } = require("path");

let jscramblerMetroPlugin;
try {
  jscramblerMetroPlugin = require("jscrambler-metro-plugin");
} catch {
  jscramblerMetroPlugin = null;
}

function mergeMetroConfig(base, extra) {
  return {
    ...base,
    ...extra,
    transformer: { ...(base.transformer || {}), ...(extra.transformer || {}) },
    resolver: { ...(base.resolver || {}), ...(extra.resolver || {}) },
    serializer: { ...(base.serializer || {}), ...(extra.serializer || {}) },
    server: { ...(base.server || {}), ...(extra.server || {}) },
    watcher: { ...(base.watcher || {}), ...(extra.watcher || {}) },
  };
}

let config = getDefaultConfig(__dirname);

// 1) NativeWind
config = withNativeWind(config, { input: "./global.css" });

// 2) Rork
config = withRorkMetro(config);

// 3) Jscrambler (only enable when available and configured)
if (jscramblerMetroPlugin) {
  const jscramblerConfig = jscramblerMetroPlugin({
    enable: process.env.JSCRAMBLER_ENABLE === "true",
    enabledHermes: true,
    ignoreFile: resolve(__dirname, ".jscramblerignore"),
    params: [
      {
        name: "selfDefending",
        options: { threshold: 1 },
      },
    ],
  });
  module.exports = mergeMetroConfig(config, jscramblerConfig);
} else {
  module.exports = config;
}
