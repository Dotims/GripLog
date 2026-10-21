import { formatClock, setLabel, setNumbers, type WeightUnit } from "@griplog/core";
import { MoreHorizontal, Timer, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import Animated, { FadeOut } from "react-native-reanimated";
import { useShallow } from "zustand/react/shallow";

import {
  AppText,
  Card,
  DurationInput,
  NumberInput,
  OptionsSheet,
  RepRangeInput,
} from "@/components/ui";
import { Colors, Radii, Spacing, supersetColor } from "@/constants/theme";
import { columnsFor, type SetColumn } from "@/features/active-workout/columns";
import { REST_OPTIONS } from "@/features/active-workout/ExerciseBlock";
import { SET_TYPE_LABELS, SET_TYPE_STYLES } from "@/features/active-workout/SetRow";
import { SupersetBadge } from "@/features/active-workout/SupersetBadge";
import { supersetLetters, supersetPosition } from "@/features/active-workout/supersets";
import { ExerciseImage } from "@/features/exercises/ExerciseImage";

import { useRoutineDraft, type RoutineDraftSet } from "./routine-draft";

type RoutineExerciseCardProps = {
  exerciseId: string;
  unit: WeightUnit;
  defaultRestSeconds: number;
  isFirst: boolean;
  isLast: boolean;
};

/** One exercise of the routine being edited: its targets per set, rest and superset. */
export function RoutineExerciseCard({
  exerciseId,
  unit,
  defaultRestSeconds,
  isFirst,
  isLast,
}: RoutineExerciseCardProps) {
  const exercise = useRoutineDraft((state) =>
    state.draft?.exercises.find((e) => e.id === exerciseId),
  );
  const superset = useRoutineDraft(
    useShallow((state) => {
      const groups = state.draft?.exercises ?? [];
      const own = groups.find((e) => e.id === exerciseId)?.supersetId ?? null;
      if (own === null) return { letter: null, index: -1, position: null };
      const letters = supersetLetters(groups);
      return {
        letter: letters.get(own) ?? null,
        index: [...letters.keys()].indexOf(own),
        position: supersetPosition(groups, exerciseId),
      };
    }),
  );
  const actions = useRoutineDraft.getState();
  const [menu, setMenu] = useState<"main" | "rest" | null>(null);
  const [typeMenuFor, setTypeMenuFor] = useState<RoutineDraftSet | null>(null);

  if (!exercise) return null;

  const columns = columnsFor(exercise.trackingType, unit);
  const numbers = setNumbers(exercise.sets);
  const color = superset.letter ? supersetColor(superset.index) : null;
  const linkedBelow = superset.position === "first" || superset.position === "middle";
  const rest = exercise.restSeconds ?? defaultRestSeconds;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <ExerciseImage
          exerciseId={exercise.exerciseId}
          name={exercise.name}
          trackingType={exercise.trackingType}
          style={styles.thumb}
        />
        <View style={styles.title}>
          <AppText variant="heading" numberOfLines={2}>
            {exercise.name}
          </AppText>
          {superset.letter && color ? (
            <SupersetBadge letter={superset.letter} color={color} />
          ) : null}
        </View>
        <Pressable
          onPress={() => setMenu("main")}
          accessibilityRole="button"
          accessibilityLabel={`${exercise.name} options`}
          hitSlop={10}
          style={styles.menuButton}
        >
          <MoreHorizontal color={Colors.muted} size={22} strokeWidth={2} />
        </Pressable>
      </View>

      <Pressable onPress={() => setMenu("rest")} style={styles.rest} accessibilityRole="button">
        <Timer color={Colors.muted} size={14} strokeWidth={2} />
        <AppText variant="label" color={Colors.muted}>
          {linkedBelow
            ? "No rest within the superset"
            : `Rest ${rest > 0 ? formatClock(rest) : "off"}`}
        </AppText>
      </Pressable>

      <View style={styles.tableHeader}>
        <AppText variant="caption" color={Colors.faint} style={styles.labelColumn} align="center">
          Set
        </AppText>
        {columns.map((column) => (
          <AppText
            key={column.key}
            variant="caption"
            color={Colors.faint}
            style={styles.flex}
            align="center"
          >
            {column.key === "reps" ? "Reps or range" : column.label}
          </AppText>
        ))}
      </View>

      {exercise.sets.map((set, index) => (
        <Animated.View key={set.id} exiting={FadeOut}>
          <ReanimatedSwipeable
            friction={2}
            rightThreshold={40}
            overshootRight={false}
            renderRightActions={() => (
              <Pressable
                onPress={() => actions.removeSet(exerciseId, set.id)}
                style={styles.delete}
                accessibilityRole="button"
                accessibilityLabel="Delete set"
              >
                <Trash2 color={Colors.accentInk} size={18} strokeWidth={2} />
              </Pressable>
            )}
          >
            <View style={styles.setRow}>
              <Pressable
                onPress={() => setTypeMenuFor(set)}
                accessibilityRole="button"
                accessibilityLabel={`Set ${setLabel(set.type, numbers[index] ?? 0)} options`}
                hitSlop={4}
                style={[styles.setLabel, { backgroundColor: SET_TYPE_STYLES[set.type].background }]}
              >
                <AppText variant="bold" color={SET_TYPE_STYLES[set.type].ink}>
                  {setLabel(set.type, numbers[index] ?? 0)}
                </AppText>
              </Pressable>
              {columns.map((column) => (
                <TargetField
                  key={column.key}
                  column={column}
                  set={set}
                  onChange={(patch) => actions.updateSet(exerciseId, set.id, patch)}
                />
              ))}
            </View>
          </ReanimatedSwipeable>
        </Animated.View>
      ))}

      {/* Plain Pressable, label spanning the button: sized to its text, Android drew it as "Add". */}
      <Pressable
        onPress={() => actions.addSet(exerciseId)}
        style={({ pressed }) => [styles.addSet, pressed && styles.addSetPressed]}
        accessibilityRole="button"
      >
        <AppText variant="bold" align="center" style={styles.addSetLabel}>
          + Add set
        </AppText>
      </Pressable>

      {/* Drawn last so it sits over the set rows; a border would change the layout. */}
      {color ? <View style={[styles.stripe, { backgroundColor: color }]} /> : null}

      <OptionsSheet
        visible={menu === "main"}
        title={exercise.name}
        onClose={() => setMenu(null)}
        options={[
          ...(isFirst
            ? []
            : [{ label: "Move up", onPress: () => actions.moveExercise(exerciseId, -1) }]),
          ...(isLast
            ? []
            : [{ label: "Move down", onPress: () => actions.moveExercise(exerciseId, 1) }]),
          ...(isLast || linkedBelow
            ? []
            : [
                {
                  label: "Superset with next exercise",
                  onPress: () => actions.linkSuperset(exerciseId),
                },
              ]),
          ...(superset.letter
            ? [{ label: "Remove from superset", onPress: () => actions.unlinkSuperset(exerciseId) }]
            : []),
          { label: "Rest timer", onPress: () => setTimeout(() => setMenu("rest"), 250) },
          {
            label: "Remove exercise",
            destructive: true,
            onPress: () => actions.removeExercise(exerciseId),
          },
        ]}
      />
      <OptionsSheet
        visible={menu === "rest"}
        title="Rest after each set"
        onClose={() => setMenu(null)}
        options={[
          {
            label: `Default (${formatClock(defaultRestSeconds)})`,
            selected: exercise.restSeconds === null,
            onPress: () => actions.setRestSeconds(exerciseId, null),
          },
          ...REST_OPTIONS.map((seconds) => ({
            label: seconds === 0 ? "Off" : formatClock(seconds),
            selected: exercise.restSeconds === seconds,
            onPress: () => actions.setRestSeconds(exerciseId, seconds),
          })),
        ]}
      />
      <OptionsSheet
        visible={typeMenuFor !== null}
        title="Set type"
        onClose={() => setTypeMenuFor(null)}
        options={
          typeMenuFor
            ? [
                ...(["normal", "warmup", "dropset", "failure"] as const).map((type) => ({
                  label: SET_TYPE_LABELS[type],
                  selected: typeMenuFor.type === type,
                  onPress: () => actions.updateSet(exerciseId, typeMenuFor.id, { type }),
                })),
                {
                  label: "Delete set",
                  destructive: true,
                  onPress: () => actions.removeSet(exerciseId, typeMenuFor.id),
                },
              ]
            : []
        }
      />
    </Card>
  );
}

/** A routine target: reps take a range, time reads as a clock, the rest are plain numbers. */
function TargetField({
  column,
  set,
  onChange,
}: {
  column: SetColumn;
  set: RoutineDraftSet;
  onChange: (patch: Partial<RoutineDraftSet>) => void;
}) {
  if (column.key === "reps") {
    return (
      <RepRangeInput
        value={{ reps: set.reps, repsMax: set.repsMax }}
        onChange={onChange}
        placeholder="-"
        accessibilityLabel="Reps or rep range"
        style={styles.flex}
      />
    );
  }
  if (column.kind === "duration") {
    return (
      <DurationInput
        value={set.durationSeconds}
        onChange={(durationSeconds) => onChange({ durationSeconds })}
        placeholder="-"
        accessibilityLabel="Target time"
        style={styles.flex}
      />
    );
  }
  return (
    <NumberInput
      value={column.read({ ...set, durationSeconds: set.durationSeconds })}
      onChange={(value) => {
        const patch = column.write(value);
        onChange({
          ...(patch.weightKg !== undefined ? { weightKg: patch.weightKg } : {}),
          ...(patch.distanceMeters !== undefined ? { distanceMeters: patch.distanceMeters } : {}),
        });
      }}
      decimals={column.decimals}
      placeholder="-"
      accessibilityLabel={column.label}
      style={styles.flex}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  stripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
  },
  title: {
    flex: 1,
    gap: 6,
  },
  menuButton: {
    alignSelf: "flex-start",
    paddingTop: 4,
  },
  rest: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: 4,
    paddingBottom: 4,
  },
  labelColumn: {
    width: 34,
  },
  flex: {
    flex: 1,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 5,
    backgroundColor: Colors.surface,
  },
  setLabel: {
    width: 34,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.sm,
    borderCurve: "continuous",
  },
  delete: {
    width: 76,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.error,
  },
  addSetLabel: {
    alignSelf: "stretch",
  },
  addSetPressed: {
    backgroundColor: Colors.surfaceAlt,
  },
  addSet: {
    justifyContent: "center",
    backgroundColor: Colors.surfaceRaised,
    margin: 12,
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: Radii.md,
    borderCurve: "continuous",
  },
});
