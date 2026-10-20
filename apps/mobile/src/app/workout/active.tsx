import { formatNumber, toDisplayWeight } from "@griplog/core";
import { useRouter } from "expo-router";
import { ChevronDown, Dumbbell, Plus, Trash2 } from "lucide-react-native";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  View,
} from "react-native";
import Animated, { FadeInDown, LinearTransition } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useShallow } from "zustand/react/shallow";

import { Button, Card, EmptyState, IconButton, Stat } from "@/components/ui";
import { BorderWidth, Colors, Fonts, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { nowIso } from "@/db/ids";
import {
  completedSets,
  incompleteSetCount,
  toWorkoutInput,
  workoutTotals,
} from "@/features/active-workout/draft";
import { ElapsedTime } from "@/features/active-workout/ElapsedTime";
import { ExerciseBlock } from "@/features/active-workout/ExerciseBlock";
import { RestTimerBar } from "@/features/active-workout/RestTimerBar";
import { useActiveWorkout } from "@/features/active-workout/use-active-workout";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { saveWorkout } from "@/features/workouts/repository";
import { confirm, notify } from "@/lib/dialog";

export default function ActiveWorkoutScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { unit } = usePreferences();
  const insets = useSafeAreaInsets();

  // Narrow selectors: this screen re-renders when exercises are added or
  // reordered, not when a weight is typed into a set row.
  const exerciseIds = useActiveWorkout(
    useShallow((s) => s.workout?.exercises.map((e) => e.id) ?? []),
  );
  const title = useActiveWorkout((s) => s.workout?.title);
  const notes = useActiveWorkout((s) => s.workout?.notes);
  const startedAt = useActiveWorkout((s) => s.workout?.startedAt);
  const totals = useActiveWorkout(
    useShallow((s) => (s.workout ? workoutTotals(s.workout) : { sets: 0, volumeKg: 0 })),
  );
  const { rename, setNotes } = useActiveWorkout.getState();

  if (title === undefined || !startedAt) {
    return (
      <SafeAreaView style={styles.empty}>
        <EmptyState
          icon={Dumbbell}
          title="No workout running"
          message="Start one from the Workout tab."
          action={<Button label="Close" variant="secondary" onPress={() => router.back()} />}
        />
      </SafeAreaView>
    );
  }

  const finish = () => {
    const workout = useActiveWorkout.getState().workout;
    if (!workout) return;
    if (completedSets(workout).length === 0) {
      notify("Nothing to save yet", "Tick at least one set as done before finishing.");
      return;
    }
    const save = () => {
      try {
        saveWorkout(db, toWorkoutInput(workout, nowIso()));
        useActiveWorkout.getState().discard();
        router.replace({ pathname: "/workout/summary", params: { id: workout.id } });
      } catch (error) {
        notify(
          "Could not save the workout",
          error instanceof Error ? error.message : String(error),
        );
      }
    };
    const incomplete = incompleteSetCount(workout);
    if (incomplete === 0) {
      save();
      return;
    }
    confirm({
      title: "Finish workout?",
      message: `${incomplete} unticked ${incomplete === 1 ? "set" : "sets"} will not be saved.`,
      confirmLabel: "Finish",
      onConfirm: save,
    });
  };

  const discard = () =>
    confirm({
      title: "Discard workout?",
      message: "Everything logged in this session will be lost.",
      confirmLabel: "Discard",
      destructive: true,
      onConfirm: () => {
        useActiveWorkout.getState().discard();
        router.back();
      },
    });

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <View style={styles.topBar}>
        <IconButton icon={ChevronDown} label="Minimise workout" onPress={() => router.back()} />
        <ElapsedTime startedAt={startedAt} />
        <Button label="Finish" size="sm" onPress={finish} testID="finish-workout" />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 140 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <TextInput
            value={title}
            onChangeText={rename}
            style={styles.title}
            placeholder="Workout title"
            placeholderTextColor={Colors.faint}
            selectionColor={Colors.accent}
            accessibilityLabel="Workout title"
          />
          <TextInput
            value={notes ?? ""}
            onChangeText={setNotes}
            style={styles.notes}
            placeholder="How did it feel?"
            placeholderTextColor={Colors.faint}
            selectionColor={Colors.accent}
            multiline
          />

          <Card style={styles.stats}>
            <Stat
              label="Volume"
              value={formatNumber(toDisplayWeight(totals.volumeKg, unit), 0)}
              unit={unit}
            />
            <Stat label="Sets done" value={String(totals.sets)} />
            <Stat label="Exercises" value={String(exerciseIds.length)} />
          </Card>

          {exerciseIds.map((id, index) => (
            <Animated.View key={id} entering={FadeInDown.duration(250)} layout={LinearTransition}>
              <ExerciseBlock
                exerciseId={id}
                unit={unit}
                isFirst={index === 0}
                isLast={index === exerciseIds.length - 1}
              />
            </Animated.View>
          ))}

          <Button
            label="Add exercise"
            icon={Plus}
            size="lg"
            onPress={() =>
              router.push({ pathname: "/workout/pick-exercise", params: { target: "workout" } })
            }
            testID="add-exercise"
          />
          <Button label="Discard workout" icon={Trash2} variant="danger" onPress={discard} />
        </ScrollView>
      </KeyboardAvoidingView>

      <RestTimerBar bottomInset={insets.bottom} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  empty: {
    flex: 1,
    justifyContent: "center",
    padding: Spacing.lg,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderBottomWidth: BorderWidth.thick,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  title: {
    color: Colors.text,
    fontFamily: Fonts.display,
    fontSize: 30,
    letterSpacing: -1,
    textTransform: "uppercase",
    paddingVertical: 0,
  },
  notes: {
    marginTop: -Spacing.sm,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 15,
    paddingVertical: 0,
  },
  stats: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
});
