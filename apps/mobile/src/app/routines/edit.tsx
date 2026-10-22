import { useRouter } from "expo-router";
import { ChevronLeft, ClipboardList, Plus } from "lucide-react-native";
import { useEffect } from "react";
import { BackHandler, StyleSheet, TextInput, View } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useShallow } from "zustand/react/shallow";

import {
  AppText,
  Button,
  EmptyState,
  IconButton,
  KeyboardToolbar,
  Screen,
  useScreenInsets,
} from "@/components/ui";
import { Colors, Fonts, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { saveRoutine } from "@/features/routines/repository";
import { RoutineExerciseCard } from "@/features/routines/RoutineExerciseCard";
import { toRoutineInputFromDraft, useRoutineDraft } from "@/features/routines/routine-draft";
import { confirm } from "@/lib/dialog";

export default function RoutineEditorScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { top } = useScreenInsets();
  const { unit, defaultRestSeconds } = usePreferences();
  // The list of exercises only; each card subscribes to its own targets.
  const exerciseIds = useRoutineDraft(
    useShallow((state) => state.draft?.exercises.map((e) => e.id) ?? []),
  );
  const name = useRoutineDraft((state) => state.draft?.name);
  const isNew = useRoutineDraft((state) => state.draft?.isNew ?? true);
  const actions = useRoutineDraft.getState();

  const close = () => {
    actions.close();
    router.back();
  };

  // Leaving with unsaved work asks first, from the back button and from Android's back key.
  const leave = () => {
    const draft = useRoutineDraft.getState().draft;
    const touched = draft && (draft.name.trim() !== "" || draft.exercises.length > 0);
    if (!touched) {
      close();
      return;
    }
    confirm({
      title: isNew ? "Discard this routine?" : "Discard your changes?",
      message: "What you set up here will be lost.",
      confirmLabel: "Discard",
      destructive: true,
      onConfirm: close,
    });
  };

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      leave();
      return true;
    });
    return () => subscription.remove();
  });

  if (name === undefined) {
    return (
      <Screen>
        <Button label="Close" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const canSave = name.trim().length > 0 && exerciseIds.length > 0;
  const save = () => {
    const draft = useRoutineDraft.getState().draft;
    if (!draft) return;
    saveRoutine(db, toRoutineInputFromDraft(draft));
    close();
  };
  const addExercises = () =>
    router.push({ pathname: "/workout/pick-exercise", params: { target: "routine" } });

  return (
    <View style={styles.root}>
      <View style={[styles.topBar, { paddingTop: top + Spacing.sm }]}>
        <IconButton icon={ChevronLeft} label="Back" onPress={leave} />
        <AppText variant="bold">{isNew ? "New routine" : "Edit routine"}</AppText>
        <Button label="Save" size="sm" disabled={!canSave} onPress={save} testID="save-routine" />
      </View>

      <Screen scroll edges={[]}>
        <TextInput
          value={name}
          onChangeText={actions.rename}
          placeholder="Routine name"
          placeholderTextColor={Colors.faint}
          selectionColor={Colors.accent}
          keyboardAppearance="dark"
          returnKeyType="done"
          autoFocus={isNew}
          style={styles.name}
          accessibilityLabel="Routine name"
          testID="routine-name"
        />

        {exerciseIds.length === 0 ? (
          <EmptyState
            icon={ClipboardList}
            title="No exercises yet"
            message="Add the lifts you do on this day. Set targets per set, rep ranges and supersets after."
          />
        ) : (
          <AppText variant="label" color={Colors.faint}>
            Type a range like 8-12 for reps. Link exercises into a superset from the ••• menu.
          </AppText>
        )}

        {exerciseIds.map((id, index) => (
          <Animated.View key={id} entering={FadeInDown.duration(260)}>
            <RoutineExerciseCard
              exerciseId={id}
              unit={unit}
              defaultRestSeconds={defaultRestSeconds}
              isFirst={index === 0}
              isLast={index === exerciseIds.length - 1}
            />
          </Animated.View>
        ))}

        <Button
          label="Add exercises"
          icon={Plus}
          size="lg"
          variant={exerciseIds.length === 0 ? "primary" : "secondary"}
          onPress={addExercises}
        />
        <KeyboardToolbar />
      </Screen>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.hairline,
  },
  name: {
    color: Colors.text,
    fontFamily: Fonts.bold,
    fontSize: 30,
    letterSpacing: -0.6,
    paddingVertical: 0,
  },
});
