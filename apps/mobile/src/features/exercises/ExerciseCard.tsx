import { Check } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { Colors, Radii } from "@/constants/theme";

import { ExerciseImage } from "./ExerciseImage";
import type { ExerciseListItem } from "./repository";

type ExerciseCardProps = {
  exercise: ExerciseListItem;
  onPress: () => void;
  selected?: boolean;
  uses?: number;
};

export function ExerciseCard({ exercise, onPress, selected = false, uses }: ExerciseCardProps) {
  const { name, images, equipment, primaryMuscles, isCustom } = exercise;
  const meta = [primaryMuscles[0], equipment, isCustom ? "custom" : null]
    .filter(Boolean)
    .join(" · ");

  return (
    <Card
      onPress={onPress}
      style={[styles.card, selected && styles.selected]}
      accessibilityLabel={name}
      testID={`exercise-${exercise.id}`}
    >
      <ExerciseImage images={images} name={name} style={styles.thumb} />
      <View style={styles.body}>
        <AppText variant="bold" numberOfLines={2}>
          {name}
        </AppText>
        {meta ? (
          <AppText variant="label" color={Colors.muted} numberOfLines={1} style={styles.meta}>
            {meta}
          </AppText>
        ) : null}
      </View>
      {selected ? (
        <View style={styles.check}>
          <Check color={Colors.accentInk} size={15} strokeWidth={3} />
        </View>
      ) : uses ? (
        <AppText variant="label" color={Colors.faint}>
          {uses}×
        </AppText>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 10,
    paddingRight: 16,
  },
  selected: {
    backgroundColor: Colors.accentSoft,
  },
  thumb: {
    width: 54,
    height: 54,
    borderRadius: Radii.md,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  meta: {
    textTransform: "capitalize",
  },
  check: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    borderRadius: Radii.pill,
  },
});
