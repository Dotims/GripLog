import { Colors } from "@/constants/theme";
import { Image, StyleSheet, Text, View } from "react-native";
import type { Exercise } from "./types";

type ExerciseCardProps = {
  exercise: Exercise;
};

export function ExerciseCard({ exercise }: ExerciseCardProps) {
  const { name, gifUrl, bodyParts, equipments, targetMuscles } = exercise;

  const meta = [bodyParts[0], equipments[0]].filter(Boolean).join(" · ");

  return (
    <View style={styles.card}>
      <Image source={{ uri: gifUrl }} style={styles.thumb} />

      <View style={styles.body}>
        <Text style={styles.name} numberOfLines={1}>
          {name}
        </Text>
        {meta ? (
          <Text style={styles.meta} numberOfLines={1}>
            {meta}
          </Text>
        ) : null}
      </View>

      {targetMuscles[0] ? (
        <View style={styles.chip}>
          <Text style={styles.chipText} numberOfLines={1}>
            {targetMuscles[0]}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.background,
  },
  body: {
    flex: 1,
    gap: 2,
  },
  name: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  meta: {
    color: Colors.muted,
    fontSize: 13,
    textTransform: "capitalize",
  },
  chip: {
    backgroundColor: Colors.accentSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  chipText: {
    color: Colors.accent,
    fontSize: 12,
    fontWeight: "600",
    textTransform: "capitalize",
  },
});
