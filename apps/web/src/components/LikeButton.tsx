import { useMutation, useQueryClient, type InfiniteData } from "@tanstack/react-query";

import { graphql } from "../lib/graphql";
import type { FeedWorkout } from "../lib/queries";

type FeedPage = { feed: { items: FeedWorkout[]; nextCursor: string | null } };

/** Optimistic like: the count changes at once and rolls back if the server says no. */
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
      await queryClient.cancelQueries({ queryKey: ["feed"] });
      const previous = queryClient.getQueryData<InfiniteData<FeedPage>>(["feed"]);
      queryClient.setQueryData<InfiniteData<FeedPage>>(["feed"], (data) =>
        data
          ? {
              ...data,
              pages: data.pages.map((page) => ({
                feed: {
                  ...page.feed,
                  items: page.feed.items.map((w) =>
                    w.id === workout.id
                      ? {
                          ...w,
                          likedByMe: !w.likedByMe,
                          likeCount: w.likeCount + (w.likedByMe ? -1 : 1),
                        }
                      : w,
                  ),
                },
              })),
            }
          : data,
      );
      return { previous };
    },
    onError: (_error, _vars, context) => queryClient.setQueryData(["feed"], context?.previous),
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
      {workout.likedByMe ? "♥" : "♡"} {workout.likeCount}{" "}
      {workout.likeCount === 1 ? "like" : "likes"}
    </button>
  );
}
