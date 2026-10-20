import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";

import { graphql } from "./graphql";

export type FeedWorkout = {
  id: string;
  title: string;
  startedAt: string;
  durationSeconds: number;
  volumeKg: number;
  setCount: number;
  likeCount: number;
  likedByMe: boolean;
  user: { id: string; name: string; isMe: boolean };
  exercises: { name: string; sets: { id: string }[] }[];
};

export type WorkoutDetail = Omit<FeedWorkout, "exercises"> & {
  notes: string | null;
  exercises: {
    id: string;
    name: string;
    exerciseId: string;
    sets: {
      id: string;
      type: string;
      weightKg: number | null;
      reps: number | null;
      rpe: number | null;
    }[];
  }[];
};

export type ExerciseSummary = {
  exerciseId: string;
  name: string;
  sessionCount: number;
  lastPerformedAt: string;
};

export type ExerciseProgress = {
  name: string;
  points: {
    performedAt: string;
    bestOneRepMax: number | null;
    topWeightKg: number;
    volumeKg: number;
  }[];
  suggestion: { kind: string; weightKg: number | null; reps: number | null; reason: string };
};

const CARD_FIELDS = `
  id title startedAt durationSeconds volumeKg setCount likeCount likedByMe
  user { id name isMe }
`;

/**
 * Query definitions live in one place as `queryOptions`, so the route loader
 * (prefetch) and the component (read) share the exact same key and fetcher.
 */
export const feedQuery = infiniteQueryOptions({
  queryKey: ["feed"],
  queryFn: ({ pageParam }) =>
    graphql<{ feed: { items: FeedWorkout[]; nextCursor: string | null } }>(
      `query Feed($after: String) { feed(first: 10, after: $after) { nextCursor items { ${CARD_FIELDS} exercises { name sets { id } } } } }`,
      { after: pageParam },
    ),
  initialPageParam: null as string | null,
  getNextPageParam: (last) => last.feed.nextCursor,
});

export const workoutQuery = (id: string) =>
  queryOptions({
    queryKey: ["workout", id],
    queryFn: () =>
      graphql<{ workout: WorkoutDetail | null }>(
        `query Workout($id: ID!) { workout(id: $id) { ${CARD_FIELDS} notes exercises { id name exerciseId sets { id type weightKg reps rpe } } } }`,
        { id },
      ),
  });

export const myExercisesQuery = queryOptions({
  queryKey: ["my-exercises"],
  queryFn: () =>
    graphql<{ myExercises: ExerciseSummary[] }>(`
      {
        myExercises {
          exerciseId
          name
          sessionCount
          lastPerformedAt
        }
      }
    `),
});

export const progressQuery = (exerciseId: string) =>
  queryOptions({
    queryKey: ["progress", exerciseId],
    queryFn: () =>
      graphql<{ exerciseProgress: ExerciseProgress }>(
        `
          query Progress($id: String!) {
            exerciseProgress(exerciseId: $id) {
              name
              points {
                performedAt
                bestOneRepMax
                topWeightKg
                volumeKg
              }
              suggestion {
                kind
                weightKg
                reps
                reason
              }
            }
          }
        `,
        { id: exerciseId },
      ),
  });
