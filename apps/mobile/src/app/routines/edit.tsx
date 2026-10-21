import { useRouter } from "expo-router";
import { Plus, X } from "lucide-react-native";
import { StyleSheet } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useShallow } from "zustand/react/shallow";

import {
  AppText,
  Button,
  IconButton,
  KeyboardToolbar,
  Screen,
  ScreenHeader,
  TextField,
} from "@/components/ui";
import { Colors } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { saveRoutine } from "@/features/routines/repository";
import { RoutineExerciseCard } from "@/features/routines/RoutineExerciseCard";
import { toRoutineInputFromDraft, useRoutineDraft } from "@/features/routines/routine-draft";

export default function RoutineEditorScreen() {
  const router = useRouter();
  const db = useDatabase();
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

  if (name === undefined) {
    return (
      <Screen sheet>
        <Button label="Close" variant="secondary" onPress={() => router.back()} />
      </Screen>
    );
  }

  const save = () => {
    const draft = useRoutineDraft.getState().draft;
    if (!draft) return;
    saveRoutine(db, toRoutineInputFromDraft(draft));
    close();
  };

  return (
    <Screen scroll sheet>
      <ScreenHeader
        eyebrow="Routine"
        title={isNew ? "New routine" : "Edit routine"}
        right={<IconButton icon={X} label="Cancel" onPress={close} />}
      />
      <TextField
        label="Name"
        value={name}
        onChangeText={actions.rename}
        placeholder="Push day"
        testID="routine-name"
      />

      {exerciseIds.length > 0 ? (
        <AppText variant="label" color={Colors.faint}>
          Type a range like 8-12 for reps. Link exercises into a superset from the ••• menu.
        </AppText>
      ) : null}

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

      <Animated.View style={styles.actions}>
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
          disabled={name.trim().length === 0 || exerciseIds.length === 0}
          onPress={save}
          testID="save-routine"
        />
      </Animated.View>
      <KeyboardToolbar />
    </Screen>
  );
}

const styles = StyleSheet.create({
  actions: {
    gap: 12,
  },
});
