import { formatDuration, formatNumber, toDisplayWeight } from "@griplog/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Check, Trophy } from "lucide-react-native";
import { StyleSheet, View } from "react-native";
import Animated, { FadeInDown, ZoomIn } from "react-native-reanimated";

import { AppText, Button, Card, Screen, SectionLabel, Stat } from "@/components/ui";
import { Colors, Spacing, tabular } from "@/constants/theme";
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
      <Animated.View entering={ZoomIn.springify().damping(14)} style={styles.badgeWrapper}>
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
  badgeWrapper: {
    alignItems: "center",
    marginTop: Spacing.xxl,
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
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
});
