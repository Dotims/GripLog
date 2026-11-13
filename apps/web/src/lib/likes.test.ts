import { describe, expect, it } from "vitest";

import { toggleLikeInFeed, toggleLikeInWorkout, type FeedPage, type WorkoutData } from "./likes";
import type { FeedWorkout } from "./queries";

const card = (id: string, likedByMe: boolean, likeCount: number) =>
  ({ id, likedByMe, likeCount }) as FeedWorkout;

describe("optimistic likes", () => {
  it("flips only the liked workout in every feed page", () => {
    const feed = {
      pages: [
        { feed: { items: [card("a", false, 2), card("b", true, 5)], nextCursor: "x" } },
        { feed: { items: [card("c", false, 0)], nextCursor: null } },
      ] satisfies FeedPage[],
      pageParams: [null, "x"],
    };

    const next = toggleLikeInFeed(feed, "a")!;
    expect(next.pages[0]!.feed.items[0]).toMatchObject({ likedByMe: true, likeCount: 3 });
    expect(next.pages[0]!.feed.items[1]).toBe(feed.pages[0]!.feed.items[1]);
    expect(toggleLikeInFeed(next, "a")).toEqual(feed);
  });

  it("flips the workout on its own page too", () => {
    const detail = { workout: card("b", true, 5) } as WorkoutData;
    expect(toggleLikeInWorkout(detail, "b")?.workout).toMatchObject({
      likedByMe: false,
      likeCount: 4,
    });
    expect(toggleLikeInWorkout({ workout: null }, "b")).toEqual({ workout: null });
    expect(toggleLikeInWorkout(undefined, "b")).toBeUndefined();
  });
});
