import { focusManager, onlineManager, QueryClient } from "@tanstack/react-query";
import NetInfo from "@react-native-community/netinfo";
import { AppState, Platform } from "react-native";

/**
 * Server state lives in TanStack Query: it caches responses, dedupes requests
 * and refetches stale data. React Native has no window focus or online events,
 * so we wire AppState and NetInfo into Query's managers ourselves.
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, retry: 2 },
  },
});

if (Platform.OS !== "web") {
  focusManager.setEventListener((setFocused) => {
    const subscription = AppState.addEventListener("change", (state) =>
      setFocused(state === "active"),
    );
    return () => subscription.remove();
  });
  onlineManager.setEventListener((setOnline) =>
    NetInfo.addEventListener((state) => setOnline(state.isConnected !== false)),
  );
}
