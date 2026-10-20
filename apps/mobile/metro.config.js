const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);

// Drizzle migrations are bundled as .sql source files.
config.resolver.sourceExts.push("sql");
// expo-sqlite ships a WebAssembly build of SQLite for the web.
config.resolver.assetExts.push("wasm");

module.exports = config;
