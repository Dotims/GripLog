import type { InfiniteData } from "@tanstack/react-query";

import type { FeedWorkout, WorkoutDetail } from "./queries";

export type FeedPage = { feed: { items: FeedWorkout[]; nextCursor: string | null } };
export type WorkoutData = { workout: WorkoutDetail | null };

type Likeable = { id: string; likedByMe: boolean; likeCount: number };

const toggle = <T extends Likeable>(workout: T, id: string): T =>
  workout.id === id
    ? {
        ...workout,
        likedByMe: !workout.likedByMe,
        likeCount: workout.likeCount + (workout.likedByMe ? -1 : 1),
      }
    : workout;

export function toggleLikeInFeed(
  data: InfiniteData<FeedPage> | undefined,
  id: string,
): InfiniteData<FeedPage> | undefined {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      feed: { ...page.feed, items: page.feed.items.map((w) => toggle(w, id)) },
    })),
  };
}

export function toggleLikeInWorkout(
  data: WorkoutData | undefined,
  id: string,
): WorkoutData | undefined {
  return data?.workout ? { workout: toggle(data.workout, id) } : data;
}
