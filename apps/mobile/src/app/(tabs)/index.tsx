import { formatNumber, toDisplayWeight, weekStreak, weeklyBuckets } from "@griplog/core";
import { useRouter } from "expo-router";
import { Dumbbell, Play, Settings, Upload } from "lucide-react-native";
import { useState, type ReactElement } from "react";
import { FlatList, StyleSheet, View } from "react-native";

import { BarChart } from "@/components/charts/BarChart";
import {
  AppText,
  Button,
  Card,
  EmptyState,
  IconButton,
  Screen,
  ScreenHeader,
  SectionLabel,
  SegmentedControl,
  Stat,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useActiveWorkout } from "@/features/active-workout/use-active-workout";
import { useStartWorkout } from "@/features/active-workout/use-start-workout";
import { useProfile } from "@/features/profile/hooks";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { FollowingFeed } from "@/features/social/FollowingFeed";
import { useWorkouts } from "@/features/workouts/hooks";
import { summariseWorkout } from "@/features/workouts/summary";
import { WorkoutCard } from "@/features/workouts/WorkoutCard";
import { formatShortDate, todayLabel } from "@/lib/dates";

const PAGE_SIZE = 15;
const CHART_WEEKS = 8;

type Tab = "you" | "following";

function greeting(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return "Hey";
  if (hour < 12) return "Morning";
  if (hour < 18) return "Afternoon";
  return "Evening";
}

const TABS = [
  { value: "you", label: "You" },
  { value: "following", label: "Following" },
] as const;

export default function FeedScreen() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("you");
  const profile = useProfile();

  // The same header sits on top of both lists.
  const header = (
    <View style={styles.header}>
      <ScreenHeader
        eyebrow={todayLabel()}
        title={profile?.firstName ? `${greeting()}, ${profile.firstName}` : "GripLog"}
        right={
          <IconButton icon={Settings} label="Settings" onPress={() => router.push("/settings")} />
        }
      />
      <SegmentedControl options={TABS} value={tab} onChange={setTab} />
    </View>
  );

  return (
    <Screen>
      {tab === "you" ? <MyFeed header={header} /> : <FollowingFeed header={header} />}
    </Screen>
  );
}

/** Your own workouts, read from the phone's database. */
function MyFeed({ header }: { header: ReactElement }) {
  const router = useRouter();
  const { unit } = usePreferences();
  const workouts = useWorkouts();
  const hasActiveWorkout = useActiveWorkout((state) => state.workout !== null);
  const { startEmpty, resume } = useStartWorkout();
  const [visible, setVisible] = useState(PAGE_SIZE);

  const summaries = workouts.map((workout) => ({ workout, summary: summariseWorkout(workout) }));
  const weeks = weeklyBuckets(
    summaries.map(({ workout, summary }) => ({
      startedAt: workout.startedAt,
      volumeKg: summary.volumeKg,
      durationSeconds: summary.durationSeconds,
    })),
    CHART_WEEKS,
  );
  const thisWeek = weeks.at(-1);
  const streak = weekStreak(workouts.map((w) => w.startedAt));

  return (
    <FlatList
      data={summaries.slice(0, visible)}
      keyExtractor={(item) => item.workout.id}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      onEndReached={() => setVisible((count) => count + PAGE_SIZE)}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={
        <View style={styles.header}>
          {header}

          <Card style={styles.week}>
            <AppText variant="caption" color={Colors.muted}>
              Last 8 weeks
            </AppText>
            <View style={styles.weekStats}>
              <Stat
                label="This week"
                value={String(thisWeek?.workouts ?? 0)}
                unit={thisWeek?.workouts === 1 ? "workout" : "workouts"}
              />
              <Stat
                label="Volume"
                value={formatNumber(toDisplayWeight(thisWeek?.volumeKg ?? 0, unit), 0)}
                unit={unit}
              />
              <Stat label="Streak" value={String(streak)} unit={streak === 1 ? "week" : "weeks"} />
            </View>
            <BarChart
              height={96}
              highlightKey={thisWeek?.weekStart.toISOString()}
              data={weeks.map((week) => ({
                key: week.weekStart.toISOString(),
                label: formatShortDate(week.weekStart),
                value: week.volumeKg,
              }))}
            />
          </Card>

          {hasActiveWorkout ? (
            <Button label="Resume workout" icon={Play} size="lg" variant="dark" onPress={resume} />
          ) : (
            <Button
              label="Start workout"
              icon={Play}
              size="lg"
              onPress={startEmpty}
              testID="start-workout"
            />
          )}

          {workouts.length > 0 ? (
            <SectionLabel
              right={
                <AppText variant="label" color={Colors.muted}>
                  {workouts.length} total
                </AppText>
              }
            >
              Your workouts
            </SectionLabel>
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <WorkoutCard
          title={item.workout.title}
          startedAt={item.workout.startedAt}
          summary={item.summary}
          unit={unit}
          onPress={() => router.push(`/workouts/${item.workout.id}`)}
        />
      )}
      ListEmptyComponent={
        <EmptyState
          icon={Dumbbell}
          title="No workouts yet"
          message="Log your first session, or bring your whole history over from Hevy."
          action={
            <Button
              label="Import from Hevy"
              icon={Upload}
              variant="secondary"
              onPress={() => router.push("/import")}
            />
          }
        />
      }
      ListFooterComponent={
        visible < summaries.length ? (
          <AppText variant="label" color={Colors.faint} align="center">
            Loading more…
          </AppText>
        ) : null
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    gap: Spacing.lg,
  },
  header: {
    gap: Spacing.lg,
  },
  week: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  weekStats: {
    flexDirection: "row",
    gap: Spacing.md,
  },
});
