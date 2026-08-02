import { BorderWidth, Colors, Fonts, Radii, Shadow } from "@/constants/theme";
import { Image, StyleSheet, Text, View } from "react-native";
import type { Exercise } from "./types";

type ExerciseCardProps = {
  exercise: Exercise;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const { name, gifUrl, bodyParts, equipments, targetMuscles } = exercise;

  const meta = [bodyParts[0], equipments[0]].filter(Boolean).join(" / ");

  return (
    <View style={styles.card}>
      <Image source={{ uri: gifUrl }} style={styles.thumb} />

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={2}>
          {name}
        </Text>

        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}

        {targetMuscles[0] ? (
          <View style={styles.chip}>
            <Text style={styles.chipText} numberOfLines={1}>
              {targetMuscles[0]}
            </Text>
          </View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    boxShadow: Shadow.hard,
  },
  thumb: {
    width: 62,
    height: 62,
    borderRadius: 6,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  body: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: -0.3,
    lineHeight: 19,
    textTransform: "uppercase",
  },
  meta: {
    color: Colors.muted,
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
  chip: {
    alignSelf: "flex-start",
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
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.3,
    textTransform: "uppercase",
  },
});
