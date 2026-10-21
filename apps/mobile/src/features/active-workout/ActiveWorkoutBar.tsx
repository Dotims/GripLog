import { useRouter } from "expo-router";
import { ChevronUp } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

import { AppText } from "@/components/ui";
import { Colors, Radii, Spacing } from "@/constants/theme";

import { ElapsedTime } from "./ElapsedTime";
import { useActiveWorkout } from "./use-active-workout";

/** Floating strip above the tab bar while a workout runs. */
export function ActiveWorkoutBar() {
  const router = useRouter();
  // Selecting two fields keeps this bar from re-rendering on every set edit.
  const title = useActiveWorkout((state) => state.workout?.title);
  const startedAt = useActiveWorkout((state) => state.workout?.startedAt);

  if (!title || !startedAt) return null;

  return (
    <Animated.View entering={FadeInDown} exiting={FadeOutDown} style={styles.wrapper}>
      <Pressable
        onPress={() => router.push("/workout/active")}
        accessibilityRole="button"
        accessibilityLabel="Resume workout"
        testID="active-workout-bar"
        style={({ pressed }) => [styles.bar, pressed && { opacity: 0.85 }]}
      >
        <View style={styles.dot} />
        <View style={styles.text}>
          <AppText variant="caption" color={Colors.accent}>
            Workout in progress
          </AppText>
          <AppText variant="bold" numberOfLines={1}>
            {title}
          </AppText>
        </View>
        <ElapsedTime startedAt={startedAt} variant="heading" />
        <ChevronUp color={Colors.muted} size={20} strokeWidth={2} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radii.card,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: Colors.hairline,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.accent,
  },
  text: {
    flex: 1,
    gap: 2,
  },
});
