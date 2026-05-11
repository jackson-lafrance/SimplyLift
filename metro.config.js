const { getDefaultConfig } = require("expo/metro-config");

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

config.resolver.sourceExts = config.resolver.sourceExts ?? [];
if (!config.resolver.sourceExts.includes("cjs")) {
  config.resolver.sourceExts.push("cjs");
}
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
