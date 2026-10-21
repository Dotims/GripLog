import { formatClock } from "@griplog/core";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Pencil, Play, Trash2 } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText, Button, Card, Screen } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { ExerciseImage } from "@/features/exercises/ExerciseImage";
import { useStartWorkout } from "@/features/active-workout/use-start-workout";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { useRoutine } from "@/features/routines/hooks";
import { deleteRoutine } from "@/features/routines/repository";
import { useRoutineDraft } from "@/features/routines/routine-draft";
import { formatSetValue } from "@/features/workouts/format-set";
import { confirm } from "@/lib/dialog";

export default function RoutineDetailScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { unit, defaultRestSeconds } = usePreferences();
  const { id } = useLocalSearchParams<{ id: string }>();
  const routine = useRoutine(id);
  const { startRoutine } = useStartWorkout();

  if (!routine || routine.deletedAt) {
    return (
      <Screen edges={[]}>
        <AppText color={Colors.muted} style={styles.missing}>
          This routine was deleted.
        </AppText>
      </Screen>
    );
  }

  const edit = () => {
    useRoutineDraft.getState().open({
      id: routine.id,
      name: routine.name,
      notes: routine.notes,
      isNew: false,
      exercises: routine.exercises.map((e) => ({
        id: e.id,
        exerciseId: e.exerciseId,
        name: e.exercise.name,
        trackingType: e.exercise.trackingType,
        restSeconds: e.restSeconds,
        notes: e.notes,
        sets: e.sets.map(({ id: setId, type, weightKg, reps }) => ({
          id: setId,
          type,
          weightKg,
          reps,
        })),
      })),
    });
    router.push("/routines/edit");
  };

  const remove = () =>
    confirm({
      title: `Delete ${routine.name}?`,
      message: "Workouts you already did from it stay in your history.",
      confirmLabel: "Delete",
      destructive: true,
      onConfirm: () => {
        deleteRoutine(db, routine.id);
        router.back();
      },
    });

  return (
    <Screen scroll edges={[]}>
      <View style={styles.heading}>
        <AppText variant="label" color={Colors.muted}>
          Routine · {routine.exercises.length} exercises
        </AppText>
        <AppText variant="display">{routine.name}</AppText>
        {routine.notes ? <AppText color={Colors.muted}>{routine.notes}</AppText> : null}
      </View>

      <Button
        label="Start routine"
        icon={Play}
        size="lg"
        onPress={() => startRoutine(routine.id)}
        disabled={routine.exercises.length === 0}
      />

      {routine.exercises.map((exercise) => (
        <Card key={exercise.id} style={styles.exercise}>
          <ExerciseImage
            exerciseId={exercise.exerciseId}
            trackingType={exercise.exercise.trackingType}
            name={exercise.exercise.name}
            style={styles.thumb}
          />
          <View style={styles.flex}>
            <AppText variant="heading">{exercise.exercise.name}</AppText>
            <AppText variant="label" color={Colors.muted}>
              {exercise.sets.length} sets · rest{" "}
              {formatClock(exercise.restSeconds ?? defaultRestSeconds)}
            </AppText>
            {exercise.sets.some((s) => s.weightKg !== null || s.reps !== null) ? (
              <AppText variant="mono" color={Colors.muted} numberOfLines={2}>
                {exercise.sets
                  .map((s) =>
                    formatSetValue(
                      { ...s, durationSeconds: null, distanceMeters: null },
                      exercise.exercise.trackingType,
                      unit,
                    ),
                  )
                  .join(", ")}
              </AppText>
            ) : null}
          </View>
        </Card>
      ))}

      <Button label="Edit routine" icon={Pencil} variant="secondary" onPress={edit} />
      <Button label="Delete routine" icon={Trash2} variant="danger" onPress={remove} />
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
  exercise: {
    flexDirection: "row",
    gap: Spacing.md,
    padding: Spacing.md,
    alignItems: "center",
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 14,
  },
  flex: {
    flex: 1,
    gap: 2,
  },
});
