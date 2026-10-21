import { formatClock, setNumbers, type WeightUnit } from "@griplog/core";
import { useRouter } from "expo-router";
import { MoreHorizontal, Plus, Timer } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeOut } from "react-native-reanimated";
import { useShallow } from "zustand/react/shallow";

import { AppText, Card, OptionsSheet, PressableScale } from "@/components/ui";
import { Colors, Fonts, Radii, Spacing, supersetColor } from "@/constants/theme";
import { ExerciseImage } from "@/features/exercises/ExerciseImage";
import { confirm } from "@/lib/dialog";

import { columnsFor } from "./columns";
import { SET_ROW_COLUMNS, SetRow } from "./SetRow";
import { SupersetBadge } from "./SupersetBadge";
import { supersetLetters, supersetPosition } from "./supersets";
import { useActiveWorkout } from "./use-active-workout";

export const REST_OPTIONS = [0, 30, 60, 90, 120, 150, 180, 240, 300];

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
  // Only the superset layout, so typing in another exercise does not re-render this one.
  const superset = useActiveWorkout(
    useShallow((state) => {
      const groups = (state.workout?.exercises ?? []).map((e) => ({
        id: e.id,
        supersetId: e.supersetId ?? null,
      }));
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
  const actions = useActiveWorkout.getState();
  const [menu, setMenu] = useState<"main" | "rest" | null>(null);

  if (!exercise) return null;

  const columns = columnsFor(exercise.trackingType, unit);
  const numbers = setNumbers(exercise.sets);
  const color = superset.letter ? supersetColor(superset.index) : null;
  const linkedBelow = superset.position === "first" || superset.position === "middle";

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
            name={exercise.name}
            trackingType={exercise.trackingType}
            style={styles.thumb}
          />
          <View style={styles.titleText}>
            <AppText variant="heading" color={Colors.accent} numberOfLines={2}>
              {exercise.name}
            </AppText>
            {superset.letter && color ? (
              <SupersetBadge letter={superset.letter} color={color} />
            ) : null}
          </View>
        </Pressable>
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
        <Timer color={Colors.muted} size={14} strokeWidth={2} />
        <AppText variant="label" color={Colors.muted}>
          {linkedBelow
            ? "No rest within the superset"
            : `Rest ${exercise.restSeconds > 0 ? formatClock(exercise.restSeconds) : "off"}`}
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

      {exercise.sets.map((set, index) => (
        <Animated.View key={set.id} exiting={FadeOut}>
          <SetRow
            exerciseId={exerciseId}
            setId={set.id}
            workingIndex={numbers[index] ?? 0}
            previous={exercise.previous[index]}
            trackingType={exercise.trackingType}
            unit={unit}
          />
        </Animated.View>
      ))}

      <PressableScale
        onPress={() => actions.addSet(exerciseId)}
        scaleTo={0.98}
        background={{ idle: Colors.surfaceRaised, pressed: Colors.surfaceAlt }}
        style={styles.addSet}
        accessibilityRole="button"
        testID={`add-set-${exerciseId}`}
      >
        <Plus color={Colors.text} size={16} strokeWidth={2.4} />
        <AppText variant="bold">Add set</AppText>
      </PressableScale>

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
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  titleArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  titleText: {
    flex: 1,
    gap: 6,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: Radii.md,
  },
  menuButton: {
    alignSelf: "flex-start",
    paddingTop: 4,
  },
  notes: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
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
    marginTop: 2,
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
    borderRadius: Radii.md,
    borderCurve: "continuous",
  },
});
