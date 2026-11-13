import Constants, { ExecutionEnvironment } from "expo-constants";
import { Platform } from "react-native";

import type { RestTimer } from "./store";
import { useActiveWorkout } from "./use-active-workout";

const REST_NOTIFICATION_ID = "rest-timer";

type NotificationsModule = typeof import("expo-notifications");

// Lazy: Expo Go on Android has no native module, and importing it at startup crashes.
function notificationsSupported(): boolean {
  if (Platform.OS === "web") return false;
  const inExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
  return !(inExpoGo && Platform.OS === "android");
}

async function schedule(Notifications: NotificationsModule, rest: RestTimer | null): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(REST_NOTIFICATION_ID).catch(() => {});
  if (!rest) return;
  const seconds = Math.round((rest.endsAt - Date.now()) / 1000);
  if (seconds <= 0) return;
  await Notifications.scheduleNotificationAsync({
    identifier: REST_NOTIFICATION_ID,
    content: { title: "Rest is over", body: "Time for the next set.", sound: true },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds },
  });
}

/** Mirrors the rest timer as a local notification, so a locked phone still buzzes. */
export function startRestNotifications(): () => void {
  if (!notificationsSupported()) return () => {};
  let unsubscribe: (() => void) | null = null;
  let cancelled = false;

  import("expo-notifications")
    .then((Notifications) => {
      if (cancelled) return;
      Notifications.setNotificationHandler({
        // In the foreground the rest bar and haptics already say it; stay quiet.
        handleNotification: async () => ({
          shouldShowBanner: false,
          shouldShowList: false,
          shouldPlaySound: false,
          shouldSetBadge: false,
        }),
      });
      Notifications.requestPermissionsAsync().catch(() => {});
      unsubscribe = useActiveWorkout.subscribe((state, previous) => {
        if (state.rest !== previous.rest) schedule(Notifications, state.rest).catch(() => {});
      });
    })
    .catch(() => {});

  return () => {
    cancelled = true;
    unsubscribe?.();
  };
}
