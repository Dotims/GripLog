import { weeklyBuckets, weekStreak } from "@griplog/core";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

import type { GripLogClient } from "./client";
import {
  findExercise,
  formatExerciseList,
  formatProgress,
  formatWorkout,
  formatWorkoutList,
  type ExerciseSummary,
  type ProgressPoint,
  type Suggestion,
  type WorkoutSummary,
} from "./format";

const WORKOUT_FIELDS = `
  id title startedAt durationSeconds volumeKg setCount
  exercises { name sets { type weightKg reps rpe } }
`;

/** Monday of the week in local time, not UTC, so the date matches the user's calendar. */
const localDay = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const text = (value: string) => ({ content: [{ type: "text" as const, text: value }] });

async function exercises(client: GripLogClient) {
  return (
    await client.query<{ myExercises: ExerciseSummary[] }>(
      `{ myExercises { exerciseId name sessionCount lastPerformedAt } }`,
    )
  ).myExercises;
}

async function recentWorkouts(client: GripLogClient, count: number): Promise<WorkoutSummary[]> {
  const workouts: WorkoutSummary[] = [];
  let after: string | null = null;
  while (workouts.length < count) {
    const page: { me: { workouts: { items: WorkoutSummary[]; nextCursor: string | null } } } =
      await client.query(
        `query($first: Int, $after: String) { me { workouts(first: $first, after: $after) { nextCursor items { ${WORKOUT_FIELDS} } } } }`,
        { first: Math.min(50, count - workouts.length), after },
      );
    workouts.push(...page.me.workouts.items);
    after = page.me.workouts.nextCursor;
    if (!after) break;
  }
  return workouts;
}

/**
 * The AI coach as an MCP server. An assistant such as Claude calls these tools
 * to read your history; every number in the answers comes from GripLog's own
 * tested functions, and the model only explains and plans around them.
 */
export function createCoachServer(client: GripLogClient): McpServer {
  const server = new McpServer({ name: "griplog-coach", version: "0.1.0" });

  server.registerTool(
    "list_exercises",
    {
      title: "List exercises",
      description: "Every exercise the user has logged, with how often and when they last did it.",
    },
    async () => text(formatExerciseList(await exercises(client))),
  );

  server.registerTool(
    "exercise_progress",
    {
      title: "Exercise progress",
      description:
        "Session by session history of one exercise (top weight, estimated 1RM, volume) and the rule-based suggestion for the next session.",
      inputSchema: {
        exercise: z.string().min(2).describe("Exercise name or id, for example 'bench press'"),
      },
    },
    async ({ exercise }) => {
      const match = findExercise(await exercises(client), exercise);
      if (!match)
        return text(
          `No logged exercise matches "${exercise}". Call list_exercises to see the names.`,
        );
      const { exerciseProgress } = await client.query<{
        exerciseProgress: { name: string; points: ProgressPoint[]; suggestion: Suggestion };
      }>(
        `query($id: String!) { exerciseProgress(exerciseId: $id) { name points { performedAt bestOneRepMax topWeightKg volumeKg } suggestion { kind weightKg reps reason } } }`,
        { id: match.exerciseId },
      );
      return text(
        formatProgress(exerciseProgress.name, exerciseProgress.points, exerciseProgress.suggestion),
      );
    },
  );

  server.registerTool(
    "recent_workouts",
    {
      title: "Recent workouts",
      description: "The user's latest workouts with duration, volume and exercises, newest first.",
      inputSchema: { count: z.number().int().min(1).max(30).default(5) },
    },
    async ({ count }) => text(formatWorkoutList(await recentWorkouts(client, count))),
  );

  server.registerTool(
    "get_workout",
    {
      title: "Workout details",
      description: "Every set of one workout. Take the id from recent_workouts.",
      inputSchema: { id: z.uuid() },
    },
    async ({ id }) => {
      const { workout } = await client.query<{ workout: WorkoutSummary | null }>(
        `query($id: ID!) { workout(id: $id) { ${WORKOUT_FIELDS} } }`,
        { id },
      );
      return text(workout ? formatWorkout(workout) : "No workout with that id.");
    },
  );

  server.registerTool(
    "training_overview",
    {
      title: "Training overview",
      description:
        "Workouts, volume and hours per week over the last weeks, plus the current weekly streak.",
      inputSchema: { weeks: z.number().int().min(1).max(26).default(8) },
    },
    async ({ weeks }) => {
      const workouts = await recentWorkouts(client, weeks * 7);
      const buckets = weeklyBuckets(
        workouts.map((w) => ({
          startedAt: w.startedAt,
          volumeKg: w.volumeKg,
          durationSeconds: w.durationSeconds,
        })),
        weeks,
      );
      const rows = buckets.map(
        (b) =>
          `| ${localDay(b.weekStart)} | ${b.workouts} | ${Math.round(b.volumeKg)} kg | ${(b.durationSeconds / 3600).toFixed(1)} h |`,
      );
      const streak = weekStreak(workouts.map((w) => w.startedAt));
      return text(
        [
          `Current streak: ${streak} ${streak === 1 ? "week" : "weeks"} with at least one workout.`,
          "",
          "| Week of | Workouts | Volume | Time |",
          "| --- | --- | --- | --- |",
          ...rows,
        ].join("\n"),
      );
    },
  );

  server.registerPrompt(
    "review_my_training",
    {
      title: "Review my training",
      description: "Ask the assistant for a weekly review with concrete next steps.",
    },
    () => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text:
              "Review my last four weeks of training. Use training_overview, recent_workouts and exercise_progress " +
              "for my three most frequent lifts. Tell me what is progressing, what has stalled, and what to do next " +
              "session. Quote the numbers from the tools instead of estimating your own.",
          },
        },
      ],
    }),
  );

  return server;
}
