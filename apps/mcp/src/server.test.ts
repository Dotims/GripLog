import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { InMemoryTransport } from "@modelcontextprotocol/sdk/inMemory.js";
import { describe, expect, it } from "vitest";

import type { GripLogClient } from "./client";
import { findExercise, type ExerciseSummary } from "./format";
import { createCoachServer } from "./server";

const exercises: ExerciseSummary[] = [
  {
    exerciseId: "Barbell_Bench_Press_-_Medium_Grip",
    name: "Barbell Bench Press - Medium Grip",
    sessionCount: 14,
    lastPerformedAt: "2026-10-14T16:00:00.000Z",
  },
  {
    exerciseId: "Dumbbell_Bench_Press",
    name: "Dumbbell Bench Press",
    sessionCount: 59,
    lastPerformedAt: "2026-10-20T16:00:00.000Z",
  },
];

/** A fake API that answers by looking at which field the query asks for. */
const fakeApi: GripLogClient = {
  async query<T>(query: string): Promise<T> {
    if (query.includes("myExercises")) return { myExercises: exercises } as T;
    if (query.includes("exerciseProgress"))
      return {
        exerciseProgress: {
          name: "Dumbbell Bench Press",
          points: [
            {
              performedAt: "2026-10-01T16:00:00.000Z",
              bestOneRepMax: 35.2,
              topWeightKg: 30,
              volumeKg: 900,
            },
            {
              performedAt: "2026-10-08T16:00:00.000Z",
              bestOneRepMax: 37.8,
              topWeightKg: 31.5,
              volumeKg: 950,
            },
          ],
          suggestion: {
            kind: "add_reps",
            weightKg: 31.5,
            reps: 7,
            reason: "Stay at 31.5 kg and aim for 7 reps on every set.",
          },
        },
      } as T;
    throw new Error(`Unexpected query ${query}`);
  },
};

async function connect() {
  const [clientTransport, serverTransport] = InMemoryTransport.createLinkedPair();
  await createCoachServer(fakeApi).connect(serverTransport);
  const client = new Client({ name: "test", version: "1.0.0" });
  await client.connect(clientTransport);
  return client;
}

describe("coach MCP server", () => {
  it("exposes the training tools and the review prompt", async () => {
    const client = await connect();
    const { tools } = await client.listTools();
    expect(tools.map((t) => t.name).sort()).toEqual([
      "exercise_progress",
      "get_workout",
      "list_exercises",
      "recent_workouts",
      "training_overview",
    ]);
    expect((await client.listPrompts()).prompts.map((p) => p.name)).toEqual(["review_my_training"]);
  });

  it("answers exercise_progress with the API's numbers and suggestion", async () => {
    const client = await connect();
    const result = await client.callTool({
      name: "exercise_progress",
      arguments: { exercise: "dumbbell bench" },
    });
    const [content] = result.content as { type: string; text: string }[];
    expect(content?.text).toContain("Estimated 1RM went from 35.2 kg to a best of 37.8 kg");
    expect(content?.text).toContain("Stay at 31.5 kg and aim for 7 reps");
  });

  it("says so when nothing matches", async () => {
    const client = await connect();
    const result = await client.callTool({
      name: "exercise_progress",
      arguments: { exercise: "deadlift" },
    });
    expect((result.content as { text: string }[])[0]?.text).toContain(
      'No logged exercise matches "deadlift"',
    );
  });
});

describe("findExercise", () => {
  it("prefers exact names and ids, then the most logged match", () => {
    expect(findExercise(exercises, "dumbbell bench press")?.exerciseId).toBe(
      "Dumbbell_Bench_Press",
    );
    expect(findExercise(exercises, "Barbell_Bench_Press_-_Medium_Grip")?.sessionCount).toBe(14);
    expect(findExercise(exercises, "bench")?.exerciseId).toBe("Dumbbell_Bench_Press");
  });
});
