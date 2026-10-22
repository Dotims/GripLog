import { bestOneRepMax, fromDisplayWeight, toDisplayWeight, WEEKS_PER_FREEZE } from "@griplog/core";
import { Minus, Plus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  IconButton,
  KeyboardToolbar,
  NumberInput,
  Screen,
  SectionLabel,
} from "@/components/ui";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { ExerciseImage } from "@/features/exercises/ExerciseImage";
import { useExerciseHistory, useExercises, useExerciseUsage } from "@/features/exercises/hooks";
import { groupSessions } from "@/features/exercises/sessions";
import { useLiftGoal } from "@/features/goals/hooks";
import { LiftGoalCard } from "@/features/goals/LiftGoalCard";
import { usePreferences } from "@/features/profile/PreferencesProvider";

const CHOICES = 6;

/** A round number a little above the current best, so the suggested target is reachable. */
function suggestTarget(bestKg: number): number {
  if (bestKg <= 0) return 60;
  return Math.ceil((bestKg * 1.08) / 5) * 5;
}

export default function GoalsScreen() {
  const { weeklyGoal, setWeeklyGoal, liftGoal, setLiftGoal, unit } = usePreferences();
  const current = useLiftGoal();
  const [editing, setEditing] = useState(liftGoal === null);

  return (
    <Screen scroll edges={[]}>
      <SectionLabel>Weekly goal</SectionLabel>
      <Card style={styles.weekly}>
        <View style={styles.stepper}>
          <IconButton
            icon={Minus}
            label="Fewer workouts"
            onPress={() => setWeeklyGoal(weeklyGoal - 1)}
          />
          <View style={styles.stepperValue}>
            <AppText variant="display">{weeklyGoal}</AppText>
            <AppText variant="label" color={Colors.muted}>
              {weeklyGoal === 1 ? "workout a week" : "workouts a week"}
            </AppText>
          </View>
          <IconButton
            icon={Plus}
            label="More workouts"
            onPress={() => setWeeklyGoal(weeklyGoal + 1)}
          />
        </View>
        <AppText variant="label" color={Colors.muted} align="center">
          Meet it to grow your streak. Every {WEEKS_PER_FREEZE} weeks on goal earn a freeze that
          covers one missed week, for a cold or a holiday.
        </AppText>
      </Card>

      <SectionLabel>Lift goal</SectionLabel>
      {current && !editing ? (
        <>
          <LiftGoalCard goal={current} unit={unit} />
          <View style={styles.actions}>
            <Button
              label="Change goal"
              variant="secondary"
              style={styles.flex}
              onPress={() => setEditing(true)}
            />
            <Button
              label="Remove"
              variant="ghost"
              onPress={() => {
                setLiftGoal(null);
                setEditing(true);
              }}
            />
          </View>
        </>
      ) : (
        <LiftGoalEditor
          initialExerciseId={liftGoal?.exerciseId ?? null}
          onSave={(goal) => {
            setLiftGoal(goal);
            setEditing(false);
          }}
        />
      )}
      <KeyboardToolbar />
    </Screen>
  );
}

function LiftGoalEditor({
  initialExerciseId,
  onSave,
}: {
  initialExerciseId: string | null;
  onSave: (goal: { exerciseId: string; weightKg: number }) => void;
}) {
  const { unit } = usePreferences();
  const exercises = useExercises();
  const usage = useExerciseUsage();
  const [exerciseId, setExerciseId] = useState<string | null>(initialExerciseId);
  const [target, setTarget] = useState<number | null>(null);
  const history = useExerciseHistory(exerciseId ?? "");

  // The loaded lifts you do most, the ones worth a goal.
  const choices = (exercises ?? [])
    .filter((e) => e.trackingType === "weight_reps" && (usage?.get(e.id) ?? 0) > 0)
    .sort((a, b) => (usage?.get(b.id) ?? 0) - (usage?.get(a.id) ?? 0))
    .slice(0, CHOICES);

  const best = Math.max(0, ...groupSessions(history ?? []).map((s) => bestOneRepMax(s.sets) ?? 0));
  const suggested = toDisplayWeight(suggestTarget(best), unit);
  const value = target ?? (exerciseId ? suggested : null);

  if (choices.length === 0) {
    return (
      <AppText color={Colors.muted}>
        Log a few workouts with weights first; your most frequent lifts show up here to pick from.
      </AppText>
    );
  }

  return (
    <View style={styles.editor}>
      <Card style={styles.list}>
        {choices.map((exercise, index) => {
          const selected = exercise.id === exerciseId;
          return (
            <Pressable
              key={exercise.id}
              onPress={() => {
                setExerciseId(exercise.id);
                setTarget(null);
              }}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.choice,
                index > 0 && styles.divider,
                selected && styles.selected,
                pressed && !selected && styles.pressed,
              ]}
            >
              <ExerciseImage exerciseId={exercise.id} name={exercise.name} style={styles.thumb} />
              <AppText variant="bold" style={styles.flex} numberOfLines={1}>
                {exercise.name}
              </AppText>
              <View style={[styles.radio, selected && styles.radioOn]} />
            </Pressable>
          );
        })}
      </Card>

      {exerciseId ? (
        <Card style={styles.targetCard}>
          <View style={styles.flex}>
            <AppText variant="bold">Target 1RM</AppText>
            <AppText variant="label" color={Colors.muted}>
              {best > 0
                ? `Your best estimate lately: ${Math.round(toDisplayWeight(best, unit))} ${unit}`
                : "No sets with a weight yet"}
            </AppText>
          </View>
          <NumberInput
            value={value}
            onChange={setTarget}
            accessibilityLabel={`Target in ${unit}`}
            style={styles.targetInput}
          />
          <AppText variant="bold" color={Colors.muted}>
            {unit}
          </AppText>
        </Card>
      ) : null}

      <Button
        label="Save goal"
        size="lg"
        disabled={!exerciseId || !value || value <= 0}
        onPress={() => {
          if (exerciseId && value) onSave({ exerciseId, weightKg: fromDisplayWeight(value, unit) });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  weekly: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stepperValue: {
    alignItems: "center",
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  flex: {
    flex: 1,
  },
  editor: {
    gap: Spacing.md,
  },
  list: {
    overflow: "hidden",
  },
  choice: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  selected: {
    backgroundColor: Colors.accentSoft,
  },
  pressed: {
    backgroundColor: Colors.surfaceRaised,
  },
  thumb: {
    width: 40,
    height: 40,
    borderRadius: Radii.sm,
  },
  radio: {
    width: 20,
    height: 20,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: Colors.faint,
  },
  radioOn: {
    borderColor: Colors.accent,
    borderWidth: 6,
  },
  targetCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  targetInput: {
    width: 88,
  },
});
