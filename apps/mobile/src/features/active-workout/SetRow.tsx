import { setLabel, type TrackingType, type WeightUnit } from "@griplog/core";
import * as Haptics from "expo-haptics";
import { Check, Trash2 } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import ReanimatedSwipeable from "react-native-gesture-handler/ReanimatedSwipeable";

import { AppText, NumberInput, OptionsSheet } from "@/components/ui";
import { Colors, Radii } from "@/constants/theme";
import type { PreviousSet } from "@/features/exercises/repository";

import { columnsFor, formatPrevious } from "./columns";
import { useActiveWorkout } from "./use-active-workout";

const TYPE_STYLES = {
  normal: { background: Colors.surfaceAlt, ink: Colors.text },
  warmup: { background: Colors.goldSoft, ink: Colors.gold },
  dropset: { background: "rgba(140, 120, 255, 0.16)", ink: "#A99BFF" },
  failure: { background: Colors.accentSoft, ink: Colors.accent },
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

  if (!set) return null;

  const columns = columnsFor(trackingType, unit);
  const typeStyle = TYPE_STYLES[set.type];

  const fillFromPrevious = () => {
    if (!previous) return;
    Haptics.selectionAsync().catch(() => {});
    updateSet(exerciseId, setId, {
      weightKg: previous.weightKg,
      reps: previous.reps,
      durationSeconds: previous.durationSeconds,
    });
  };

  return (
    <ReanimatedSwipeable
      friction={2}
      rightThreshold={40}
      overshootRight={false}
      renderRightActions={() => (
        <Pressable
          onPress={() => removeSet(exerciseId, setId)}
          style={styles.delete}
          accessibilityRole="button"
          accessibilityLabel="Delete set"
        >
          <Trash2 color={Colors.accentInk} size={18} strokeWidth={2} />
        </Pressable>
      )}
    >
      <View style={[styles.row, set.completed && styles.completed]} testID={`set-row-${setId}`}>
        <Pressable
          onPress={() => setMenu("type")}
          accessibilityRole="button"
          accessibilityLabel={`Set ${setLabel(set.type, workingIndex)} options`}
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

        {columns.map((column) => (
          <NumberInput
            key={column.key}
            value={column.read(set)}
            onChange={(value) => updateSet(exerciseId, setId, column.write(value))}
            placeholder={
              previous ? String(column.read({ ...previous, distanceMeters: null }) ?? "") : "-"
            }
            decimals={column.decimals}
            accessibilityLabel={column.label}
            testID={`input-${column.key}-${setId}`}
            style={[styles.input, set.completed && styles.inputCompleted]}
          />
        ))}

        <Pressable
          onPress={() => {
            if (!set.completed) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
            }
            toggle(exerciseId, setId);
          }}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: set.completed }}
          accessibilityLabel="Complete set"
          testID={`complete-${setId}`}
          style={[styles.check, set.completed && styles.checkDone]}
        >
          <Check
            color={set.completed ? Colors.surface : Colors.faint}
            size={18}
            strokeWidth={3.5}
          />
        </Pressable>
      </View>

      <OptionsSheet
        visible={menu === "type"}
        title="Set type"
        onClose={() => setMenu(null)}
        options={[
          ...(["normal", "warmup", "dropset", "failure"] as const).map((type) => ({
            label: {
              normal: "Normal set",
              warmup: "Warm-up",
              dropset: "Drop set",
              failure: "To failure",
            }[type],
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
    </ReanimatedSwipeable>
  );
}

export const SET_ROW_COLUMNS = {
  label: 34,
  check: 36,
  input: 64,
};

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    backgroundColor: Colors.surface,
  },
  completed: {
    backgroundColor: Colors.successSoft,
  },
  label: {
    width: SET_ROW_COLUMNS.label,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.sm,
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
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.sm,
  },
  checkDone: {
    backgroundColor: Colors.success,
  },
  delete: {
    width: 76,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.error,
  },
});
