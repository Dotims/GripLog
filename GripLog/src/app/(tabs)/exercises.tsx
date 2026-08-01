import { Colors } from "@/constants/theme";
import { ExerciseCard } from "@/features/exercises/ExerciseCard";
import { mockExercises } from "@/features/exercises/mock";
import { FlatList, StyleSheet, View } from "react-native";

export default function ExercisesScreen() {
  return (
    <View style={styles.container}>
      <FlatList
        data={mockExercises}
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
});
