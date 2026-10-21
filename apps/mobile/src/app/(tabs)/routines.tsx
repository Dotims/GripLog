import { useRouter } from "expo-router";
import { ClipboardList, Play, Plus, Upload } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import {
  Appear,
  AppText,
  Button,
  Card,
  EmptyState,
  Screen,
  ScreenHeader,
  SectionLabel,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useActiveWorkout } from "@/features/active-workout/use-active-workout";
import { useStartWorkout } from "@/features/active-workout/use-start-workout";
import { useRoutines } from "@/features/routines/hooks";
import { emptyRoutineDraft, useRoutineDraft } from "@/features/routines/routine-draft";

export default function WorkoutTab() {
  const router = useRouter();
  const routines = useRoutines();
  const hasActiveWorkout = useActiveWorkout((state) => state.workout !== null);
  const { startEmpty, startRoutine, resume } = useStartWorkout();

  const newRoutine = () => {
    useRoutineDraft.getState().open(emptyRoutineDraft());
    router.push("/routines/edit");
  };

  return (
    <Screen scroll>
      <ScreenHeader eyebrow="Train" title="Workout" />

      <View style={styles.quickStart}>
        <SectionLabel>Quick start</SectionLabel>
        {hasActiveWorkout ? (
          <Button label="Resume workout" icon={Play} size="lg" variant="dark" onPress={resume} />
        ) : (
          <Button
            label="Start empty workout"
            icon={Play}
            size="lg"
            onPress={startEmpty}
            testID="start-empty"
          />
        )}
      </View>

      <SectionLabel>Routines</SectionLabel>
      <View style={styles.actions}>
        <Button
          label="New routine"
          icon={Plus}
          variant="secondary"
          onPress={newRoutine}
          style={styles.flex}
        />
        <Button
          label="Import"
          icon={Upload}
          variant="secondary"
          onPress={() => router.push("/import")}
          style={styles.flex}
        />
      </View>

      {routines.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No routines"
          message="Save the workouts you repeat as routines and start them in one tap."
        />
      ) : (
        routines.map((routine, index) => (
          <Appear key={routine.id} index={index}>
            <Card onPress={() => router.push(`/routines/${routine.id}`)} style={styles.routine}>
              <View style={styles.routineText}>
                <AppText variant="title" numberOfLines={1}>
                  {routine.name}
                </AppText>
                <AppText color={Colors.muted} numberOfLines={2}>
                  {routine.exercises.map((e) => e.exercise.name).join(", ") || "No exercises yet"}
                </AppText>
              </View>
              <Button
                label="Start"
                size="sm"
                icon={Play}
                onPress={() => startRoutine(routine.id)}
                disabled={routine.exercises.length === 0}
              />
            </Card>
          </Appear>
        ))
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  quickStart: {
    gap: Spacing.md,
  },
  actions: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
  },
  routine: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  routineText: {
    flex: 1,
    gap: 4,
  },
});
