import { Image } from "expo-image";
import { ImagePlus } from "lucide-react-native";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { AppText, OptionsSheet } from "@/components/ui";
import { Colors, Radii, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { workoutPhotos } from "@/db/schema";
import { useLiveQuery } from "@/db/use-live-query";
import { notify } from "@/lib/dialog";

import {
  addWorkoutPhoto,
  pickWorkoutPhoto,
  removeWorkoutPhoto,
  workoutPhotosQuery,
  type PhotoSource,
} from "./photos";

const TILE = 96;
/** The options sheet is a modal; iOS will not present the picker until it is gone. */
const SHEET_CLOSE_MS = 350;

/** A row of a workout's photos with a tile to add another. Photos stay on this phone. */
export function WorkoutPhotos({ workoutId }: { workoutId: string }) {
  const db = useDatabase();
  const photos = useLiveQuery(
    () => workoutPhotosQuery(db, workoutId).all(),
    [workoutPhotos],
    workoutId,
  );
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  const add = async (source: PhotoSource) => {
    setAdding(false);
    await new Promise((resolve) => setTimeout(resolve, SHEET_CLOSE_MS));
    try {
      const uri = await pickWorkoutPhoto(source);
      if (uri) addWorkoutPhoto(db, workoutId, uri);
    } catch {
      notify("Could not add the photo", "Check that GripLog may use your camera and photos.");
    }
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
      >
        {(photos ?? []).map((photo) => (
          <Animated.View key={photo.id} entering={FadeIn.duration(220)}>
            <Pressable
              onPress={() => setSelected(photo.id)}
              accessibilityRole="imagebutton"
              accessibilityLabel="Workout photo"
            >
              <Image source={{ uri: photo.uri }} style={styles.tile} contentFit="cover" />
            </Pressable>
          </Animated.View>
        ))}
        <Pressable
          onPress={() => setAdding(true)}
          accessibilityRole="button"
          accessibilityLabel="Add a photo"
          style={({ pressed }) => [styles.tile, styles.add, pressed && styles.pressed]}
        >
          <ImagePlus color={Colors.muted} size={22} strokeWidth={1.8} />
          <AppText variant="label" color={Colors.muted}>
            Add photo
          </AppText>
        </Pressable>
      </ScrollView>

      <OptionsSheet
        visible={adding}
        title="Add a photo"
        onClose={() => setAdding(false)}
        options={[
          { label: "Take a photo", onPress: () => add("camera") },
          { label: "Choose from library", onPress: () => add("library") },
        ]}
      />
      <OptionsSheet
        visible={selected !== null}
        title="Photo"
        onClose={() => setSelected(null)}
        options={[
          {
            label: "Remove photo",
            destructive: true,
            onPress: () => {
              if (selected) removeWorkoutPhoto(db, selected);
              setSelected(null);
            },
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    gap: Spacing.sm,
  },
  tile: {
    width: TILE,
    height: TILE * 1.25,
    borderRadius: Radii.md,
    borderCurve: "continuous",
    backgroundColor: Colors.surface,
  },
  add: {
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: Colors.surfaceAlt,
  },
  pressed: {
    backgroundColor: Colors.surfaceRaised,
  },
});
