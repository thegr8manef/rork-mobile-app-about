// metro.config.js
const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const { resolve } = require("path");

const jscramblerMetroPlugin = require("jscrambler-metro-plugin");

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

// 3) Jscrambler (only enable when you want, ex: production build)
const jscramblerConfig = jscramblerMetroPlugin({
  enable: process.env.JSCRAMBLER_ENABLE === "true",
  enabledHermes: true, // likely true for your setup (newArchEnabled)
  ignoreFile: resolve(__dirname, ".jscramblerignore"),

  // ⚠️ IMPORTANT: SelfDefending may break on Hermes for some apps.
  // Start with safer transformations first, then add more gradually.
  params: [
    {
      name: "selfDefending",
      options: { threshold: 1 },
    },
  ],

  // If you hit “source maps” build errors and you don't have the feature,
  // explicitly disable:
  // sourceMaps: false,
});

module.exports = mergeMetroConfig(config, jscramblerConfig);