import {
  estimateOneRepMax,
  formatDuration,
  formatNumber,
  setLabel,
  setNumbers,
  toDisplayWeight,
} from "@griplog/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { ClipboardPlus, Repeat, Trash2, Trophy } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Button, Card, Screen, Stat } from "@/components/ui";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { toRoutineInput } from "@/features/active-workout/draft";
import { useStartWorkout } from "@/features/active-workout/use-start-workout";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { saveRoutine } from "@/features/routines/repository";
import { formatSetValue } from "@/features/workouts/format-set";
import { useWorkout } from "@/features/workouts/hooks";
import { deleteWorkout } from "@/features/workouts/repository";
import { summariseWorkout } from "@/features/workouts/summary";
import { formatRelativeDay, formatTime } from "@/lib/dates";
import { confirm, notify } from "@/lib/dialog";

export default function WorkoutDetailScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { unit } = usePreferences();
  const { id } = useLocalSearchParams<{ id: string }>();
  const workout = useWorkout(id);
  const { repeatWorkout } = useStartWorkout();

  if (!workout || workout.deletedAt) {
    return (
      <Screen edges={[]}>
        <AppText color={Colors.muted} style={styles.missing}>
          This workout was deleted.
        </AppText>
      </Screen>
    );
  }

  const summary = summariseWorkout(workout);
  const recordSets = new Set(workout.records.map((r) => r.setId));

  const saveAsRoutine = () => {
    saveRoutine(
      db,
      toRoutineInput(
        workout.title,
        workout.exercises.map((e) => ({
          exerciseId: e.exerciseId,
          restSeconds: null,
          notes: e.notes,
          sets: e.sets,
        })),
      ),
    );
    notify("Routine saved", `"${workout.title}" is now in your routines.`);
  };

  const remove = () =>
    confirm({
      title: "Delete workout?",
      message: "Records from it are recalculated from your other workouts.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => {
        deleteWorkout(db, workout.id);
        router.back();
      },
    });

  return (
    <Screen scroll edges={[]}>
      <View style={styles.heading}>
        <AppText variant="label" color={Colors.muted}>
          {formatRelativeDay(workout.startedAt)} · {formatTime(workout.startedAt)}
          {workout.source === "hevy" ? " · imported" : ""}
        </AppText>
        <AppText variant="display">{workout.title}</AppText>
        {workout.notes ? <AppText color={Colors.muted}>{workout.notes}</AppText> : null}
      </View>

      <Card style={styles.stats}>
        <Stat label="Time" value={formatDuration(summary.durationSeconds)} />
        <Stat
          label="Volume"
          value={formatNumber(toDisplayWeight(summary.volumeKg, unit), 0)}
          unit={unit}
        />
        <Stat label="Records" value={String(summary.records)} />
      </Card>

      {workout.exercises.map((block) => {
        const numbers = setNumbers(block.sets);
        const weighted = block.exercise.trackingType === "weight_reps";
        return (
          <Card key={block.id} style={styles.block}>
            <Pressable
              onPress={() => router.push(`/exercises/${encodeURIComponent(block.exerciseId)}`)}
              style={styles.blockHeader}
              accessibilityRole="link"
            >
              <AppText variant="heading" color={Colors.accent}>
                {block.exercise.name}
              </AppText>
              {block.notes ? <AppText color={Colors.muted}>{block.notes}</AppText> : null}
            </Pressable>
            {block.sets.map((set, index) => {
              const estimate = weighted ? estimateOneRepMax(set.weightKg, set.reps) : null;
              return (
                <View key={set.id} style={styles.setRow}>
                  <View style={[styles.setLabel, set.type !== "normal" && styles.setLabelSpecial]}>
                    <AppText variant="label">{setLabel(set.type, numbers[index] ?? 0)}</AppText>
                  </View>
                  <AppText variant="mono" style={styles.flex}>
                    {formatSetValue(set, block.exercise.trackingType, unit)}
                    {set.rpe ? `  @${set.rpe}` : ""}
                  </AppText>
                  {recordSets.has(set.id) ? (
                    <Trophy color={Colors.gold} size={16} strokeWidth={2.2} />
                  ) : null}
                  {estimate ? (
                    <AppText variant="label" color={Colors.muted}>
                      1RM {formatNumber(toDisplayWeight(estimate, unit))}
                    </AppText>
                  ) : null}
                </View>
              );
            })}
          </Card>
        );
      })}

      <Button
        label="Repeat workout"
        icon={Repeat}
        size="lg"
        onPress={() => repeatWorkout(workout.id)}
      />
      <Button
        label="Save as routine"
        icon={ClipboardPlus}
        variant="secondary"
        onPress={saveAsRoutine}
      />
      <Button label="Delete workout" icon={Trash2} variant="danger" onPress={remove} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  missing: {
    padding: Spacing.lg,
  },
  heading: {
    gap: 4,
  },
  stats: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  block: {
    overflow: "hidden",
  },
  blockHeader: {
    padding: Spacing.lg,
    paddingBottom: Spacing.sm,
    gap: 2,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  setLabel: {
    width: 28,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.sm,
  },
  setLabelSpecial: {
    backgroundColor: Colors.goldSoft,
  },
  flex: {
    flex: 1,
  },
});
