import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";
import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { IconButton, ScreenHeader } from "@/components/ui";
import { Colors } from "@/constants/theme";
import { ExerciseBrowser } from "@/features/exercises/ExerciseBrowser";

export default function ExercisesScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <ExerciseBrowser
        onSelect={(exercise) => router.push(`/exercises/${encodeURIComponent(exercise.id)}`)}
        header={
          <ScreenHeader
            eyebrow="Library"
            title="Exercises"
            right={
              <IconButton
                icon={Plus}
                tone="accent"
                label="Create exercise"
                onPress={() => router.push("/exercises/new")}
              />
            }
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
});
