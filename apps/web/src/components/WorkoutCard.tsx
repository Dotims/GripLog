import { formatDuration, formatWeight } from "@griplog/core";
import { Link } from "@tanstack/react-router";

import { formatDay } from "../lib/format";
import type { FeedWorkout } from "../lib/queries";
import { LikeButton } from "./LikeButton";

export function WorkoutCard({ workout }: { workout: FeedWorkout }) {
  const hidden = workout.exercises.length - 3;
  return (
    <article className="card">
      <div className="author">
        <div className="avatar">{workout.user.name.charAt(0).toUpperCase()}</div>
        <div>
          <div style={{ fontWeight: 700 }}>{workout.user.isMe ? "You" : workout.user.name}</div>
          <div className="meta">{formatDay(workout.startedAt)}</div>
        </div>
      </div>
      <Link to="/workouts/$id" params={{ id: workout.id }} style={{ textDecoration: "none" }}>
        <h2 className="workout-title">{workout.title}</h2>
      </Link>
      <div className="stats">
        <Stat label="Time" value={formatDuration(workout.durationSeconds)} />
        <Stat label="Volume" value={formatWeight(workout.volumeKg)} />
        <Stat label="Sets" value={String(workout.setCount)} />
      </div>
      <ul style={{ margin: 0, paddingLeft: 0, listStyle: "none", display: "grid", gap: 4 }}>
        {workout.exercises.slice(0, 3).map((e, i) => (
          <li key={i}>
            <span className="meta" style={{ display: "inline-block", width: 32 }}>
              {e.sets.length}×
            </span>
            {e.name}
          </li>
        ))}
      </ul>
      {hidden > 0 ? (
        <div className="meta" style={{ marginTop: 6 }}>
          + {hidden} more
        </div>
      ) : null}
      <LikeButton workout={workout} />
    </article>
  );
}

export function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}
