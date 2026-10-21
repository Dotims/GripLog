import { useRouter } from "expo-router";
import { Plus } from "lucide-react-native";

import { IconButton, Screen, ScreenHeader } from "@/components/ui";
import { ExerciseBrowser } from "@/features/exercises/ExerciseBrowser";

export default function ExercisesScreen() {
  const router = useRouter();

  return (
    <Screen>
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
    </Screen>
  );
}
