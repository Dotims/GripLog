import { draftFromTemplate, newDraftExercise, toWorkoutInput, workoutTotals } from "./draft";
import { createActiveWorkoutStore } from "./store";

const bench = { exerciseId: "bench", name: "Bench Press", trackingType: "weight_reps" as const };

function startedStore() {
  const store = createActiveWorkoutStore();
  store.getState().start({ title: "Push" });
  store
    .getState()
    .addExercises([
      newDraftExercise(
        bench,
        [{ type: "normal", weightKg: 80, reps: 8, durationSeconds: null }],
        90,
      ),
    ]);
  return store;
}

const firstExercise = (store: ReturnType<typeof startedStore>) =>
  store.getState().workout!.exercises[0]!;

describe("active workout store", () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-10-14T18:00:00.000Z"));
  });

  afterEach(() => jest.useRealTimers());

  it("starts with as many sets as last time", () => {
    const store = startedStore();
    expect(store.getState().workout).toMatchObject({
      title: "Push",
      startedAt: "2026-10-14T18:00:00.000Z",
    });
    expect(firstExercise(store).sets).toHaveLength(1);
  });

  it("fills a completed empty set from the previous workout and starts the rest timer", () => {
    const store = startedStore();
    const exercise = firstExercise(store);
    store.getState().toggleSetCompleted(exercise.id, exercise.sets[0]!.id);

    expect(firstExercise(store).sets[0]).toMatchObject({ weightKg: 80, reps: 8, completed: true });
    expect(store.getState().rest).toEqual({
      startedAt: Date.now(),
      endsAt: Date.now() + 90_000,
    });
  });

  it("keeps values typed by the user when completing", () => {
    const store = startedStore();
    const { id, sets } = firstExercise(store);
    store.getState().updateSet(id, sets[0]!.id, { weightKg: 85 });
    store.getState().toggleSetCompleted(id, sets[0]!.id);
    expect(firstExercise(store).sets[0]).toMatchObject({ weightKg: 85, reps: 8 });
  });

  it("copies the last set when adding one", () => {
    const store = startedStore();
    const { id, sets } = firstExercise(store);
    store.getState().updateSet(id, sets[0]!.id, { weightKg: 60, reps: 12 });
    store.getState().addSet(id);
    expect(firstExercise(store).sets[1]).toMatchObject({
      weightKg: 60,
      reps: 12,
      completed: false,
    });
  });

  it("cycles set types and wraps around", () => {
    const store = startedStore();
    const { id, sets } = firstExercise(store);
    const types = Array.from({ length: 4 }, () => {
      store.getState().cycleSetType(id, sets[0]!.id);
      return firstExercise(store).sets[0]!.type;
    });
    expect(types).toEqual(["warmup", "dropset", "failure", "normal"]);
  });

  it("moves exercises without falling off either end", () => {
    const store = startedStore();
    store
      .getState()
      .addExercises([newDraftExercise({ ...bench, exerciseId: "squat", name: "Squat" }, [], 120)]);
    const [a, b] = store.getState().workout!.exercises;
    store.getState().moveExercise(a!.id, -1);
    store.getState().moveExercise(a!.id, 1);
    expect(store.getState().workout!.exercises.map((e) => e.id)).toEqual([b!.id, a!.id]);
  });

  it("clears the rest timer when shortened past zero", () => {
    const store = startedStore();
    store.getState().startRest(30);
    store.getState().adjustRest(15);
    expect(store.getState().rest?.endsAt).toBe(Date.now() + 45_000);
    store.getState().adjustRest(-60);
    expect(store.getState().rest).toBeNull();
  });

  it("saves only completed sets and totals them", () => {
    const store = startedStore();
    const { id, sets } = firstExercise(store);
    store.getState().addSet(id);
    store.getState().toggleSetCompleted(id, sets[0]!.id);

    const workout = store.getState().workout!;
    expect(workoutTotals(workout)).toEqual({ sets: 1, volumeKg: 640 });
    const input = toWorkoutInput(workout, "2026-10-14T19:00:00.000Z");
    expect(input.exercises[0]!.sets).toHaveLength(1);
    expect(input.exercises[0]!.sets[0]).not.toHaveProperty("completed");
  });

  it("ignores edits when no workout is running", () => {
    const store = createActiveWorkoutStore();
    store.getState().rename("Nothing");
    expect(store.getState().workout).toBeNull();
  });
});

describe("newDraftExercise", () => {
  it("repeats last session's set types, warm-ups included", () => {
    const draft = newDraftExercise(
      bench,
      [
        { type: "warmup", weightKg: 40, reps: 10, durationSeconds: null },
        { type: "normal", weightKg: 80, reps: 8, durationSeconds: null },
      ],
      90,
    );
    expect(draft.sets.map((s) => s.type)).toEqual(["warmup", "normal"]);
  });

  it("starts a new exercise with one empty set", () => {
    expect(newDraftExercise(bench, [], 90).sets).toHaveLength(1);
  });
});

describe("supersets and rep ranges", () => {
  beforeEach(() => jest.useFakeTimers());
  afterEach(() => jest.useRealTimers());

  const row = { exerciseId: "row", name: "Barbell Row", trackingType: "weight_reps" as const };

  function supersetStore() {
    const store = createActiveWorkoutStore();
    store.getState().start({ title: "Pull" });
    store.getState().addExercises([newDraftExercise(bench, [], 90), newDraftExercise(row, [], 60)]);
    store.getState().linkSuperset(store.getState().workout!.exercises[0]!.id);
    return store;
  }

  it("rests only after the last exercise of a superset round", () => {
    const store = supersetStore();
    const [first, second] = store.getState().workout!.exercises;
    expect(first!.supersetId).toBe(0);
    expect(second!.supersetId).toBe(0);

    store.getState().toggleSetCompleted(first!.id, first!.sets[0]!.id);
    expect(store.getState().rest).toBeNull();

    store.getState().toggleSetCompleted(second!.id, second!.sets[0]!.id);
    expect(store.getState().rest).not.toBeNull();
  });

  it("dissolves a superset when one of its two exercises is removed", () => {
    const store = supersetStore();
    store.getState().removeExercise(store.getState().workout!.exercises[1]!.id);
    expect(store.getState().workout!.exercises[0]!.supersetId).toBeNull();
  });

  it("leaves a rep range as a hint and saves its bottom when nothing was typed", () => {
    const exercise = draftFromTemplate(
      bench,
      {
        exerciseId: "bench",
        restSeconds: null,
        notes: null,
        sets: [{ type: "normal", weightKg: 60, reps: 8, repsMax: 12 }],
      },
      [],
      90,
    );
    expect(exercise.sets[0]).toMatchObject({ reps: null, repsRange: { min: 8, max: 12 } });

    const store = createActiveWorkoutStore();
    store.getState().start({ title: "Push", exercises: [exercise] });
    store.getState().toggleSetCompleted(exercise.id, exercise.sets[0]!.id);
    const saved = toWorkoutInput(store.getState().workout!, "2026-10-14T19:00:00.000Z");
    expect(saved.exercises[0]!.sets[0]).toMatchObject({ weightKg: 60, reps: 8 });
    expect(saved.exercises[0]!.sets[0]).not.toHaveProperty("repsRange");
  });

  it("keeps last time's reps inside the routine's range", () => {
    const exercise = draftFromTemplate(
      bench,
      {
        exerciseId: "bench",
        restSeconds: null,
        notes: null,
        sets: [{ type: "normal", weightKg: 50, reps: 10, repsMax: 12 }],
      },
      [{ type: "normal", weightKg: 20, reps: 13, durationSeconds: null }],
      90,
    );
    const store = createActiveWorkoutStore();
    store.getState().start({ title: "Pull", exercises: [exercise] });
    store.getState().toggleSetCompleted(exercise.id, exercise.sets[0]!.id);
    expect(store.getState().workout!.exercises[0]!.sets[0]).toMatchObject({
      weightKg: 50,
      reps: 12,
    });
  });
});
