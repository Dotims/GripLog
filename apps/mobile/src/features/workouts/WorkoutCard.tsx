import { formatDuration, formatNumber, toDisplayWeight, type WeightUnit } from "@griplog/core";
import { Trophy } from "lucide-react-native";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { AppText, Card } from "@/components/ui";
import { Colors, Fonts, Radii, Spacing, tabular } from "@/constants/theme";
import { ExerciseImage } from "@/features/exercises/ExerciseImage";
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
            <AppText variant="label" color={Colors.text} style={styles.avatarText}>
              {author.initials}
            </AppText>
          </View>
        ) : null}
        <View style={styles.flex}>
          {author ? <AppText variant="bold">{author.name}</AppText> : null}
          <AppText variant="label" color={Colors.muted}>
            {formatRelativeDay(startedAt)} at {formatTime(startedAt)}
          </AppText>
        </View>
        {summary.records > 0 ? (
          <View style={styles.records}>
            <Trophy color={Colors.gold} size={13} strokeWidth={2.2} />
            <AppText variant="label" color={Colors.gold} style={styles.recordsText}>
              {summary.records} {summary.records === 1 ? "PR" : "PRs"}
            </AppText>
          </View>
        ) : null}
      </View>

      <AppText variant="title" numberOfLines={2}>
        {title}
      </AppText>

      <View style={styles.stats}>
        <Metric label="Time" value={formatDuration(summary.durationSeconds)} />
        <Metric
          label="Volume"
          value={`${formatNumber(toDisplayWeight(summary.volumeKg, unit), 0)} ${unit}`}
        />
        <Metric label="Sets" value={String(summary.sets)} />
      </View>

      <View style={styles.exercises}>
        {summary.exercises.slice(0, VISIBLE_EXERCISES).map((exercise, index) => (
          <View key={`${exercise.name}-${index}`} style={styles.exerciseRow}>
            {exercise.exerciseId ? (
              <ExerciseImage
                exerciseId={exercise.exerciseId}
                name={exercise.name}
                trackingType={exercise.trackingType}
                style={styles.thumb}
              />
            ) : null}
            <AppText numberOfLines={1} style={styles.flex} color={Colors.text}>
              {exercise.name}
            </AppText>
            <AppText variant="label" color={Colors.muted}>
              {exercise.sets} {exercise.sets === 1 ? "set" : "sets"}
            </AppText>
          </View>
        ))}
        {hidden > 0 ? (
          <AppText variant="label" color={Colors.faint}>
            and {hidden} more {hidden === 1 ? "exercise" : "exercises"}
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
      <AppText variant="heading" numberOfLines={1} style={tabular}>
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
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  top: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatar: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.pill,
  },
  avatarText: {
    fontFamily: Fonts.semibold,
  },
  flex: {
    flex: 1,
  },
  records: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: Colors.goldSoft,
    borderRadius: Radii.pill,
  },
  recordsText: {
    fontFamily: Fonts.semibold,
  },
  stats: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  metric: {
    flex: 1,
    gap: 2,
  },
  exercises: {
    gap: 10,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  exerciseRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 32,
    height: 32,
    borderRadius: 10,
  },
});
