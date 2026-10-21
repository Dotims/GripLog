import { useRouter } from "expo-router";
import { Heart, LogIn, UserPlus, Users } from "lucide-react-native";
import type { ReactElement } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  View,
} from "react-native";

import { AppText, Button, EmptyState } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useSession } from "@/features/account/SessionProvider";
import { initials } from "@/features/profile/avatar";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { WorkoutCard } from "@/features/workouts/WorkoutCard";
import { readableError } from "@/lib/api";

import { useFeed, useToggleLike, type FeedWorkout } from "./api";

function LikeButton({ workout }: { workout: FeedWorkout }) {
  const toggle = useToggleLike();
  return (
    <Pressable
      onPress={() => toggle.mutate({ id: workout.id, liked: workout.likedByMe })}
      accessibilityRole="button"
      accessibilityLabel={workout.likedByMe ? "Unlike" : "Like"}
      style={({ pressed }) => [styles.like, pressed && { opacity: 0.6 }]}
    >
      <Heart
        color={workout.likedByMe ? Colors.accent : Colors.text}
        fill={workout.likedByMe ? Colors.accent : "transparent"}
        size={20}
        strokeWidth={2}
      />
      <AppText variant="label">{workout.likeCount}</AppText>
    </Pressable>
  );
}

export function FollowingFeed({ header }: { header: ReactElement }) {
  const router = useRouter();
  const { user } = useSession();
  const { unit } = usePreferences();
  const feed = useFeed();
  const items = feed.data?.pages.flatMap((page) => page.feed.items) ?? [];

  return (
    <FlatList
      data={items}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={feed.isRefetching} onRefresh={() => feed.refetch()} />
      }
      onEndReached={() => {
        if (feed.hasNextPage && !feed.isFetchingNextPage) feed.fetchNextPage();
      }}
      onEndReachedThreshold={0.5}
      ListHeaderComponent={
        <View style={styles.header}>
          {header}
          {user ? (
            <Button
              label="Find people"
              icon={UserPlus}
              variant="secondary"
              onPress={() => router.push("/people")}
            />
          ) : null}
        </View>
      }
      renderItem={({ item }) => (
        <WorkoutCard
          title={item.title}
          startedAt={item.startedAt}
          unit={unit}
          author={{
            name: item.user.isMe ? "You" : item.user.name,
            initials: initials(item.user.name, ""),
          }}
          summary={{
            durationSeconds: item.durationSeconds,
            volumeKg: item.volumeKg,
            sets: item.setCount,
            records: 0,
            exercises: item.exercises.map((e) => ({ name: e.name, sets: e.sets.length })),
          }}
          // Other people's workouts live on the server only; your own open locally.
          onPress={item.user.isMe ? () => router.push(`/workouts/${item.id}`) : undefined}
          footer={<LikeButton workout={item} />}
        />
      )}
      ListEmptyComponent={
        !user ? (
          <EmptyState
            icon={Users}
            title="Train together"
            message="Sign in to follow friends and see their workouts here."
            action={<Button label="Sign in" icon={LogIn} onPress={() => router.push("/account")} />}
          />
        ) : feed.isPending ? (
          <ActivityIndicator color={Colors.accent} />
        ) : feed.error ? (
          <AppText color={Colors.error}>{readableError(feed.error)}</AppText>
        ) : (
          <EmptyState
            icon={Users}
            title="Quiet here"
            message="Follow people to see their workouts next to yours."
          />
        )
      }
      ListFooterComponent={
        feed.isFetchingNextPage ? <ActivityIndicator color={Colors.accent} /> : null
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
  like: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
  },
});
