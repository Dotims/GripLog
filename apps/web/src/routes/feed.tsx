import { useSuspenseInfiniteQuery } from "@tanstack/react-query";

import { WorkoutCard } from "../components/WorkoutCard";
import { feedQuery } from "../lib/queries";

export function FeedPage() {
  const feed = useSuspenseInfiniteQuery(feedQuery);
  const workouts = feed.data.pages.flatMap((page) => page.feed.items);

  return (
    <>
      <p className="eyebrow">You and the people you follow</p>
      <h1 className="title">Feed</h1>
      {workouts.length === 0 ? (
        <div className="card">
          Nothing yet. Log a workout in the app and it shows up here after it syncs.
        </div>
      ) : (
        workouts.map((workout) => <WorkoutCard key={workout.id} workout={workout} />)
      )}
      {feed.hasNextPage ? (
        <button
          className="button button-secondary"
          style={{ marginTop: 24 }}
          disabled={feed.isFetchingNextPage}
          onClick={() => feed.fetchNextPage()}
        >
          {feed.isFetchingNextPage ? "Loading" : "Load more"}
        </button>
      ) : null}
    </>
  );
}
