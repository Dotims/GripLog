import { WEEKS_PER_FREEZE, type WeeklyGoal } from "@griplog/core";
import { Check, Flame, Snowflake } from "lucide-react-native";
import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  ZoomIn,
} from "react-native-reanimated";

import { AppText, Card } from "@/components/ui";
import { Colors, Spacing, SupersetColors } from "@/constants/theme";

const DAYS = ["M", "T", "W", "T", "F", "S", "S"];
const FREEZE = SupersetColors[0];

function DayDot({ index, trained, today }: { index: number; trained: boolean; today: number }) {
  const past = index < today;
  return (
    <View style={styles.day}>
      <AppText variant="caption" color={index === today ? Colors.text : Colors.faint}>
        {DAYS[index]}
      </AppText>
      {trained ? (
        <Animated.View
          entering={ZoomIn.delay(80 + index * 40)
            .springify()
            .damping(12)}
          style={[styles.dot, styles.trained]}
        >
          <Check color={Colors.accentInk} size={16} strokeWidth={3} />
        </Animated.View>
      ) : (
        <View
          style={[styles.dot, index === today ? styles.today : past ? styles.past : styles.future]}
        />
      )}
    </View>
  );
}

/** The streak flame gives a little hop when the card appears, so the number feels alive. */
function StreakBadge({ streak }: { streak: number }) {
  const hop = useSharedValue(1);
  useEffect(() => {
    if (streak === 0) return;
    hop.set(
      withDelay(
        400,
        withRepeat(
          withSequence(withTiming(1.22, { duration: 160 }), withSpring(1, { damping: 6 })),
          2,
        ),
      ),
    );
  }, [hop, streak]);
  const flameStyle = useAnimatedStyle(() => ({ transform: [{ scale: hop.get() }] }));
  const lit = streak > 0;

  return (
    <View style={[styles.streak, lit && styles.streakLit]}>
      <Animated.View style={flameStyle}>
        <Flame
          color={lit ? Colors.accent : Colors.faint}
          fill={lit ? Colors.accent : "transparent"}
          size={18}
          strokeWidth={2}
        />
      </Animated.View>
      <AppText variant="bold" color={lit ? Colors.text : Colors.muted}>
        {streak}
      </AppText>
      <AppText variant="label" color={Colors.muted}>
        {streak === 1 ? "week" : "weeks"}
      </AppText>
    </View>
  );
}

/** This week against the weekly goal: day dots, the streak and the next freeze. */
export function WeekCard({ goal, onPress }: { goal: WeeklyGoal; onPress?: () => void }) {
  const today = (new Date().getDay() + 6) % 7;
  const met = goal.thisWeek >= goal.goal;
  const left = goal.goal - goal.thisWeek;
  const freezeReady = goal.freezeProgress >= WEEKS_PER_FREEZE;

  return (
    <Card style={styles.card} onPress={onPress} accessibilityLabel="Weekly goal">
      <View style={styles.header}>
        <View style={styles.flex}>
          <AppText variant="caption" color={Colors.muted}>
            This week
          </AppText>
          <View style={styles.count}>
            <AppText variant="number">{goal.thisWeek}</AppText>
            <AppText variant="bold" color={Colors.muted}>
              / {goal.goal} workouts
            </AppText>
          </View>
        </View>
        <StreakBadge streak={goal.streak} />
      </View>

      <View style={styles.days}>
        {DAYS.map((_, index) => (
          <DayDot key={index} index={index} trained={goal.days[index] ?? false} today={today} />
        ))}
      </View>

      <View style={styles.footer}>
        <AppText variant="label" color={met ? Colors.success : Colors.muted} style={styles.flex}>
          {met
            ? "Goal met. The streak is safe this week."
            : `${left} more ${left === 1 ? "workout" : "workouts"} to keep the streak`}
        </AppText>
        <View style={styles.freeze}>
          <Snowflake color={freezeReady ? FREEZE : Colors.faint} size={14} strokeWidth={2} />
          <AppText variant="label" color={freezeReady ? FREEZE : Colors.faint}>
            {freezeReady ? "Freeze ready" : `${goal.freezeProgress}/${WEEKS_PER_FREEZE}`}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
  },
  count: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 6,
    marginTop: 2,
  },
  streak: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: 999,
    backgroundColor: Colors.surfaceAlt,
  },
  streakLit: {
    backgroundColor: Colors.accentSoft,
  },
  days: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  day: {
    alignItems: "center",
    gap: 6,
  },
  dot: {
    width: 34,
    height: 34,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
  },
  trained: {
    backgroundColor: Colors.accent,
  },
  today: {
    borderWidth: 2,
    borderColor: Colors.accent,
    borderStyle: "dashed",
  },
  past: {
    backgroundColor: Colors.surfaceAlt,
  },
  future: {
    borderWidth: 1,
    borderColor: Colors.surfaceAlt,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  freeze: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
});
