import { formatDuration, formatNumber, toDisplayWeight, weeklyBuckets } from "@griplog/core";
import { useRouter } from "expo-router";
import { Camera, Settings, Upload } from "lucide-react-native";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";

import { BarChart } from "@/components/charts/BarChart";
import {
  AppText,
  Button,
  Card,
  IconButton,
  Screen,
  ScreenHeader,
  SectionLabel,
  SegmentedControl,
  Stat,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { Avatar } from "@/features/profile/Avatar";
import { initials, pickAvatar } from "@/features/profile/avatar";
import { useProfile } from "@/features/profile/hooks";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { updateProfile } from "@/features/profile/repository";
import { useWorkouts } from "@/features/workouts/hooks";
import { summariseWorkout } from "@/features/workouts/summary";
import { formatRelativeDay, formatShortDate } from "@/lib/dates";

type Metric = "volume" | "workouts" | "duration";

const METRICS = [
  { value: "volume", label: "Volume" },
  { value: "workouts", label: "Workouts" },
  { value: "duration", label: "Time" },
] as const;

const CHART_WEEKS = 12;
const RECENT = 8;

export default function ProfileScreen() {
  const router = useRouter();
  const db = useDatabase();
  const profile = useProfile();
  const { unit } = usePreferences();
  const workouts = useWorkouts();
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
    <Screen scroll>
      <ScreenHeader
        eyebrow="Profile"
        title={name}
        right={
          <IconButton icon={Settings} label="Settings" onPress={() => router.push("/settings")} />
        }
      />

      <View style={styles.identity}>
        <Pressable
          onPress={changeAvatar}
          accessibilityRole="button"
          accessibilityLabel="Change profile photo"
        >
          <Avatar
            uri={profile?.avatarUri ?? null}
            initials={initials(firstName, lastName)}
            size={84}
          />
          <View style={styles.camera}>
            <Camera color={Colors.text} size={13} strokeWidth={2} />
          </View>
        </Pressable>
        <View style={styles.bio}>
          <AppText color={profile?.bio ? Colors.text : Colors.muted} numberOfLines={3}>
            {profile?.bio || "Add a short bio and your name in settings."}
          </AppText>
          <Button
            label="Edit profile"
            size="sm"
            variant="secondary"
            onPress={() => router.push("/settings")}
          />
        </View>
      </View>

      <Card style={styles.totals}>
        <Stat label="Workouts" value={String(workouts.length)} />
        <Stat label="Hours" value={formatNumber(totals.seconds / 3600, 0)} />
        <Stat label="Records" value={String(totals.records)} />
      </Card>

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
              style={({ pressed }) => [
                styles.row,
                index > 0 && styles.divider,
                pressed && styles.pressed,
              ]}
            >
              <View style={styles.flex}>
                <AppText variant="bold" numberOfLines={1}>
                  {workout.title}
                </AppText>
                <AppText variant="label" color={Colors.muted}>
                  {formatRelativeDay(workout.startedAt)} · {formatDuration(summary.durationSeconds)}
                </AppText>
              </View>
              <AppText variant="mono" color={Colors.muted}>
                {formatNumber(toDisplayWeight(summary.volumeKg, unit), 0)} {unit}
              </AppText>
            </Pressable>
          ))}
        </Card>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  identity: {
    flexDirection: "row",
    gap: Spacing.lg,
    alignItems: "center",
  },
  camera: {
    position: "absolute",
    right: -2,
    bottom: -2,
    padding: 6,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 3,
    borderColor: Colors.background,
    borderRadius: 999,
  },
  bio: {
    flex: 1,
    gap: Spacing.sm,
    alignItems: "flex-start",
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
