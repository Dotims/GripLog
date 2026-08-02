import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { BorderWidth, Colors, Fonts, Radii, Shadow } from "@/constants/theme";
import { fetchExerciseById } from "@/features/exercises/api";
import { Exercise } from "@/features/exercises/types";

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercise() {
      try {
        const fetchedExercise = await fetchExerciseById(id);
        setExercise(fetchedExercise);
      } catch (error) {
        console.error("Error fetching exercise:", error);
        setError(
          error instanceof Error ? error.message : "Nie udało się pobrać ćwiczenia",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadExercise();
  }, [id]);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.center}>
        <View style={styles.errorBox}>
          <Text style={styles.errorLabel}>ERROR</Text>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>No exercise found.</Text>
      </View>
    );
  }

  const specs = [
    { label: "Body Part", value: exercise.bodyParts.join(", ") },
    { label: "Equipment", value: exercise.equipments.join(", ") },
    { label: "Secondary", value: exercise.secondaryMuscles.join(", ") || "—" },
  ];

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }}
      />

      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <View style={styles.gifCard}>
          <Image
            source={{ uri: exercise.gifUrl }}
            style={styles.gif}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.name}>{exercise.name}</Text>

        <View style={styles.chipRow}>
          {exercise.targetMuscles.map((muscle) => (
            <View key={muscle} style={styles.chip}>
              <Text style={styles.chipText}>{muscle}</Text>
            </View>
          ))}
        </View>

        <View style={styles.sheet}>
          {specs.map((spec, index) => (
            <View
              key={spec.label}
              style={[styles.specRow, index > 0 && styles.specDivider]}
            >
              <Text style={styles.specLabel}>{spec.label}</Text>
              <Text style={styles.specValue}>{spec.value}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLabel}>Instructions</Text>
        <View style={styles.steps}>
          {exercise.instructions.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepNum}>
                <Text style={styles.stepNumText}>{index + 1}</Text>
              </View>
              <Text style={styles.stepText}>
                {step.replace(/^Step:\d+\s*/, "")}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    backgroundColor: Colors.background,
  },
  errorBox: {
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    boxShadow: Shadow.hard,
    padding: 16,
    gap: 6,
  },
  errorLabel: {
    color: Colors.accent,
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  errorText: {
    color: Colors.text,
    fontSize: 15,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  gifCard: {
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    boxShadow: Shadow.hardLg,
    overflow: "hidden",
  },
  gif: {
    width: "100%",
    aspectRatio: 1,
  },
  name: {
    color: Colors.text,
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: -1,
    lineHeight: 36,
    textTransform: "uppercase",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.accent,
    borderWidth: BorderWidth.hair,
    borderColor: Colors.border,
    borderRadius: Radii.chip,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  chipText: {
    color: Colors.accentInk,
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    boxShadow: Shadow.hard,
    overflow: "hidden",
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  specDivider: {
    borderTopWidth: BorderWidth.hair,
    borderTopColor: Colors.border,
  },
  specLabel: {
    color: Colors.muted,
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  specValue: {
    flexShrink: 1,
    textAlign: "right",
    color: Colors.text,
    fontSize: 14,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  sectionLabel: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
  },
  steps: {
    gap: 10,
  },
  step: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  stepNum: {
    width: 26,
    height: 26,
    borderRadius: 6,
    borderWidth: BorderWidth.hair,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumText: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: 12,
    fontWeight: "700",
  },
  stepText: {
    flex: 1,
    color: Colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
});
