import { formatNumber, toDisplayWeight, type WeightUnit } from "@griplog/core";
import { Target, Trophy } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { formatForecast } from "@/lib/dates";

import { GoalRing } from "./GoalRing";
import type { useLiftGoal } from "./hooks";

type LiftGoal = NonNullable<ReturnType<typeof useLiftGoal>>;

function forecastLine(goal: LiftGoal): string {
  if (goal.reached) return "Goal reached. Time to set the next one.";
  if (goal.expectedAt) return `On track ${formatForecast(goal.expectedAt)}`;
  if (goal.currentKg === 0) return "Log this lift to start tracking it.";
  return "No upward trend in the last 12 weeks yet. Keep showing up.";
}

/** The lift goal as a ring: best recent estimated 1RM against the target, with a forecast. */
export function LiftGoalCard({
  goal,
  unit,
  onPress,
}: {
  goal: LiftGoal;
  unit: WeightUnit;
  onPress?: () => void;
}) {
  const current = formatNumber(toDisplayWeight(goal.currentKg, unit), 1);
  const target = formatNumber(toDisplayWeight(goal.targetKg, unit), 1);
  const color = goal.reached ? Colors.gold : Colors.accent;

  return (
    <Card style={styles.card} onPress={onPress} accessibilityLabel={`Goal: ${goal.name}`}>
      <GoalRing progress={goal.progress} size={104} stroke={10} color={color}>
        <AppText variant="number">{current}</AppText>
        <AppText variant="label" color={Colors.muted}>
          of {target}
        </AppText>
      </GoalRing>
      <View style={styles.text}>
        <View style={styles.title}>
          {goal.reached ? (
            <Trophy color={Colors.gold} size={16} strokeWidth={2.2} />
          ) : (
            <Target color={Colors.accent} size={16} strokeWidth={2.2} />
          )}
          <AppText variant="caption" color={color}>
            {goal.reached ? "Reached" : `${Math.round(goal.progress * 100)}% there`}
          </AppText>
        </View>
        <AppText variant="heading" numberOfLines={2}>
          {target} {unit} {goal.name}
        </AppText>
        <AppText variant="label" color={Colors.muted}>
          {forecastLine(goal)}
        </AppText>
      </View>
    </Card>
  );
}

/** The empty state: one tap to pick a lift to chase. */
export function NoLiftGoalCard({ onPress }: { onPress: () => void }) {
  return (
    <Card style={styles.card} onPress={onPress} accessibilityLabel="Set a lift goal">
      <View style={styles.emptyIcon}>
        <Target color={Colors.accent} size={26} strokeWidth={2} />
      </View>
      <View style={styles.text}>
        <AppText variant="heading">Chase a number</AppText>
        <AppText variant="label" color={Colors.muted}>
          Pick a lift and a target, like a 100 kg bench. GripLog tracks your estimated max and tells
          you when you will get there.
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.lg,
    padding: Spacing.lg,
  },
  text: {
    flex: 1,
    gap: 4,
  },
  title: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  emptyIcon: {
    width: 56,
    height: 56,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentSoft,
  },
});
