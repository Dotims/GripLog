import { formatDuration, formatWeight, type WeightUnit } from "@griplog/core";
import { Trophy } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { BorderWidth, Colors, Radii, Spacing } from "@/constants/theme";
import { formatRelativeDay, formatTime } from "@/lib/dates";

import type { WorkoutSummary } from "./summary";

const VISIBLE_EXERCISES = 3;

type WorkoutCardProps = {
  title: string;
  startedAt: string;
  summary: WorkoutSummary;
  unit: WeightUnit;
  author?: { name: string; initials: string };
  /** Optional: other people's workouts in the social feed have no detail screen. */
  onPress?: () => void;
  /** Extra row under the exercises, for example the like button in the social feed. */
  footer?: ReactNode;
};

export function WorkoutCard({
  title,
  startedAt,
  summary,
  unit,
  author,
  onPress,
  footer,
}: WorkoutCardProps) {
  const hidden = summary.exercises.length - VISIBLE_EXERCISES;

  const body = (
    <>
      <View style={styles.top}>
        {author ? (
          <View style={styles.avatar}>
            <AppText variant="label" color={Colors.accentInk}>
              {author.initials}
            </AppText>
          </View>
        ) : null}
        <View style={styles.flex}>
          {author ? <AppText variant="bold">{author.name}</AppText> : null}
          <AppText variant="label" color={Colors.muted}>
            {formatRelativeDay(startedAt)} · {formatTime(startedAt)}
          </AppText>
        </View>
        {summary.records > 0 ? (
          <View style={styles.records}>
            <Trophy color={Colors.text} size={13} strokeWidth={2.5} />
            <AppText variant="label">{summary.records} PR</AppText>
          </View>
        ) : null}
      </View>

      <AppText variant="title" numberOfLines={2}>
        {title}
      </AppText>

      <View style={styles.stats}>
        <Metric label="Time" value={formatDuration(summary.durationSeconds)} />
        <Metric label="Volume" value={formatWeight(summary.volumeKg, unit)} />
        <Metric label="Sets" value={String(summary.sets)} />
      </View>

      <View style={styles.exercises}>
        {summary.exercises.slice(0, VISIBLE_EXERCISES).map((exercise, index) => (
          <View key={`${exercise.name}-${index}`} style={styles.exerciseRow}>
            <AppText variant="label" color={Colors.muted} style={styles.setCount}>
              {exercise.sets}×
            </AppText>
            <AppText numberOfLines={1} style={styles.flex}>
              {exercise.name}
            </AppText>
          </View>
        ))}
        {hidden > 0 ? (
          <AppText variant="label" color={Colors.muted}>
            + {hidden} more {hidden === 1 ? "exercise" : "exercises"}
          </AppText>
        ) : null}
      </View>
    </>
  );

  if (!footer) {
    return (
      <Card onPress={onPress} style={styles.card} accessibilityLabel={title}>
        {body}
      </Card>
    );
  }

  // A button inside a pressable card is a button inside a button; keep the footer outside the pressable part.
  return (
    <Card style={styles.card}>
      <Pressable
        onPress={onPress}
        disabled={!onPress}
        accessibilityRole={onPress ? "button" : undefined}
        accessibilityLabel={title}
        style={({ pressed }) => [styles.body, pressed && { opacity: 0.7 }]}
      >
        {body}
      </Pressable>
      <View style={styles.footer}>{footer}</View>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <AppText variant="label" color={Colors.muted}>
        {label}
      </AppText>
      <AppText variant="bold" numberOfLines={1}>
        {value}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  body: {
    gap: Spacing.md,
  },
  footer: {
    paddingTop: Spacing.sm,
    borderTopWidth: BorderWidth.hair,
    borderTopColor: Colors.surfaceAlt,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 34,
    height: 34,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accent,
    borderWidth: BorderWidth.hair,
    borderColor: Colors.border,
    borderRadius: Radii.chip,
  },
  flex: {
    flex: 1,
  },
  records: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: Colors.highlight,
    borderWidth: BorderWidth.hair,
    borderColor: Colors.border,
    borderRadius: Radii.chip,
  },
  stats: {
    flexDirection: "row",
    gap: Spacing.md,
    paddingVertical: Spacing.sm,
    borderTopWidth: BorderWidth.hair,
    borderBottomWidth: BorderWidth.hair,
    borderColor: Colors.border,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  exercises: {
    gap: 6,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setCount: {
    width: 26,
  },
});
