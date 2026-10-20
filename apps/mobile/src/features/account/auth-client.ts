import { expoClient } from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

import { API_URL } from "@/lib/api";

/**
 * Better Auth on the phone. The session cookie lives in the iOS Keychain /
 * Android Keystore through expo-secure-store, never in plain storage.
 */
export const authClient = createAuthClient({
  baseURL: API_URL,
  plugins:
    Platform.OS === "web"
      ? []
      : [expoClient({ scheme: "griplog", storagePrefix: "griplog", storage: SecureStore })],
  fetchOptions: Platform.OS === "web" ? { credentials: "include" } : undefined,
});

/** Headers that authenticate a request to our own API. */
export async function authHeaders(): Promise<Record<string, string>> {
  if (Platform.OS === "web") return {};
  const cookie = await authClient.getCookie();
  return cookie ? { Cookie: cookie } : {};
}
