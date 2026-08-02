import { BorderWidth, Colors, Fonts, Radii, Shadow } from "@/constants/theme";
import { fetchExercises } from "@/features/exercises/api";
import { ExerciseCard } from "@/features/exercises/ExerciseCard";
import { Exercise } from "@/features/exercises/types";
import { Link } from "expo-router";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from "react-native";


export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadExercises() {
      try {
        const fetchedExercises = await fetchExercises();
        setExercises(fetchedExercises);
      } catch (error) {
        console.error("Error fetching exercises:", error);
        setError(error instanceof Error ? error.message : "Nie udało się pobrać ćwiczeń");
      } finally {
        setIsLoading(false);
      }
    }

    loadExercises();
  }, []);

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

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>EXERCISES</Text>
        <Text style={styles.count}>{exercises.length} MOVES</Text>
      </View>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.exerciseId}
        renderItem={({ item }) => <Link href={`/exercises/${item.exerciseId}`} asChild><Pressable><ExerciseCard exercise={item} /></Pressable></Link> }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  title: {
    color: Colors.text,
    fontSize: 40,
    fontWeight: "900",
    letterSpacing: -1.5,
    textTransform: "uppercase",
  },
  count: {
    color: Colors.muted,
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 0.5,
  },
  listContent: {
    padding: 16,
    paddingTop: 4,
    gap: 12,
  },
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
});
