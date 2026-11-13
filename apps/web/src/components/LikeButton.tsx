import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { graphql } from "../lib/graphql";
import {
  toggleLikeInFeed,
  toggleLikeInWorkout,
  type FeedPage,
  type WorkoutData,
} from "../lib/likes";
import type { FeedWorkout } from "../lib/queries";

export function LikeButton({
  workout,
}: {
  workout: Pick<FeedWorkout, "id" | "likeCount" | "likedByMe">;
}) {
  const queryClient = useQueryClient();
  const toggle = useMutation({
    mutationFn: () =>
      graphql(
        workout.likedByMe
          ? `mutation($id: ID!) { unlikeWorkout(workoutId: $id) { id } }`
          : `mutation($id: ID!) { likeWorkout(workoutId: $id) { id } }`,
        { id: workout.id },
      ),
    onMutate: async () => {
      const feedKey = ["feed"];
      const workoutKey = ["workout", workout.id];
      await Promise.all([
        queryClient.cancelQueries({ queryKey: feedKey }),
        queryClient.cancelQueries({ queryKey: workoutKey }),
      ]);
      const previous = {
        feed: queryClient.getQueryData<InfiniteData<FeedPage>>(feedKey),
        workout: queryClient.getQueryData<WorkoutData>(workoutKey),
      };
      queryClient.setQueryData(feedKey, toggleLikeInFeed(previous.feed, workout.id));
      queryClient.setQueryData(workoutKey, toggleLikeInWorkout(previous.workout, workout.id));
      return previous;
    },
    onError: (_error, _vars, previous) => {
      queryClient.setQueryData(["feed"], previous?.feed);
      queryClient.setQueryData(["workout", workout.id], previous?.workout);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["workout", workout.id] });
    },
  });

  return (
    <button
      type="button"
      className="like"
      aria-pressed={workout.likedByMe}
      onClick={() => toggle.mutate()}
    >
      <span aria-hidden="true">{workout.likedByMe ? "♥" : "♡"}</span> {workout.likeCount}{" "}
      {workout.likeCount === 1 ? "like" : "likes"}
    </button>
  );
}
