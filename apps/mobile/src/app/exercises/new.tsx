import type { TrackingType } from "@griplog/core";
import { useRouter } from "expo-router";
import { X } from "lucide-react-native";
import { useState } from "react";
import { ScrollView, StyleSheet, View } from "react-native";

import {
  AppText,
  Button,
  Chip,
  IconButton,
  Screen,
  ScreenHeader,
  SegmentedControl,
  TextField,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { EQUIPMENT, MUSCLE_GROUPS } from "@/features/exercises/catalogue";
import { createCustomExercise } from "@/features/exercises/repository";

const TRACKING = [
  { value: "weight_reps", label: "Weight" },
  { value: "reps", label: "Reps" },
  { value: "duration", label: "Time" },
  { value: "distance_duration", label: "Cardio" },
] as const;

export default function NewExerciseScreen() {
  const router = useRouter();
  const db = useDatabase();
  const [name, setName] = useState("");
  const [trackingType, setTrackingType] = useState<TrackingType>("weight_reps");
  const [equipment, setEquipment] = useState<string | null>(null);
  const [muscle, setMuscle] = useState<string | null>(null);

  const save = () => {
    const id = createCustomExercise(db, { name, trackingType, equipment, primaryMuscle: muscle });
    router.replace(`/exercises/${encodeURIComponent(id)}`);
  };

  return (
    <Screen scroll sheet>
      <ScreenHeader
        eyebrow="Custom"
        title="New exercise"
        right={<IconButton icon={X} label="Close" onPress={() => router.back()} />}
      />
      <TextField
        label="Name"
        value={name}
        onChangeText={setName}
        placeholder="Archer push up"
        autoFocus
      />

      <View style={styles.group}>
        <AppText variant="label" color={Colors.muted}>
          Measured by
        </AppText>
        <SegmentedControl options={TRACKING} value={trackingType} onChange={setTrackingType} />
      </View>

      <ChipGroup label="Equipment" options={EQUIPMENT} value={equipment} onChange={setEquipment} />
      <ChipGroup
        label="Primary muscle"
        options={MUSCLE_GROUPS}
        value={muscle}
        onChange={setMuscle}
      />

      <Button
        label="Create exercise"
        size="lg"
        disabled={name.trim().length === 0}
        onPress={save}
      />
    </Screen>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <View style={styles.group}>
      <AppText variant="label" color={Colors.muted}>
        {label}
      </AppText>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {options.map((option) => (
          <Chip
            key={option}
            label={option}
            selected={value === option}
            onPress={() => onChange(value === option ? null : option)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  group: {
    gap: Spacing.sm,
  },
  chips: {
    gap: 6,
  },
});
