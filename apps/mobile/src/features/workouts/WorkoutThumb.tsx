import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { Colors, Radii } from "@/constants/theme";
import { MuscleMap } from "@/features/muscles/MuscleMap";
import type { WorkedMuscle } from "@/features/muscles/muscles";

const WIDTH = 56;
const HEIGHT = 64;

/** A workout at a glance: your photo when you added one, otherwise the muscles it trained. */
export function WorkoutThumb({
  photoUri,
  muscles,
}: {
  photoUri?: string | null;
  muscles: readonly WorkedMuscle[];
}) {
  return (
    <View style={styles.tile}>
      {photoUri ? (
        <Image source={{ uri: photoUri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <MuscleMap muscles={muscles} height={HEIGHT - 8} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    width: WIDTH,
    height: HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderRadius: Radii.md,
    borderCurve: "continuous",
    backgroundColor: Colors.surfaceRaised,
  },
});
