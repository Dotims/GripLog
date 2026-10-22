import { formatDuration, formatNumber, toDisplayWeight, weeklyBuckets } from "@griplog/core";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { Camera, ChevronRight, Settings, Upload } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BarChart } from "@/components/charts/BarChart";
import {
  AppText,
  Button,
  Card,
  IconButton,
  Screen,
  SectionLabel,
  SegmentedControl,
  Stat,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { workoutPhotos, workouts as workoutsTable } from "@/db/schema";
import { useLiveQuery } from "@/db/use-live-query";
import { useLiftGoal } from "@/features/goals/hooks";
import { LiftGoalCard, NoLiftGoalCard } from "@/features/goals/LiftGoalCard";
import { musclesWorked } from "@/features/muscles/muscles";
import { Avatar } from "@/features/profile/Avatar";
import { initials, pickAvatar } from "@/features/profile/avatar";
import { ProfileCover } from "@/features/profile/ProfileCover";
import { useProfile } from "@/features/profile/hooks";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { updateProfile } from "@/features/profile/repository";
import { useWorkouts } from "@/features/workouts/hooks";
import { recentPhotosQuery } from "@/features/workouts/photos";
import { summariseWorkout } from "@/features/workouts/summary";
import { WorkoutThumb } from "@/features/workouts/WorkoutThumb";
import { formatRelativeDay, formatShortDate } from "@/lib/dates";

type Metric = "volume" | "workouts" | "duration";

const METRICS = [
  { value: "volume", label: "Volume" },
  { value: "workouts", label: "Workouts" },
  { value: "duration", label: "Time" },
] as const;

const CHART_WEEKS = 12;
const RECENT = 8;
const COVER_HEIGHT = 170;
const AVATAR = 92;

export default function ProfileScreen() {
  const router = useRouter();
  const db = useDatabase();
  const { top } = useSafeAreaInsets();
  const profile = useProfile();
  const { unit } = usePreferences();
  const workouts = useWorkouts();
  const goal = useLiftGoal();
  const photos = useLiveQuery(() => recentPhotosQuery(db, 3).all(), [workoutPhotos, workoutsTable]);
  const [metric, setMetric] = useState<Metric>("volume");

  const summaries = workouts.map((workout) => ({ workout, summary: summariseWorkout(workout) }));
  const totals = summaries.reduce(
    (sum, { summary }) => ({
      seconds: sum.seconds + summary.durationSeconds,
      records: sum.records + summary.records,
    }),
    { seconds: 0, records: 0 },
  );
  const weeks = weeklyBuckets(
    summaries.map(({ workout, summary }) => ({
      startedAt: workout.startedAt,
      volumeKg: summary.volumeKg,
      durationSeconds: summary.durationSeconds,
    })),
    CHART_WEEKS,
  );

  const firstName = profile?.firstName ?? "";
  const lastName = profile?.lastName ?? "";
  const name = `${firstName} ${lastName}`.trim() || "Athlete";

  const changeAvatar = async () => {
    const uri = await pickAvatar();
    if (uri) updateProfile(db, { avatarUri: uri });
  };

  return (
    <View style={styles.root}>
      <Screen scroll edges={[]}>
        <View style={styles.coverBleed}>
          <ProfileCover
            height={COVER_HEIGHT + top}
            topInset={top}
            photos={photos ?? []}
            startedAt={workouts.map((w) => w.startedAt)}
            onOpenWorkout={(id) => router.push(`/workouts/${id}`)}
            actions={
              <IconButton
                icon={Settings}
                label="Settings"
                onPress={() => router.push("/settings")}
              />
            }
          />
        </View>

        <View style={styles.identity}>
          <Pressable
            onPress={changeAvatar}
            accessibilityRole="button"
            accessibilityLabel="Change profile photo"
            style={styles.avatarRing}
          >
            <Avatar
              uri={profile?.avatarUri ?? null}
              initials={initials(firstName, lastName)}
              size={AVATAR}
            />
            <View style={styles.camera}>
              <Camera color={Colors.text} size={13} strokeWidth={2} />
            </View>
          </Pressable>
          <Button
            label="Edit profile"
            size="sm"
            variant="secondary"
            onPress={() => router.push("/settings")}
          />
        </View>

        <View style={styles.bio}>
          <AppText variant="display" numberOfLines={1} adjustsFontSizeToFit>
            {name}
          </AppText>
          <AppText color={profile?.bio ? Colors.text : Colors.muted} numberOfLines={3}>
            {profile?.bio || "Add a short bio and your name in settings."}
          </AppText>
        </View>

        <Card style={styles.totals}>
          <Stat label="Workouts" value={String(workouts.length)} />
          <Stat label="Hours" value={formatNumber(totals.seconds / 3600, 0)} />
          <Stat label="Records" value={String(totals.records)} />
        </Card>

        <SectionLabel
          right={
            <Pressable onPress={() => router.push("/goals")} hitSlop={8} accessibilityRole="link">
              <AppText variant="label" color={Colors.accent}>
                Goals
              </AppText>
            </Pressable>
          }
        >
          Chasing
        </SectionLabel>
        {goal ? (
          <LiftGoalCard goal={goal} unit={unit} onPress={() => router.push("/goals")} />
        ) : (
          <NoLiftGoalCard onPress={() => router.push("/goals")} />
        )}

        <SectionLabel>Last 12 weeks</SectionLabel>
        <Card style={styles.chartCard}>
          <SegmentedControl options={METRICS} value={metric} onChange={setMetric} />
          <AppText variant="number">
            {metric === "volume"
              ? `${formatNumber(
                  toDisplayWeight(
                    weeks.reduce((s, w) => s + w.volumeKg, 0),
                    unit,
                  ),
                  0,
                )} ${unit}`
              : metric === "workouts"
                ? `${weeks.reduce((s, w) => s + w.workouts, 0)} workouts`
                : formatDuration(weeks.reduce((s, w) => s + w.durationSeconds, 0))}
          </AppText>
          <BarChart
            height={130}
            highlightKey={weeks.at(-1)?.weekStart.toISOString()}
            data={weeks.map((week) => ({
              key: week.weekStart.toISOString(),
              label: formatShortDate(week.weekStart).split(" ")[0] ?? "",
              value:
                metric === "volume"
                  ? week.volumeKg
                  : metric === "workouts"
                    ? week.workouts
                    : week.durationSeconds,
            }))}
          />
        </Card>

        <SectionLabel>Recent workouts</SectionLabel>
        {summaries.length === 0 ? (
          <Button
            label="Import from Hevy"
            icon={Upload}
            variant="secondary"
            onPress={() => router.push("/import")}
          />
        ) : (
          <Card style={styles.list}>
            {summaries.slice(0, RECENT).map(({ workout, summary }, index) => (
              <Pressable
                key={workout.id}
                onPress={() => router.push(`/workouts/${workout.id}`)}
                accessibilityRole="button"
                accessibilityLabel={`${workout.title}, ${formatRelativeDay(workout.startedAt)}`}
                style={({ pressed }) => [
                  styles.row,
                  index > 0 && styles.divider,
                  pressed && styles.pressed,
                ]}
              >
                <WorkoutThumb
                  photoUri={workout.photos[0]?.uri}
                  muscles={musclesWorked(
                    workout.exercises.map((e) => ({
                      primaryMuscles: e.exercise.primaryMuscles,
                      secondaryMuscles: e.exercise.secondaryMuscles,
                      sets: e.sets.length,
                    })),
                  )}
                />
                <View style={styles.flex}>
                  <AppText variant="bold" numberOfLines={1}>
                    {workout.title}
                  </AppText>
                  <AppText variant="label" color={Colors.muted}>
                    {formatRelativeDay(workout.startedAt)} ·{" "}
                    {formatDuration(summary.durationSeconds)}
                  </AppText>
                  <AppText variant="mono" color={Colors.muted}>
                    {formatNumber(toDisplayWeight(summary.volumeKg, unit), 0)} {unit}
                  </AppText>
                </View>
                <ChevronRight color={Colors.faint} size={18} strokeWidth={2} />
              </Pressable>
            ))}
          </Card>
        )}
      </Screen>
      {/* Content scrolls under the status bar; a fade keeps the clock readable. */}
      <LinearGradient
        pointerEvents="none"
        colors={[Colors.background, "transparent"]}
        style={[styles.statusScrim, { height: top + Spacing.sm }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // The cover runs edge to edge and under the status bar.
  root: {
    flex: 1,
  },
  statusScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  coverBleed: {
    marginTop: -Spacing.lg,
    marginHorizontal: -Spacing.lg,
  },
  identity: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    marginTop: -AVATAR / 2 - Spacing.xl,
  },
  avatarRing: {
    padding: 4,
    borderRadius: 999,
    backgroundColor: Colors.background,
  },
  camera: {
    position: "absolute",
    right: 2,
    bottom: 2,
    padding: 6,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 3,
    borderColor: Colors.background,
    borderRadius: 999,
  },
  bio: {
    gap: 4,
    marginTop: -Spacing.sm,
  },
  totals: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  chartCard: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  list: {
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  divider: {
    borderTopWidth: 1,
    borderTopColor: Colors.hairline,
  },
  pressed: {
    backgroundColor: Colors.surfaceRaised,
  },
  flex: {
    flex: 1,
  },
});
