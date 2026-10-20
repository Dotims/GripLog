import { Check } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { BorderWidth, Colors, Radii } from "@/constants/theme";

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
  const meta = [primaryMuscles[0], equipment].filter(Boolean).join(" / ");

  return (
    <Card
      onPress={onPress}
      tone={selected ? "highlight" : "surface"}
      style={styles.card}
      accessibilityLabel={name}
      testID={`exercise-${exercise.id}`}
    >
      <ExerciseImage images={images} name={name} style={styles.thumb} />
      <View style={styles.body}>
        <AppText variant="heading" numberOfLines={2}>
          {name}
        </AppText>
        <AppText variant="label" color={Colors.muted} numberOfLines={1}>
          {isCustom ? `custom${meta ? ` / ${meta}` : ""}` : meta}
        </AppText>
      </View>
      {selected ? (
        <View style={styles.check}>
          <Check color={Colors.accentInk} size={16} strokeWidth={3} />
        </View>
      ) : uses ? (
        <AppText variant="label" color={Colors.muted}>
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
    gap: 12,
    padding: 10,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 6,
    borderWidth: BorderWidth.hair,
    borderColor: Colors.border,
  },
  body: {
    flex: 1,
    gap: 4,
  },
  check: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    borderWidth: BorderWidth.hair,
    borderColor: Colors.border,
    borderRadius: Radii.chip,
  },
});
