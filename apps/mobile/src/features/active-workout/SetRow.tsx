import { formatClock, setLabel, type TrackingType, type WeightUnit } from "@griplog/core";
import * as Haptics from "expo-haptics";
import { Check } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet } from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { AppText, DurationInput, NumberInput, OptionsSheet, SwipeToDelete } from "@/components/ui";
import { Colors, Radii } from "@/constants/theme";
import type { PreviousSet } from "@/features/exercises/repository";
import { playSound } from "@/lib/sounds";

import { columnsFor, formatPrevious, type SetColumn } from "./columns";
import type { DraftSet } from "./store";
import { useActiveWorkout } from "./use-active-workout";

export const SET_TYPE_STYLES = {
  normal: { background: Colors.surfaceAlt, ink: Colors.text },
  warmup: { background: Colors.goldSoft, ink: Colors.gold },
  dropset: { background: "rgba(140, 120, 255, 0.16)", ink: "#A99BFF" },
  failure: { background: Colors.accentSoft, ink: Colors.accent },
} as const;

export const SET_TYPE_LABELS = {
  normal: "Normal set",
  warmup: "Warm-up",
  dropset: "Drop set",
  failure: "To failure",
} as const;

const RPE_VALUES = [6, 7, 7.5, 8, 8.5, 9, 9.5, 10];

type SetRowProps = {
  exerciseId: string;
  setId: string;
  /** Position among working sets, for the label. */
  workingIndex: number;
  previous: PreviousSet | undefined;
  trackingType: TrackingType;
  unit: WeightUnit;
};

/** The grey hint inside an empty field: the routine's rep range, else last time's value. */
function hintFor(column: SetColumn, set: DraftSet, previous: PreviousSet | undefined): string {
  if (column.key === "reps" && set.repsRange) return `${set.repsRange.min}-${set.repsRange.max}`;
  const value = previous ? column.read({ ...previous, distanceMeters: null }) : null;
  if (value === null) return "-";
  return column.kind === "duration" ? formatClock(value) : String(value);
}

export function SetRow({
  exerciseId,
  setId,
  workingIndex,
  previous,
  trackingType,
  unit,
}: SetRowProps) {
  // Subscribe to this one set: typing here re-renders this row only.
  const set = useActiveWorkout((state) =>
    state.workout?.exercises.find((e) => e.id === exerciseId)?.sets.find((s) => s.id === setId),
  );
  const updateSet = useActiveWorkout((state) => state.updateSet);
  const toggle = useActiveWorkout((state) => state.toggleSetCompleted);
  const removeSet = useActiveWorkout((state) => state.removeSet);
  const [menu, setMenu] = useState<"type" | "rpe" | null>(null);

  const completed = set?.completed ?? false;
  const done = useSharedValue(completed ? 1 : 0);
  const checkScale = useSharedValue(1);
  useEffect(() => {
    done.set(withTiming(completed ? 1 : 0, { duration: 240 }));
  }, [completed, done]);

  // The row washes green and the check pops when a set is ticked.
  const rowStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(done.value, [0, 1], [Colors.surface, Colors.successRow]),
  }));
  const checkStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(done.value, [0, 1], [Colors.surfaceAlt, Colors.success]),
    transform: [{ scale: checkScale.value }],
  }));

  if (!set) return null;

  const columns = columnsFor(trackingType, unit);
  const typeStyle = SET_TYPE_STYLES[set.type];

  const fillFromPrevious = () => {
    if (!previous) return;
    Haptics.selectionAsync().catch(() => {});
    updateSet(exerciseId, setId, {
      weightKg: previous.weightKg,
      reps: previous.reps,
      durationSeconds: previous.durationSeconds,
    });
  };

  const onCheck = () => {
    if (!set.completed) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      playSound("tick");
      checkScale.set(
        withSequence(
          withTiming(0.82, { duration: 80 }),
          withSpring(1, { damping: 9, stiffness: 320 }),
        ),
      );
    }
    toggle(exerciseId, setId);
  };

  return (
    <>
      <SwipeToDelete onDelete={() => removeSet(exerciseId, setId)} accessibilityLabel="Delete set">
        <Animated.View style={[styles.row, rowStyle]} testID={`set-row-${setId}`}>
          <Pressable
            onPress={() => setMenu("type")}
            accessibilityRole="button"
            accessibilityLabel={`Set ${setLabel(set.type, workingIndex)} options`}
            hitSlop={4}
            style={[styles.label, { backgroundColor: typeStyle.background }]}
          >
            <AppText variant="bold" color={typeStyle.ink} style={styles.labelText}>
              {setLabel(set.type, workingIndex)}
            </AppText>
          </Pressable>

          <Pressable
            onPress={fillFromPrevious}
            style={styles.previous}
            accessibilityLabel="Use previous values"
          >
            <AppText variant="mono" color={Colors.muted} numberOfLines={1}>
              {formatPrevious(previous, trackingType, unit)}
            </AppText>
            {set.rpe !== null ? (
              <AppText variant="label" color={Colors.accent}>
                @{set.rpe}
              </AppText>
            ) : null}
          </Pressable>

          {columns.map((column) =>
            column.kind === "duration" ? (
              <DurationInput
                key={column.key}
                value={column.read(set)}
                onChange={(value) => updateSet(exerciseId, setId, column.write(value))}
                placeholder={hintFor(column, set, previous)}
                accessibilityLabel={column.label}
                testID={`input-${column.key}-${setId}`}
                style={[styles.input, set.completed && styles.inputCompleted]}
              />
            ) : (
              <NumberInput
                key={column.key}
                value={column.read(set)}
                onChange={(value) => updateSet(exerciseId, setId, column.write(value))}
                placeholder={hintFor(column, set, previous)}
                decimals={column.decimals}
                accessibilityLabel={column.label}
                testID={`input-${column.key}-${setId}`}
                style={[styles.input, set.completed && styles.inputCompleted]}
              />
            ),
          )}

          <Pressable
            onPress={onCheck}
            accessibilityRole="checkbox"
            accessibilityState={{ checked: set.completed }}
            accessibilityLabel="Complete set"
            testID={`complete-${setId}`}
            hitSlop={6}
          >
            <Animated.View style={[styles.check, checkStyle]}>
              <Check
                color={set.completed ? Colors.background : Colors.faint}
                size={18}
                strokeWidth={3.5}
              />
            </Animated.View>
          </Pressable>
        </Animated.View>
      </SwipeToDelete>

      <OptionsSheet
        visible={menu === "type"}
        title="Set type"
        onClose={() => setMenu(null)}
        options={[
          ...(["normal", "warmup", "dropset", "failure"] as const).map((type) => ({
            label: SET_TYPE_LABELS[type],
            selected: set.type === type,
            onPress: () => updateSet(exerciseId, setId, { type }),
          })),
          {
            label: set.rpe === null ? "Add RPE" : `RPE ${set.rpe}`,
            onPress: () => setTimeout(() => setMenu("rpe"), 250),
          },
          { label: "Delete set", destructive: true, onPress: () => removeSet(exerciseId, setId) },
        ]}
      />
      <OptionsSheet
        visible={menu === "rpe"}
        title="Rate of perceived exertion"
        onClose={() => setMenu(null)}
        options={[
          ...RPE_VALUES.map((rpe) => ({
            label: `RPE ${rpe}`,
            selected: set.rpe === rpe,
            onPress: () => updateSet(exerciseId, setId, { rpe }),
          })),
          { label: "Clear RPE", onPress: () => updateSet(exerciseId, setId, { rpe: null }) },
        ]}
      />
    </>
  );
}

export const SET_ROW_COLUMNS = {
  label: 34,
  check: 38,
  input: 64,
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  label: {
    width: SET_ROW_COLUMNS.label,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.sm,
    borderCurve: "continuous",
  },
  labelText: {
    fontSize: 14,
  },
  previous: {
    flex: 1,
    minWidth: 0,
  },
  input: {
    width: SET_ROW_COLUMNS.input,
  },
  inputCompleted: {
    backgroundColor: "transparent",
  },
  check: {
    width: SET_ROW_COLUMNS.check,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.sm,
    borderCurve: "continuous",
  },
});
