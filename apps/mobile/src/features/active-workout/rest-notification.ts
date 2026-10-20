import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

import type { RestTimer } from "./store";
import { useActiveWorkout } from "./use-active-workout";

const REST_NOTIFICATION_ID = "rest-timer";

Notifications.setNotificationHandler({
  // In the foreground the rest bar and haptics already say it; stay quiet.
  handleNotification: async () => ({
    shouldShowBanner: false,
    shouldShowList: false,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function schedule(rest: RestTimer | null): Promise<void> {
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

/**
 * Mirrors the store's rest timer as a local notification, so the phone buzzes
 * even when it is locked between sets. Kept outside the store: the store stays
 * pure and testable, this is the side effect that follows it.
 */
export function startRestNotifications(): () => void {
  if (Platform.OS === "web") return () => {};
  Notifications.requestPermissionsAsync().catch(() => {});
  return useActiveWorkout.subscribe((state, previous) => {
    if (state.rest !== previous.rest) schedule(state.rest).catch(() => {});
  });
}
