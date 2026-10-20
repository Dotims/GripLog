import { useRouter } from "expo-router";
import { ChevronUp } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { FadeInDown, FadeOutDown } from "react-native-reanimated";

import { AppText } from "@/components/ui";
import { BorderWidth, Colors, Radii, Shadow, Spacing } from "@/constants/theme";

import { ElapsedTime } from "./ElapsedTime";
import { useActiveWorkout } from "./use-active-workout";

/** Floating strip above the tab bar while a workout runs, like Hevy's. */
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
        style={({ pressed }) => [styles.bar, pressed && styles.pressed]}
      >
        <View style={styles.pulse} />
        <View style={styles.text}>
          <AppText variant="label" color={Colors.accentInk}>
            Workout in progress
          </AppText>
          <AppText variant="heading" color={Colors.accentInk} numberOfLines={1}>
            {title}
          </AppText>
        </View>
        <ElapsedTime startedAt={startedAt} color={Colors.accentInk} />
        <ChevronUp color={Colors.accentInk} size={22} strokeWidth={3} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: "transparent",
  },
  bar: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
    backgroundColor: Colors.accent,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    boxShadow: Shadow.hard,
  },
  pressed: {
    boxShadow: Shadow.none,
    transform: [{ translateX: 3 }, { translateY: 3 }],
  },
  pulse: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.highlight,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  text: {
    flex: 1,
  },
});
