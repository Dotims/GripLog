import { Colors } from "@/constants/theme";
import { fetchExercises } from "@/features/exercises/api";
import { ExerciseCard } from "@/features/exercises/ExerciseCard";
import { mockExercises } from "@/features/exercises/mock";
import { Exercise } from "@/features/exercises/types";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from "react-native";


export default function ExercisesScreen() {
  const [exercises, setExercises] = useState<Exercise[]>(mockExercises);
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
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={exercises}
        keyExtractor={(item) => item.exerciseId}
        renderItem={({ item }) => <ExerciseCard exercise={item} />}
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
  listContent: {
    padding: 16,
    gap: 12,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.background,
  },
  errorText: {
    color: Colors.error,
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
