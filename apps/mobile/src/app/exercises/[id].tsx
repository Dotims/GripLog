import {
  formatDuration,
  formatNumber,
  RECORD_KINDS,
  setLabel,
  setNumbers,
  suggestNextSession,
  toDisplayWeight,
  type RecordKind,
} from "@griplog/core";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import { Sparkles, Trophy } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { LineChart } from "@/components/charts/LineChart";
import { AppText, Card, Chip, Screen, SectionLabel, SegmentedControl } from "@/components/ui";
import { Colors, Radii, Spacing, tabular } from "@/constants/theme";
import { animationUrl } from "@/features/exercises/catalogue";
import { ExerciseImage } from "@/features/exercises/ExerciseImage";
import { useExercise, useExerciseHistory, useExerciseRecords } from "@/features/exercises/hooks";
import { groupSessions, sessionScore, toProgressionSessions } from "@/features/exercises/sessions";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { formatSetValue } from "@/features/workouts/format-set";
import { formatRecordValue, recordLabel } from "@/features/workouts/records";
import { formatRelativeDay, formatShortDate } from "@/lib/dates";

type Tab = "summary" | "history" | "howto";

const TABS = [
  { value: "summary", label: "Summary" },
  { value: "history", label: "History" },
  { value: "howto", label: "How to" },
] as const;

const CHART_SESSIONS = 20;

export default function ExerciseDetailScreen() {
  const router = useRouter();
  const { id: rawId } = useLocalSearchParams<{ id: string }>();
  const id = decodeURIComponent(rawId);
  const { unit } = usePreferences();
  const exercise = useExercise(id);
  const history = useExerciseHistory(id);
  const records = useExerciseRecords(id);
  const [tab, setTab] = useState<Tab>("summary");

  if (!exercise) {
    return (
      <Screen edges={[]}>
        <AppText color={Colors.muted} style={styles.missing}>
          Exercise not found.
        </AppText>
      </Screen>
    );
  }

  const sessions = groupSessions(history);
  const bestByKind = new Map<RecordKind, number>();
  for (const record of records) {
    bestByKind.set(record.kind, Math.max(bestByKind.get(record.kind) ?? 0, record.value));
  }
  const chartPoints = sessions
    .slice(0, CHART_SESSIONS)
    .reverse()
    .flatMap((session) => {
      const score = sessionScore(session, exercise.trackingType);
      return score === null
        ? []
        : [
            {
              key: session.workoutId,
              value: score,
              label: formatShortDate(new Date(session.startedAt)),
            },
          ];
    });
  const timed =
    exercise.trackingType === "duration" || exercise.trackingType === "distance_duration";
  const formatScore = (value: number) =>
    exercise.trackingType === "weight_reps"
      ? `${formatNumber(toDisplayWeight(value, unit))} ${unit}`
      : timed
        ? formatDuration(value)
        : `${value} reps`;
  const suggestion =
    exercise.trackingType === "weight_reps"
      ? suggestNextSession(toProgressionSessions(sessions))
      : null;

  return (
    <Screen scroll edges={[]}>
      <Stack.Screen options={{ headerTitle: "" }} />

      <Card style={styles.imageCard}>
        <ExerciseImage
          exerciseId={exercise.id}
          trackingType={exercise.trackingType}
          name={exercise.name}
          animated
          style={styles.image}
        />
      </Card>

      <View style={styles.titleBlock}>
        <AppText variant="display">{exercise.name}</AppText>
        <View style={styles.chips}>
          {exercise.primaryMuscles.map((muscle) => (
            <Chip key={muscle} label={muscle} selected tone="accent" />
          ))}
          {exercise.equipment ? <Chip label={exercise.equipment} /> : null}
          {exercise.isCustom ? <Chip label="custom" selected tone="gold" /> : null}
        </View>
      </View>

      <SegmentedControl options={TABS} value={tab} onChange={setTab} />

      {tab === "summary" ? (
        <>
          {suggestion && suggestion.kind !== "no_data" ? (
            <Card tone="raised" style={styles.coach}>
              <View style={styles.coachHeader}>
                <Sparkles color={Colors.accent} size={16} strokeWidth={2.2} />
                <AppText variant="caption" color={Colors.accent}>
                  Next session
                </AppText>
              </View>
              <AppText variant="display">
                {formatNumber(toDisplayWeight(suggestion.weightKg ?? 0, unit))} {unit} ×{" "}
                {suggestion.reps}
              </AppText>
              <AppText color={Colors.muted}>{suggestion.reason}</AppText>
            </Card>
          ) : null}

          <SectionLabel>Personal records</SectionLabel>
          <View style={styles.recordGrid}>
            {RECORD_KINDS.filter((kind) => bestByKind.has(kind)).map((kind) => (
              <Card key={kind} style={styles.recordCard}>
                <Trophy color={Colors.gold} size={18} strokeWidth={2.2} />
                <AppText variant="label" color={Colors.muted}>
                  {recordLabel(kind)}
                </AppText>
                <AppText variant="heading" style={tabular} numberOfLines={1} adjustsFontSizeToFit>
                  {formatRecordValue(kind, bestByKind.get(kind) ?? 0, unit)}
                </AppText>
              </Card>
            ))}
            {bestByKind.size === 0 ? (
              <AppText color={Colors.muted}>
                Log this exercise once and its records show up here.
              </AppText>
            ) : null}
          </View>

          {chartPoints.length > 1 ? (
            <>
              <SectionLabel>
                {exercise.trackingType === "weight_reps"
                  ? "Estimated 1RM"
                  : timed
                    ? "Longest set"
                    : "Most reps"}
              </SectionLabel>
              <Card style={styles.chart}>
                <LineChart points={chartPoints} formatValue={formatScore} />
              </Card>
            </>
          ) : null}
        </>
      ) : null}

      {tab === "history" ? (
        sessions.length === 0 ? (
          <AppText color={Colors.muted}>No sets logged yet.</AppText>
        ) : (
          sessions.map((session) => (
            <Card key={session.workoutId} style={styles.session}>
              <Pressable onPress={() => router.push(`/workouts/${session.workoutId}`)}>
                <AppText variant="bold">{session.workoutTitle}</AppText>
                <AppText variant="label" color={Colors.muted}>
                  {formatRelativeDay(session.startedAt)}
                </AppText>
              </Pressable>
              {session.sets.map((set, index) => (
                <View key={set.setId} style={styles.historySet}>
                  <AppText variant="label" color={Colors.muted} style={styles.setIndex}>
                    {setLabel(set.type, setNumbers(session.sets)[index] ?? 0)}
                  </AppText>
                  <AppText variant="mono">
                    {formatSetValue(set, exercise.trackingType, unit)}
                  </AppText>
                </View>
              ))}
            </Card>
          ))
        )
      ) : null}

      {tab === "howto" ? (
        exercise.instructions.length === 0 ? (
          <AppText color={Colors.muted}>No instructions for this exercise.</AppText>
        ) : (
          exercise.instructions.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={styles.stepNumber}>
                <AppText variant="label">{index + 1}</AppText>
              </View>
              <AppText style={styles.flex}>{step}</AppText>
            </View>
          ))
        )
      ) : null}

      {tab === "howto" && animationUrl(exercise.id) ? (
        <AppText variant="caption" color={Colors.faint}>
          Animation: ExerciseDB, © Gym visual
        </AppText>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  missing: {
    padding: Spacing.lg,
  },
  imageCard: {
    overflow: "hidden",
  },
  image: {
    width: "100%",
    aspectRatio: 4 / 3,
  },
  titleBlock: {
    gap: Spacing.sm,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  coach: {
    padding: Spacing.lg,
    gap: 6,
  },
  coachHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  recordGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  recordCard: {
    flexGrow: 1,
    flexBasis: 0,
    minWidth: 96,
    padding: Spacing.md,
    gap: 6,
  },
  chart: {
    padding: Spacing.lg,
  },
  session: {
    padding: Spacing.lg,
    gap: 6,
  },
  historySet: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  setIndex: {
    width: 18,
  },
  step: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  stepNumber: {
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surface,
    borderRadius: Radii.sm,
  },
  flex: {
    flex: 1,
  },
});
