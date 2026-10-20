import { describe, expect, it } from "vitest";

import { change, setupTestApp, workout } from "./helpers";

const { app, signUp } = setupTestApp();

type Headers = Record<string, string>;

async function gql<T>(headers: Headers, query: string, variables: Record<string, unknown> = {}) {
  const response = await app.request("/graphql", {
    method: "POST",
    headers,
    body: JSON.stringify({ query, variables }),
  });
  return (await response.json()) as { data: T; errors?: { message: string }[] };
}

async function pushWorkouts(headers: Headers, titles: string[], day = 10) {
  const changes = titles.map((title, i) =>
    change(
      workout({
        title,
        startedAt: `2026-10-${day + i}T10:00:00.000Z`,
        endedAt: `2026-10-${day + i}T11:00:00.000Z`,
      }),
    ),
  );
  await app.request("/sync/push", { method: "POST", headers, body: JSON.stringify({ changes }) });
}

const FEED = /* GraphQL */ `
  query Feed($after: String) {
    feed(first: 2, after: $after) {
      nextCursor
      items {
        id
        title
        volumeKg
        setCount
        likeCount
        likedByMe
        user {
          name
        }
        exercises {
          name
          sets {
            weightKg
            reps
          }
        }
      }
    }
  }
`;

type FeedData = {
  feed: {
    nextCursor: string | null;
    items: {
      id: string;
      title: string;
      volumeKg: number;
      likeCount: number;
      likedByMe: boolean;
      user: { name: string };
      exercises: { name: string }[];
    }[];
  };
};

describe("GraphQL feed", () => {
  it("requires a session", async () => {
    const response = await app.request("/graphql", { method: "POST", body: "{}" });
    expect(response.status).toBe(401);
  });

  it("shows my workouts and those of people I follow, newest first", async () => {
    const me = await signUp("me@example.com", "Radek");
    const friend = await signUp("friend@example.com", "Ola");
    const stranger = await signUp("stranger@example.com", "Nobody");
    await pushWorkouts(me.headers, ["My push"], 10);
    await pushWorkouts(friend.headers, ["Ola legs"], 12);
    await pushWorkouts(stranger.headers, ["Secret"], 14);

    const followed = await gql<{ follow: { followedByMe: boolean } }>(
      me.headers,
      `mutation($id: ID!) { follow(userId: $id) { followedByMe } }`,
      { id: friend.userId },
    );
    expect(followed.data.follow.followedByMe).toBe(true);

    const { data } = await gql<FeedData>(me.headers, FEED);
    expect(data.feed.items.map((w) => `${w.user.name}: ${w.title}`)).toEqual([
      "Ola: Ola legs",
      "Radek: My push",
    ]);
    expect(data.feed.items[0]).toMatchObject({
      volumeKg: 640,
      exercises: [{ name: "Barbell Bench Press - Medium Grip" }],
    });
  });

  it("pages with a cursor without repeating items", async () => {
    const me = await signUp("pager@example.com");
    await pushWorkouts(me.headers, ["One", "Two", "Three"], 10);

    const first = await gql<FeedData>(me.headers, FEED);
    const second = await gql<FeedData>(me.headers, FEED, { after: first.data.feed.nextCursor });

    expect(first.data.feed.items.map((w) => w.title)).toEqual(["Three", "Two"]);
    expect(second.data.feed.items.map((w) => w.title)).toEqual(["One"]);
    expect(second.data.feed.nextCursor).toBeNull();
  });

  it("counts likes and knows which ones are mine", async () => {
    const me = await signUp("liker@example.com");
    const friend = await signUp("liked@example.com");
    await pushWorkouts(friend.headers, ["Heavy day"]);
    await gql(me.headers, `mutation($id: ID!) { follow(userId: $id) { id } }`, {
      id: friend.userId,
    });
    const { data } = await gql<FeedData>(me.headers, FEED);
    const id = data.feed.items[0]!.id;

    const like = `mutation($id: ID!) { likeWorkout(workoutId: $id) { likeCount likedByMe } }`;
    await gql(me.headers, like, { id });
    const again = await gql<{ likeWorkout: { likeCount: number; likedByMe: boolean } }>(
      me.headers,
      like,
      { id },
    );

    expect(again.data.likeWorkout).toEqual({ likeCount: 1, likedByMe: true });
  });

  it("rejects a forged cursor with a clear error", async () => {
    const me = await signUp("forger@example.com");
    const result = await gql<FeedData>(me.headers, FEED, { after: "not-a-cursor" });
    expect(result.errors?.[0]?.message).toBe("Invalid cursor");
  });

  it("finds people by name but not myself", async () => {
    const me = await signUp("finder@example.com", "Radek Finder");
    await signUp("ola@example.com", "Ola Radecka");
    const { data } = await gql<{ searchUsers: { name: string }[] }>(
      me.headers,
      `{ searchUsers(query: "rad") { name } }`,
    );
    expect(data.searchUsers.map((u) => u.name)).toEqual(["Ola Radecka"]);
  });
});
