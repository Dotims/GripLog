import { formatDuration, formatNumber, toDisplayWeight } from "@griplog/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Trophy } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  FadeInDown,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

import { AppText, Button, Card, Screen, SectionLabel, Stat } from "@/components/ui";
import { Colors, Spacing, tabular } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { useLiftGoal, useWeeklyGoal } from "@/features/goals/hooks";
import { LiftGoalCard } from "@/features/goals/LiftGoalCard";
import { WeekCard } from "@/features/goals/WeekCard";
import { MuscleMap } from "@/features/muscles/MuscleMap";
import { musclesWorked } from "@/features/muscles/muscles";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { useWorkout, useWorkouts } from "@/features/workouts/hooks";
import { formatRecordValue, recordLabel } from "@/features/workouts/records";
import { workoutCount } from "@/features/workouts/repository";
import { summariseWorkout } from "@/features/workouts/summary";
import { WorkoutPhotos } from "@/features/workouts/WorkoutPhotos";
import { playSound } from "@/lib/sounds";
import { useCountUp } from "@/lib/use-count-up";

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { unit } = usePreferences();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkout(id);
  const summary = workout ? summariseWorkout(workout) : null;
  const volume = useCountUp(summary ? toDisplayWeight(summary.volumeKg, unit) : 0);
  const sets = useCountUp(summary?.sets ?? 0, 700);
  const history = useWorkouts();
  const week = useWeeklyGoal(history.map((w) => w.startedAt));
  const liftGoal = useLiftGoal();
  const records = workout?.records.length ?? 0;

  // The moment the summary lands: a buzz and a chime, a brighter one for a record.
  const loaded = summary !== null;
  useEffect(() => {
    if (!loaded) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    playSound(records > 0 ? "record" : "complete");
  }, [loaded, records]);

  // One ring ripples out of the badge as it lands.
  const ripple = useSharedValue(0);
  useEffect(() => {
    ripple.set(withDelay(250, withTiming(1, { duration: 900 })));
  }, [ripple]);
  const rippleStyle = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - ripple.get()),
    transform: [{ scale: 1 + ripple.get() * 0.7 }],
  }));

  if (!workout || !summary) return null;
  const names = new Map(workout.exercises.map((e) => [e.exerciseId, e.exercise.name]));
  const muscles = musclesWorked(
    workout.exercises.map((e) => ({
      primaryMuscles: e.exercise.primaryMuscles,
      secondaryMuscles: e.exercise.secondaryMuscles,
      sets: e.sets.length,
    })),
  );
  const trainedGoalLift =
    liftGoal !== null && workout.exercises.some((e) => e.exerciseId === liftGoal.exerciseId);

  return (
    <Screen scroll edges={["top", "bottom"]} contentContainerStyle={styles.content}>
      <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.badgeWrapper}>
        <Animated.View style={[styles.ripple, rippleStyle]} />
        <View style={styles.badgeHalo}>
          <View style={styles.badge}>
            <Check color={Colors.accentInk} size={40} strokeWidth={3} />
          </View>
        </View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120)} style={styles.heading}>
        <AppText variant="caption" color={Colors.accent} align="center">
          Workout #{workoutCount(db)} complete
        </AppText>
        <AppText variant="display" align="center">
          {workout.title}
        </AppText>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180)}>
        <Card style={styles.stats}>
          <Stat label="Time" value={formatDuration(summary.durationSeconds)} />
          <Stat label="Volume" value={formatNumber(volume, 0)} unit={unit} />
          <Stat label="Sets" value={String(Math.round(sets))} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(220)}>
        <WeekCard goal={week} />
      </Animated.View>

      {workout.records.length > 0 ? (
        <View style={styles.records}>
          <SectionLabel>{`New personal records · ${workout.records.length}`}</SectionLabel>
          {workout.records.map((record, index) => (
            <Animated.View key={record.id} entering={FadeInDown.delay(250 + index * 90)}>
              <Card tone="gold" style={styles.record}>
                <View style={styles.trophy}>
                  <Trophy color={Colors.gold} size={20} strokeWidth={2.2} />
                </View>
                <View style={styles.flex}>
                  <AppText variant="bold" numberOfLines={1}>
                    {names.get(record.exerciseId)}
                  </AppText>
                  <AppText variant="label" color={Colors.gold}>
                    {recordLabel(record.kind)}
                  </AppText>
                </View>
                <AppText variant="heading" style={tabular}>
                  {formatRecordValue(record.kind, record.value, unit)}
                </AppText>
              </Card>
            </Animated.View>
          ))}
        </View>
      ) : (
        <AppText color={Colors.muted} align="center">
          No new records this time. Consistency is what moves them.
        </AppText>
      )}

      {muscles.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(300)}>
          <Card style={styles.muscles}>
            <AppText variant="caption" color={Colors.muted} align="center">
              Muscles worked
            </AppText>
            <MuscleMap muscles={muscles} height={170} />
          </Card>
        </Animated.View>
      ) : null}

      {trainedGoalLift && liftGoal ? <LiftGoalCard goal={liftGoal} unit={unit} /> : null}

      <View style={styles.photos}>
        <SectionLabel>Remember today</SectionLabel>
        <WorkoutPhotos workoutId={workout.id} />
      </View>

      <View style={styles.actions}>
        <Button
          label="Done"
          size="lg"
          onPress={() => router.dismissTo("/")}
          testID="summary-done"
        />
        <Button
          label="View workout"
          variant="ghost"
          onPress={() => router.replace(`/workouts/${workout.id}`)}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  // Centred when it fits, scrolls when a long list of records does not.
  content: {
    flexGrow: 1,
    justifyContent: "center",
  },
  badgeWrapper: {
    alignItems: "center",
  },
  ripple: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.accent,
  },
  badgeHalo: {
    padding: 14,
    borderRadius: 999,
    backgroundColor: Colors.accentSoft,
  },
  badge: {
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: Colors.accent,
  },
  heading: {
    gap: 6,
  },
  stats: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  records: {
    gap: Spacing.sm,
  },
  record: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  trophy: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    backgroundColor: "rgba(245, 196, 81, 0.16)",
  },
  flex: {
    flex: 1,
  },
  muscles: {
    paddingVertical: Spacing.lg,
    gap: Spacing.sm,
  },
  photos: {
    gap: Spacing.sm,
  },
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
