import { formatClock, setNumbers, type WeightUnit } from "@griplog/core";
import { useRouter } from "expo-router";
import { MoreHorizontal, Plus, Timer } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";

import { AppText, Card, OptionsSheet } from "@/components/ui";
import { Colors, Fonts, Radii, Spacing } from "@/constants/theme";
import { ExerciseImage } from "@/features/exercises/ExerciseImage";
import { confirm } from "@/lib/dialog";

import { columnsFor } from "./columns";
import { SET_ROW_COLUMNS, SetRow } from "./SetRow";
import { useActiveWorkout } from "./use-active-workout";

const REST_OPTIONS = [0, 30, 60, 90, 120, 150, 180, 240, 300];

type ExerciseBlockProps = {
  exerciseId: string;
  unit: WeightUnit;
  isFirst: boolean;
  isLast: boolean;
};

export function ExerciseBlock({ exerciseId, unit, isFirst, isLast }: ExerciseBlockProps) {
  const router = useRouter();
  const exercise = useActiveWorkout((state) =>
    state.workout?.exercises.find((e) => e.id === exerciseId),
  );
  const actions = useActiveWorkout.getState();
  const [menu, setMenu] = useState<"main" | "rest" | null>(null);

  if (!exercise) return null;

  const columns = columnsFor(exercise.trackingType, unit);
  const numbers = setNumbers(exercise.sets);

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.titleArea}
          onPress={() => router.push(`/exercises/${encodeURIComponent(exercise.exerciseId)}`)}
          accessibilityRole="link"
          accessibilityLabel={exercise.name}
        >
          <ExerciseImage
            exerciseId={exercise.exerciseId}
            trackingType={exercise.trackingType}
            name={exercise.name}
            style={styles.thumb}
          />
          <AppText variant="heading" color={Colors.accent} numberOfLines={2} style={styles.flex}>
            {exercise.name}
          </AppText>
        </Pressable>
        <Pressable
          onPress={() => setMenu("main")}
          accessibilityRole="button"
          accessibilityLabel={`${exercise.name} options`}
          hitSlop={8}
          style={styles.menuButton}
        >
          <MoreHorizontal color={Colors.muted} size={22} strokeWidth={2} />
        </Pressable>
      </View>

      <TextInput
        keyboardAppearance="dark"
        value={exercise.notes ?? ""}
        onChangeText={(notes) => actions.setExerciseNotes(exerciseId, notes)}
        placeholder="Add notes"
        placeholderTextColor={Colors.faint}
        selectionColor={Colors.accent}
        style={styles.notes}
        multiline
      />

      <Pressable onPress={() => setMenu("rest")} style={styles.rest} accessibilityRole="button">
        <Timer color={Colors.accent} size={14} strokeWidth={2} />
        <AppText variant="label" color={Colors.accent}>
          Rest timer: {exercise.restSeconds > 0 ? formatClock(exercise.restSeconds) : "off"}
        </AppText>
      </Pressable>

      <View style={styles.tableHeader}>
        <AppText
          variant="caption"
          color={Colors.faint}
          style={{ width: SET_ROW_COLUMNS.label }}
          align="center"
        >
          Set
        </AppText>
        <AppText variant="caption" color={Colors.faint} style={styles.flex}>
          Previous
        </AppText>
        {columns.map((column) => (
          <AppText
            key={column.key}
            variant="caption"
            color={Colors.faint}
            style={{ width: SET_ROW_COLUMNS.input }}
            align="center"
          >
            {column.label}
          </AppText>
        ))}
        <View style={{ width: SET_ROW_COLUMNS.check }} />
      </View>

      <View>
        {exercise.sets.map((set, index) => (
          <SetRow
            key={set.id}
            exerciseId={exerciseId}
            setId={set.id}
            workingIndex={numbers[index] ?? 0}
            previous={exercise.previous[index]}
            trackingType={exercise.trackingType}
            unit={unit}
          />
        ))}
      </View>

      <Pressable
        onPress={() => actions.addSet(exerciseId)}
        style={({ pressed }) => [styles.addSet, pressed && { backgroundColor: Colors.surfaceAlt }]}
        accessibilityRole="button"
        testID={`add-set-${exerciseId}`}
      >
        <Plus color={Colors.text} size={16} strokeWidth={2.4} />
        <AppText variant="bold">Add set</AppText>
      </Pressable>

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
          { label: "Rest timer", onPress: () => setTimeout(() => setMenu("rest"), 250) },
          {
            label: "Remove exercise",
            destructive: true,
            onPress: () =>
              confirm({
                title: `Remove ${exercise.name}?`,
                message: "Its sets in this workout will be lost.",
                confirmLabel: "Remove",
                destructive: true,
                onConfirm: () => actions.removeExercise(exerciseId),
              }),
          },
        ]}
      />
      <OptionsSheet
        visible={menu === "rest"}
        title="Rest after each set"
        onClose={() => setMenu(null)}
        options={REST_OPTIONS.map((seconds) => ({
          label: seconds === 0 ? "Off" : formatClock(seconds),
          selected: exercise.restSeconds === seconds,
          onPress: () => actions.setRestSeconds(exerciseId, seconds),
        }))}
      />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
  },
  titleArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: Radii.sm,
  },
  menuButton: {
    paddingTop: 12,
  },
  notes: {
    marginHorizontal: Spacing.lg,
    paddingVertical: 4,
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontSize: 14,
  },
  rest: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    marginHorizontal: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  tableHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 4,
  },
  flex: {
    flex: 1,
  },
  addSet: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    margin: 12,
    marginTop: 8,
    paddingVertical: 11,
    borderRadius: 12,
    backgroundColor: Colors.surfaceRaised,
  },
});
