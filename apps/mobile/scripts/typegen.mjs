// Generates Expo Router's typed routes without starting the dev server, so CI can typecheck.
import { mkdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
process.env.EXPO_ROUTER_APP_ROOT = resolve(root, "src/app");

const require = createRequire(resolve(root, "package.json"));
const { regenerateDeclarations } = require("@expo/router-server/build/typed-routes");

mkdirSync(resolve(root, ".expo/types"), { recursive: true });
writeFileSync(resolve(root, "expo-env.d.ts"), '/// <reference types="expo/types" />\n');
regenerateDeclarations(resolve(root, ".expo/types"), { typedRoutes: true });
// The generator is debounced by one second.
setTimeout(() => console.log("Typed routes generated"), 1500);
