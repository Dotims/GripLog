import { formatClock } from "@griplog/core";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  SlideInDown,
  SlideOutDown,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/components/ui";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { useNow } from "@/lib/use-now";
import { playSound } from "@/lib/sounds";

import { useActiveWorkout } from "./use-active-workout";

export function RestTimerBar({ bottomInset }: { bottomInset: number }) {
  const rest = useActiveWorkout((state) => state.rest);
  const adjustRest = useActiveWorkout((state) => state.adjustRest);
  const skipRest = useActiveWorkout((state) => state.skipRest);
  const now = useNow(250, rest !== null);

  const remaining = rest ? Math.max(0, (rest.endsAt - now) / 1000) : 0;
  const finished = rest !== null && remaining <= 0;

  // The line drains continuously on the UI thread instead of stepping with the clock.
  const progress = useSharedValue(1);
  const startedAt = rest?.startedAt;
  const endsAt = rest?.endsAt;
  useEffect(() => {
    if (startedAt === undefined || endsAt === undefined) return;
    const left = Math.max(0, endsAt - Date.now());
    progress.set(left / (endsAt - startedAt));
    progress.set(withTiming(0, { duration: left, easing: Easing.linear }));
  }, [startedAt, endsAt, progress]);
  const progressStyle = useAnimatedStyle(() => ({ width: `${progress.get() * 100}%` }));

  useEffect(() => {
    if (!finished) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    playSound("rest");
    skipRest();
  }, [finished, skipRest]);

  if (!rest || finished) return null;

  return (
    <Animated.View
      entering={SlideInDown.springify().damping(18)}
      exiting={SlideOutDown}
      style={[styles.wrapper, { paddingBottom: bottomInset + Spacing.sm }]}
      testID="rest-timer"
    >
      <View style={styles.bar}>
        <Animated.View style={[styles.progress, progressStyle]} />
        <View style={styles.row}>
          <View>
            <AppText variant="caption" color={Colors.muted}>
              Rest
            </AppText>
            <AppText variant="number">{formatClock(Math.ceil(remaining))}</AppText>
          </View>
          <View style={styles.actions}>
            <TimerButton label="-15" onPress={() => adjustRest(-15)} />
            <TimerButton label="+15" onPress={() => adjustRest(15)} />
            <TimerButton label="Skip" onPress={skipRest} accent />
          </View>
        </View>
      </View>
    </Animated.View>
  );
}

function TimerButton({
  label,
  onPress,
  accent = false,
}: {
  label: string;
  onPress: () => void;
  accent?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label === "Skip" ? "Skip rest" : `${label} seconds`}
      style={({ pressed }) => [styles.button, accent && styles.accent, pressed && { opacity: 0.7 }]}
    >
      <AppText variant="bold" color={accent ? Colors.accentInk : Colors.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.md,
  },
  bar: {
    overflow: "hidden",
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radii.card,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  progress: {
    position: "absolute",
    left: 0,
    bottom: 0,
    height: 3,
    backgroundColor: Colors.accent,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.lg,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  button: {
    minWidth: 56,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.md,
  },
  accent: {
    backgroundColor: Colors.accent,
  },
});
