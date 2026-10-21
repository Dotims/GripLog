import {
  formatDuration,
  formatNumber,
  formatWeight,
  setLabel,
  setNumbers,
  type SetType,
} from "@griplog/core";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";

import { LikeButton } from "../components/LikeButton";
import { Stat } from "../components/WorkoutCard";
import { formatDay } from "../lib/format";
import { workoutQuery } from "../lib/queries";

export function WorkoutPage({ id }: { id: string }) {
  const { data } = useSuspenseQuery(workoutQuery(id));
  const workout = data.workout;

  if (!workout) {
    return (
      <div className="card">
        This workout does not exist or was deleted. <Link to="/">Back to the feed</Link>
      </div>
    );
  }

  return (
    <>
      <p className="eyebrow">
        {workout.user.isMe ? "Your workout" : workout.user.name} · {formatDay(workout.startedAt)}
      </p>
      <h1 className="title">{workout.title}</h1>
      {workout.notes ? <p>{workout.notes}</p> : null}
      <div className="card">
        <div className="stats" style={{ margin: 0, border: "none", padding: 0 }}>
          <Stat label="Time" value={formatDuration(workout.durationSeconds)} />
          <Stat label="Volume" value={formatWeight(workout.volumeKg)} />
          <Stat label="Sets" value={String(workout.setCount)} />
        </div>
        <LikeButton workout={workout} />
      </div>
      {workout.exercises.map((exercise) => {
        const numbers = setNumbers(exercise.sets.map((s) => ({ type: s.type as SetType })));
        return (
          <section key={exercise.id} className="card">
            <h2 className="exercise-name">
              {workout.user.isMe ? (
                <Link to="/progress" search={{ exercise: exercise.exerciseId }}>
                  {exercise.name}
                </Link>
              ) : (
                exercise.name
              )}
            </h2>
            {exercise.sets.map((set, index) => (
              <div key={set.id} className="set-row">
                <span className="set-label">
                  {setLabel(set.type as SetType, numbers[index] ?? 0)}
                </span>
                <span>
                  {set.weightKg !== null
                    ? `${formatNumber(set.weightKg)} kg × ${set.reps ?? 0}`
                    : `${set.reps ?? 0} reps`}
                  {set.rpe ? ` @${set.rpe}` : ""}
                </span>
              </div>
            ))}
          </section>
        );
      })}
    </>
  );
}
