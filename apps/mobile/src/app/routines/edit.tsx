import { setLabel, setNumbers } from "@griplog/core";
import { useRouter } from "expo-router";
import { ArrowDown, ArrowUp, Plus, Trash2, X } from "lucide-react-native";
import { Pressable, StyleSheet, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  IconButton,
  NumberInput,
  Screen,
  ScreenHeader,
  TextField,
} from "@/components/ui";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { columnsFor } from "@/features/active-workout/columns";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { saveRoutine } from "@/features/routines/repository";
import { toRoutineInputFromDraft, useRoutineDraft } from "@/features/routines/routine-draft";

export default function RoutineEditorScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { unit } = usePreferences();
  const draft = useRoutineDraft((state) => state.draft);
  const actions = useRoutineDraft.getState();

  const close = () => {
    actions.close();
    router.back();
  };

  if (!draft) {
    return (
      <Screen sheet>
        <Button label="Close" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const save = () => {
    saveRoutine(db, toRoutineInputFromDraft(draft));
    close();
  };

  return (
    <Screen scroll sheet>
      <ScreenHeader
        eyebrow="Routine"
        title={draft.isNew ? "New routine" : "Edit routine"}
        right={<IconButton icon={X} label="Cancel" onPress={close} />}
      />
      <TextField
        label="Name"
        value={draft.name}
        onChangeText={actions.rename}
        placeholder="Push day"
        testID="routine-name"
      />

      {draft.exercises.map((exercise, index) => {
        // Routines store targets in the same columns as sets; only loaded and rep-based ones make sense here.
        const columns = columnsFor(exercise.trackingType, unit).filter(
          (column) => column.key === "weight" || column.key === "reps",
        );
        const numbers = setNumbers(exercise.sets);
        return (
          <Card key={exercise.id} style={styles.exercise}>
            <View style={styles.exerciseHeader}>
              <AppText variant="heading" style={styles.flex} numberOfLines={2}>
                {exercise.name}
              </AppText>
              {index > 0 ? (
                <IconButton
                  icon={ArrowUp}
                  tone="plain"
                  size={32}
                  label="Move up"
                  onPress={() => actions.moveExercise(exercise.id, -1)}
                />
              ) : null}
              {index < draft.exercises.length - 1 ? (
                <IconButton
                  icon={ArrowDown}
                  tone="plain"
                  size={32}
                  label="Move down"
                  onPress={() => actions.moveExercise(exercise.id, 1)}
                />
              ) : null}
              <IconButton
                icon={Trash2}
                tone="plain"
                size={32}
                label="Remove exercise"
                onPress={() => actions.removeExercise(exercise.id)}
              />
            </View>

            {exercise.sets.map((set, setIndex) => (
              <View key={set.id} style={styles.setRow}>
                <View style={styles.setLabel}>
                  <AppText variant="label">{setLabel(set.type, numbers[setIndex] ?? 0)}</AppText>
                </View>
                {columns.map((column) => (
                  <View key={column.key} style={styles.inputGroup}>
                    <NumberInput
                      value={column.read({ ...set, durationSeconds: null, distanceMeters: null })}
                      onChange={(value) => {
                        const patch = column.write(value);
                        actions.updateSet(exercise.id, set.id, {
                          ...(patch.weightKg !== undefined ? { weightKg: patch.weightKg } : {}),
                          ...(patch.reps !== undefined ? { reps: patch.reps } : {}),
                        });
                      }}
                      decimals={column.decimals}
                      placeholder="-"
                      accessibilityLabel={column.label}
                      style={styles.input}
                    />
                    <AppText variant="label" color={Colors.muted}>
                      {column.label}
                    </AppText>
                  </View>
                ))}
                <Pressable
                  onPress={() => actions.removeSet(exercise.id, set.id)}
                  accessibilityLabel="Remove set"
                  hitSlop={8}
                >
                  <X color={Colors.muted} size={18} strokeWidth={2} />
                </Pressable>
              </View>
            ))}

            <Pressable
              onPress={() => actions.addSet(exercise.id)}
              style={styles.addSet}
              accessibilityRole="button"
            >
              <Plus color={Colors.text} size={16} strokeWidth={3} />
              <AppText variant="bold">Add set</AppText>
            </Pressable>
          </Card>
        );
      })}

      <Button
        label="Add exercises"
        icon={Plus}
        variant="secondary"
        onPress={() =>
          router.push({ pathname: "/workout/pick-exercise", params: { target: "routine" } })
        }
      />
      <Button
        label="Save routine"
        size="lg"
        disabled={draft.name.trim().length === 0 || draft.exercises.length === 0}
        onPress={save}
        testID="save-routine"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  exercise: {
    overflow: "hidden",
  },
  exerciseHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    padding: Spacing.md,
    paddingLeft: Spacing.lg,
  },
  flex: {
    flex: 1,
  },
  setRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  setLabel: {
    width: 30,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.sm,
  },
  inputGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  input: {
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
