import { formatClock } from "@griplog/core";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { SlideInDown, SlideOutDown } from "react-native-reanimated";

import { AppText } from "@/components/ui";
import { BorderWidth, Colors, Radii, Shadow, Spacing } from "@/constants/theme";
import { useNow } from "@/lib/use-now";

import { useActiveWorkout } from "./use-active-workout";

export function RestTimerBar({ bottomInset }: { bottomInset: number }) {
  const rest = useActiveWorkout((state) => state.rest);
  const adjustRest = useActiveWorkout((state) => state.adjustRest);
  const skipRest = useActiveWorkout((state) => state.skipRest);
  const now = useNow(250, rest !== null);

  const remaining = rest ? Math.max(0, (rest.endsAt - now) / 1000) : 0;
  const total = rest ? (rest.endsAt - rest.startedAt) / 1000 : 1;
  const finished = rest !== null && remaining <= 0;

  useEffect(() => {
    if (!finished) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
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
        <View style={[styles.progress, { width: `${(remaining / total) * 100}%` }]} />
        <View style={styles.row}>
          <View>
            <AppText variant="label" color={Colors.faint}>
              Rest
            </AppText>
            <AppText variant="number" color={Colors.surface}>
              {formatClock(Math.ceil(remaining))}
            </AppText>
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
      <AppText variant="label" color={accent ? Colors.accentInk : Colors.text}>
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
    backgroundColor: Colors.text,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    boxShadow: Shadow.hard,
  },
  progress: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    backgroundColor: "#2A2C30",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  button: {
    minWidth: 52,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.hair,
    borderColor: Colors.border,
    borderRadius: Radii.chip,
  },
  accent: {
    backgroundColor: Colors.accent,
  },
});
