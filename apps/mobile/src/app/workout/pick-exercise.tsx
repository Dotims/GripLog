import { useLocalSearchParams, useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Button, IconButton, ScreenHeader } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { newDraftExercise } from "@/features/active-workout/draft";
import { useActiveWorkout } from "@/features/active-workout/use-active-workout";
import { ExerciseBrowser } from "@/features/exercises/ExerciseBrowser";
import { previousSets, type ExerciseListItem } from "@/features/exercises/repository";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { useRoutineDraft } from "@/features/routines/routine-draft";

export default function PickExerciseScreen() {
  const router = useRouter();
  const db = useDatabase();
  const insets = useSafeAreaInsets();
  const { defaultRestSeconds } = usePreferences();
  const { target } = useLocalSearchParams<{ target?: "workout" | "routine" }>();
  const [selected, setSelected] = useState<ExerciseListItem[]>([]);

  const toggle = (exercise: ExerciseListItem) =>
    setSelected((current) =>
      current.some((e) => e.id === exercise.id)
        ? current.filter((e) => e.id !== exercise.id)
        : [...current, exercise],
    );

  const add = () => {
    const infos = selected.map((e) => ({
      exerciseId: e.id,
      name: e.name,
      trackingType: e.trackingType,
    }));
    if (target === "routine") {
      useRoutineDraft.getState().addExercises(infos);
    } else {
      useActiveWorkout
        .getState()
        .addExercises(
          infos.map((info) =>
            newDraftExercise(info, previousSets(db, info.exerciseId), defaultRestSeconds),
          ),
        );
    }
    router.back();
  };

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <ExerciseBrowser
        onSelect={toggle}
        selectedIds={new Set(selected.map((e) => e.id))}
        bottomInset={96}
        header={
          <ScreenHeader
            eyebrow={target === "routine" ? "Routine" : "Workout"}
            title="Add exercises"
            right={<IconButton icon={X} label="Close" onPress={() => router.back()} />}
          />
        }
      />
      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.md }]}>
        <Button
          label={selected.length === 0 ? "Select exercises" : `Add ${selected.length}`}
          icon={Plus}
          size="lg"
          disabled={selected.length === 0}
          onPress={add}
          testID="confirm-exercises"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  footer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
});
