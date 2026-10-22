import { catalogueName } from "@griplog/catalogue";
import {
  bestOneRepMax,
  isWorkingSet,
  SET_TYPES,
  suggestNextSession,
  totalVolume,
  workingSetCount,
  type Suggestion,
} from "@griplog/core";
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  ilike,
  inArray,
  isNull,
  ne,
  notInArray,
  or,
  sql,
  type SQL,
} from "drizzle-orm";

import type { Database } from "../db/client";
import type { sets, workoutExercises } from "../db/schema";
import { follows, likes, user, workouts } from "../db/schema";
import {
  exerciseName,
  exerciseSessions,
  exercisesDone,
  type ExerciseSummary,
} from "../training/history";
import { builder } from "./builder";
import { clientError } from "./errors";
import type { Loaders } from "./loaders";
import { decodeCursor, encodeCursor, pageSize } from "./pagination";

type UserRow = typeof user.$inferSelect;
type WorkoutRow = typeof workouts.$inferSelect;
type WorkoutExerciseRow = typeof workoutExercises.$inferSelect & { ownerId: string };
type SetRow = typeof sets.$inferSelect;
type WorkoutPage = { items: WorkoutRow[]; nextCursor: string | null };

const SetTypeEnum = builder.enumType("SetType", { values: SET_TYPES });

const SetRef = builder.objectRef<SetRow>("Set").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    type: t.field({ type: SetTypeEnum, resolve: (set) => set.type }),
    weightKg: t.exposeFloat("weightKg", { nullable: true }),
    reps: t.exposeInt("reps", { nullable: true }),
    rpe: t.exposeFloat("rpe", { nullable: true }),
    durationSeconds: t.exposeInt("durationSeconds", { nullable: true }),
    distanceMeters: t.exposeInt("distanceMeters", { nullable: true }),
  }),
});

const WorkoutExerciseRef = builder.objectRef<WorkoutExerciseRow>("WorkoutExercise").implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    exerciseId: t.exposeString("exerciseId"),
    notes: t.exposeString("notes", { nullable: true }),
    name: t.string({
      // Catalogue names ship with the server; custom ones belong to the workout's owner.
      resolve: async (exercise, _args, { loaders }) =>
        catalogueName(exercise.exerciseId) ??
        (await loaders.customExerciseName.load(`${exercise.ownerId}:${exercise.exerciseId}`)) ??
        "Exercise",
    }),
    sets: t.field({
      type: [SetRef],
      resolve: (exercise, _args, { loaders }) => loaders.setsByWorkoutExercise.load(exercise.id),
    }),
  }),
});

const UserRef = builder.objectRef<UserRow>("User");
const WorkoutRef = builder.objectRef<WorkoutRow>("Workout");

const WorkoutPageRef = builder.objectRef<WorkoutPage>("WorkoutPage").implement({
  fields: (t) => ({
    items: t.field({ type: [WorkoutRef], resolve: (page) => page.items }),
    nextCursor: t.exposeString("nextCursor", { nullable: true }),
  }),
});

async function allSets(workout: WorkoutRow, loaders: Loaders) {
  const exercises = await loaders.exercisesByWorkout.load(workout.id);
  return (await Promise.all(exercises.map((e) => loaders.setsByWorkoutExercise.load(e.id)))).flat();
}

WorkoutRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    title: t.exposeString("title"),
    notes: t.exposeString("notes", { nullable: true }),
    startedAt: t.field({ type: "DateTime", resolve: (w) => w.startedAt }),
    endedAt: t.field({ type: "DateTime", resolve: (w) => w.endedAt }),
    durationSeconds: t.int({
      resolve: (w) => Math.round((w.endedAt.getTime() - w.startedAt.getTime()) / 1000),
    }),
    user: t.field({
      type: UserRef,
      resolve: (w, _args, { loaders }) => loaders.user.load(w.userId),
    }),
    exercises: t.field({
      type: [WorkoutExerciseRef],
      resolve: async (w, _args, { loaders }) =>
        (await loaders.exercisesByWorkout.load(w.id)).map((e) => ({ ...e, ownerId: w.userId })),
    }),
    volumeKg: t.float({
      resolve: async (w, _args, { loaders }) => totalVolume(await allSets(w, loaders)),
    }),
    setCount: t.int({
      resolve: async (w, _args, { loaders }) => workingSetCount(await allSets(w, loaders)),
    }),
    likeCount: t.int({ resolve: (w, _args, { loaders }) => loaders.likeCount.load(w.id) }),
    likedByMe: t.boolean({ resolve: (w, _args, { loaders }) => loaders.likedByViewer.load(w.id) }),
  }),
});

/** Visible workouts, newest first, one keyset page at a time. */
async function workoutPage(
  db: Database,
  filter: SQL,
  first: number | null | undefined,
  after: string | null | undefined,
): Promise<WorkoutPage> {
  const limit = pageSize(first);
  const cursor = after ? decodeCursor(after) : null;
  const rows = await db
    .select()
    .from(workouts)
    .where(
      and(
        isNull(workouts.deletedAt),
        filter,
        cursor
          ? sql`(${workouts.startedAt}, ${workouts.id}) < (${cursor.startedAt.toISOString()}::timestamptz, ${cursor.id}::uuid)`
          : undefined,
      ),
    )
    .orderBy(desc(workouts.startedAt), desc(workouts.id))
    .limit(limit + 1);
  const items = rows.slice(0, limit);
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      rows.length > limit && last ? encodeCursor({ startedAt: last.startedAt, id: last.id }) : null,
  };
}

UserRef.implement({
  fields: (t) => ({
    id: t.exposeID("id"),
    name: t.exposeString("name"),
    image: t.exposeString("image", { nullable: true }),
    isMe: t.boolean({ resolve: (u, _args, { viewer }) => u.id === viewer.id }),
    followedByMe: t.boolean({
      resolve: (u, _args, { loaders }) => loaders.followedByViewer.load(u.id),
    }),
    followerCount: t.int({
      resolve: async (u, _args, { db }) =>
        (await db.select({ value: count() }).from(follows).where(eq(follows.followeeId, u.id)))[0]
          ?.value ?? 0,
    }),
    followingCount: t.int({
      resolve: async (u, _args, { db }) =>
        (await db.select({ value: count() }).from(follows).where(eq(follows.followerId, u.id)))[0]
          ?.value ?? 0,
    }),
    workoutCount: t.int({
      resolve: async (u, _args, { db }) =>
        (
          await db
            .select({ value: count() })
            .from(workouts)
            .where(and(eq(workouts.userId, u.id), isNull(workouts.deletedAt)))
        )[0]?.value ?? 0,
    }),
    workouts: t.field({
      type: WorkoutPageRef,
      args: { first: t.arg.int(), after: t.arg.string() },
      resolve: (u, args, { db }) =>
        workoutPage(db, eq(workouts.userId, u.id), args.first, args.after),
    }),
  }),
});

type ProgressPoint = {
  performedAt: Date;
  bestOneRepMax: number | null;
  topWeightKg: number;
  volumeKg: number;
};

const ProgressPointRef = builder.objectRef<ProgressPoint>("ProgressPoint").implement({
  fields: (t) => ({
    performedAt: t.field({ type: "DateTime", resolve: (p) => p.performedAt }),
    bestOneRepMax: t.exposeFloat("bestOneRepMax", { nullable: true }),
    topWeightKg: t.exposeFloat("topWeightKg"),
    volumeKg: t.exposeFloat("volumeKg"),
  }),
});

const SuggestionRef = builder.objectRef<Suggestion>("Suggestion").implement({
  fields: (t) => ({
    kind: t.exposeString("kind"),
    weightKg: t.exposeFloat("weightKg", { nullable: true }),
    reps: t.exposeInt("reps", { nullable: true }),
    reason: t.exposeString("reason"),
  }),
});

const ExerciseSummaryRef = builder.objectRef<ExerciseSummary>("ExerciseSummary").implement({
  fields: (t) => ({
    exerciseId: t.exposeString("exerciseId"),
    name: t.exposeString("name"),
    sessionCount: t.exposeInt("sessionCount"),
    lastPerformedAt: t.field({ type: "DateTime", resolve: (e) => e.lastPerformedAt }),
  }),
});

type ExerciseProgress = {
  exerciseId: string;
  name: string;
  points: ProgressPoint[];
  suggestion: Suggestion;
};

const ExerciseProgressRef = builder.objectRef<ExerciseProgress>("ExerciseProgress").implement({
  fields: (t) => ({
    exerciseId: t.exposeString("exerciseId"),
    name: t.exposeString("name"),
    points: t.field({ type: [ProgressPointRef], resolve: (p) => p.points }),
    suggestion: t.field({ type: SuggestionRef, resolve: (p) => p.suggestion }),
  }),
});

builder.queryType({
  fields: (t) => ({
    workout: t.field({
      type: WorkoutRef,
      nullable: true,
      args: { id: t.arg.id({ required: true }) },
      resolve: async (_root, args, { db }) => {
        const [row] = await db
          .select()
          .from(workouts)
          .where(and(eq(workouts.id, String(args.id)), isNull(workouts.deletedAt)));
        return row ?? null;
      },
    }),
    myExercises: t.field({
      type: [ExerciseSummaryRef],
      resolve: (_root, _args, { db, viewer }) => exercisesDone(db, viewer.id),
    }),
    /** Charts and the next-session suggestion come from the same pure functions the app uses. */
    exerciseProgress: t.field({
      type: ExerciseProgressRef,
      args: { exerciseId: t.arg.string({ required: true }) },
      resolve: async (_root, args, { db, viewer }) => {
        const sessions = await exerciseSessions(db, viewer.id, args.exerciseId);
        return {
          exerciseId: args.exerciseId,
          name: await exerciseName(db, viewer.id, args.exerciseId),
          points: sessions.map((s) => ({
            performedAt: s.performedAtDate,
            bestOneRepMax: bestOneRepMax(s.sets),
            topWeightKg: Math.max(
              0,
              ...s.sets.filter(isWorkingSet).map((set) => set.weightKg ?? 0),
            ),
            volumeKg: totalVolume(s.sets),
          })),
          suggestion: suggestNextSession(sessions),
        };
      },
    }),
    me: t.field({
      type: UserRef,
      resolve: (_root, _args, { loaders, viewer }) => loaders.user.load(viewer.id),
    }),
    user: t.field({
      type: UserRef,
      nullable: true,
      args: { id: t.arg.id({ required: true }) },
      resolve: (_root, args, { loaders }) => loaders.user.load(String(args.id)).catch(() => null),
    }),
    /** Your workouts and those of people you follow. */
    feed: t.field({
      type: WorkoutPageRef,
      args: { first: t.arg.int(), after: t.arg.string() },
      resolve: (_root, args, { db, viewer }) => {
        const followees = db
          .select({ id: follows.followeeId })
          .from(follows)
          .where(eq(follows.followerId, viewer.id));
        return workoutPage(
          db,
          or(eq(workouts.userId, viewer.id), inArray(workouts.userId, followees))!,
          args.first,
          args.after,
        );
      },
    }),
    /** People you do not follow yet, the most active first. */
    suggestedUsers: t.field({
      type: [UserRef],
      args: { first: t.arg.int() },
      resolve: (_root, args, { db, viewer }) => {
        const followees = db
          .select({ id: follows.followeeId })
          .from(follows)
          .where(eq(follows.followerId, viewer.id));
        const activity = db
          .select({ userId: workouts.userId, total: count().as("total") })
          .from(workouts)
          .where(isNull(workouts.deletedAt))
          .groupBy(workouts.userId)
          .as("activity");
        return db
          .select(getTableColumns(user))
          .from(user)
          .leftJoin(activity, eq(activity.userId, user.id))
          .where(and(ne(user.id, viewer.id), notInArray(user.id, followees)))
          .orderBy(desc(sql`coalesce(${activity.total}, 0)`), user.name)
          .limit(Math.min(Math.max(args.first ?? 10, 1), 20));
      },
    }),
    searchUsers: t.field({
      type: [UserRef],
      args: { query: t.arg.string({ required: true }) },
      resolve: async (_root, args, { db, viewer }) => {
        const query = args.query.trim();
        if (query.length < 2) return [];
        return db
          .select()
          .from(user)
          .where(
            and(ne(user.id, viewer.id), ilike(user.name, `%${query.replace(/[%_\\]/g, "\\$&")}%`)),
          )
          .orderBy(user.name)
          .limit(20);
      },
    }),
  }),
});

async function requireUser(db: Database, id: string): Promise<UserRow> {
  const [row] = await db.select().from(user).where(eq(user.id, id));
  if (!row) throw clientError("User not found", "NOT_FOUND");
  return row;
}

async function requireWorkout(db: Database, id: string): Promise<WorkoutRow> {
  const [row] = await db
    .select()
    .from(workouts)
    .where(and(eq(workouts.id, id), isNull(workouts.deletedAt)));
  if (!row) throw clientError("Workout not found", "NOT_FOUND");
  return row;
}

builder.mutationType({
  fields: (t) => ({
    follow: t.field({
      type: UserRef,
      args: { userId: t.arg.id({ required: true }) },
      resolve: async (_root, args, { db, viewer, loaders }) => {
        const target = await requireUser(db, String(args.userId));
        if (target.id === viewer.id)
          throw clientError("You cannot follow yourself", "BAD_USER_INPUT");
        await db
          .insert(follows)
          .values({ followerId: viewer.id, followeeId: target.id })
          .onConflictDoNothing();
        loaders.followedByViewer.clear(target.id);
        return target;
      },
    }),
    unfollow: t.field({
      type: UserRef,
      args: { userId: t.arg.id({ required: true }) },
      resolve: async (_root, args, { db, viewer, loaders }) => {
        const target = await requireUser(db, String(args.userId));
        await db
          .delete(follows)
          .where(and(eq(follows.followerId, viewer.id), eq(follows.followeeId, target.id)));
        loaders.followedByViewer.clear(target.id);
        return target;
      },
    }),
    likeWorkout: t.field({
      type: WorkoutRef,
      args: { workoutId: t.arg.id({ required: true }) },
      resolve: async (_root, args, { db, viewer, loaders }) => {
        const workout = await requireWorkout(db, String(args.workoutId));
        await db
          .insert(likes)
          .values({ userId: viewer.id, workoutId: workout.id })
          .onConflictDoNothing();
        loaders.likeCount.clear(workout.id);
        loaders.likedByViewer.clear(workout.id);
        return workout;
      },
    }),
    unlikeWorkout: t.field({
      type: WorkoutRef,
      args: { workoutId: t.arg.id({ required: true }) },
      resolve: async (_root, args, { db, viewer, loaders }) => {
        const workout = await requireWorkout(db, String(args.workoutId));
        await db
          .delete(likes)
          .where(and(eq(likes.userId, viewer.id), eq(likes.workoutId, workout.id)));
        loaders.likeCount.clear(workout.id);
        loaders.likedByViewer.clear(workout.id);
        return workout;
      },
    }),
  }),
});

export const schema = builder.toSchema();
