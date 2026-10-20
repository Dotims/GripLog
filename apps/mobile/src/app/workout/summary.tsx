import { formatDuration, formatNumber, toDisplayWeight } from "@griplog/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Trophy } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { AppText, Button, Card, Screen, SectionLabel, Stat } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { useWorkout } from "@/features/workouts/hooks";
import { formatRecordValue, recordLabel } from "@/features/workouts/records";
import { workoutCount } from "@/features/workouts/repository";
import { summariseWorkout } from "@/features/workouts/summary";

export default function WorkoutSummaryScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { unit } = usePreferences();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkout(id);

  if (!workout) return null;

  const summary = summariseWorkout(workout);
  const names = new Map(workout.exercises.map((e) => [e.exerciseId, e.exercise.name]));

  return (
    <Screen scroll edges={["top", "bottom"]}>
      <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.stampWrapper}>
        <Card tone="accent" shadow="hardLg" style={styles.stamp}>
          <AppText variant="label" color={Colors.accentInk}>
            Workout #{workoutCount(db)}
          </AppText>
          <AppText variant="display" color={Colors.accentInk} align="center">
            Done.
          </AppText>
        </Card>
      </Animated.View>

      <AppText variant="title" align="center">
        {workout.title}
      </AppText>

      <Card style={styles.stats}>
        <Stat label="Time" value={formatDuration(summary.durationSeconds)} />
        <Stat
          label="Volume"
          value={formatNumber(toDisplayWeight(summary.volumeKg, unit), 0)}
          unit={unit}
        />
        <Stat label="Sets" value={String(summary.sets)} />
      </Card>

      {workout.records.length > 0 ? (
        <View style={styles.records}>
          <SectionLabel>{`New records · ${workout.records.length}`}</SectionLabel>
          {workout.records.map((record, index) => (
            <Animated.View key={record.id} entering={FadeInDown.delay(250 + index * 90)}>
              <Card tone="highlight" style={styles.record}>
                <Trophy color={Colors.text} size={22} strokeWidth={2.5} />
                <View style={styles.flex}>
                  <AppText variant="bold" numberOfLines={1}>
                    {names.get(record.exerciseId)}
                  </AppText>
                  <AppText variant="label">{recordLabel(record.kind)}</AppText>
                </View>
                <AppText variant="number" style={styles.recordValue}>
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

      <Button label="Done" size="lg" onPress={() => router.dismissTo("/")} testID="summary-done" />
      <Button
        label="View workout"
        variant="ghost"
        onPress={() => router.replace(`/workouts/${workout.id}`)}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  stampWrapper: {
    alignItems: "center",
    marginTop: Spacing.xl,
  },
  stamp: {
    alignItems: "center",
    paddingHorizontal: Spacing.xxl,
    paddingVertical: Spacing.lg,
    transform: [{ rotate: "-3deg" }],
  },
  stats: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  records: {
    gap: Spacing.md,
  },
  record: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  recordValue: {
    fontSize: 17,
  },
  flex: {
    flex: 1,
  },
});
