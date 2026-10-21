import { formatNumber } from "@griplog/core";
import { useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";

import { LineChart } from "../components/LineChart";
import { formatShortDate } from "../lib/format";
import { myExercisesQuery, progressQuery } from "../lib/queries";

type Metric = "bestOneRepMax" | "topWeightKg" | "volumeKg";

const METRICS: { value: Metric; label: string }[] = [
  { value: "bestOneRepMax", label: "Estimated 1RM" },
  { value: "topWeightKg", label: "Top weight" },
  { value: "volumeKg", label: "Volume" },
];

export function ProgressPage({ exerciseId }: { exerciseId: string | undefined }) {
  const navigate = useNavigate({ from: "/progress" });
  const { data } = useSuspenseQuery(myExercisesQuery);
  const [metric, setMetric] = useState<Metric>("bestOneRepMax");
  const [filter, setFilter] = useState("");
  const selected = exerciseId ?? data.myExercises[0]?.exerciseId;
  const progress = useQuery({ ...progressQuery(selected ?? ""), enabled: Boolean(selected) });

  const points = progress.data?.exerciseProgress.points.filter((p) => p[metric] !== null) ?? [];
  const exercises = data.myExercises.filter((e) =>
    e.name.toLowerCase().includes(filter.toLowerCase()),
  );
  const suggestion = progress.data?.exerciseProgress.suggestion;

  return (
    <>
      <p className="eyebrow">Every exercise you have logged</p>
      <h1 className="title">Progress</h1>
      <div className="grid grid-2">
        <div className="card" style={{ padding: 0, maxHeight: 640, overflow: "auto" }}>
          <div style={{ padding: 12 }}>
            <input
              className="input"
              placeholder="Filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{ width: "100%" }}
            />
          </div>
          {exercises.map((exercise) => (
            <button
              key={exercise.exerciseId}
              className="list-row"
              aria-current={exercise.exerciseId === selected}
              onClick={() => navigate({ search: { exercise: exercise.exerciseId } })}
            >
              <span>{exercise.name}</span>
              <span className="meta">{exercise.sessionCount}×</span>
            </button>
          ))}
        </div>

        <div className="grid">
          {suggestion && suggestion.kind !== "no_data" ? (
            <div className="card suggestion">
              <div className="stat-label">Next session</div>
              <div className="title" style={{ margin: "6px 0 4px", fontSize: 34 }}>
                {formatNumber(suggestion.weightKg ?? 0)} kg × {suggestion.reps}
              </div>
              <p className="meta" style={{ margin: 0, fontSize: 15 }}>
                {suggestion.reason}
              </p>
            </div>
          ) : null}
          <div className="card">
            <h2 className="workout-title" style={{ marginTop: 0 }}>
              {progress.data?.exerciseProgress.name ?? "Pick an exercise"}
            </h2>
            <div className="segmented">
              {METRICS.map((m) => (
                <button
                  key={m.value}
                  aria-pressed={m.value === metric}
                  onClick={() => setMetric(m.value)}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {progress.isPending && selected ? (
              <p className="meta">Loading</p>
            ) : (
              <LineChart
                values={points.map((p) => p[metric] ?? 0)}
                labels={points.map((p) => formatShortDate(p.performedAt))}
                format={(v) => `${formatNumber(v)} kg`}
              />
            )}
          </div>
        </div>
      </div>
    </>
  );
}
