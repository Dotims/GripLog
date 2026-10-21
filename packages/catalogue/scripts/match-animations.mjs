// Links catalogue exercises to ExerciseDB animations by name and equipment.
// Writes data/animations.json: { catalogueId: exerciseDbId }. Only ids are stored;
// the app loads the GIF from the ExerciseDB CDN, nothing is redistributed here.
// Usage: npm run animations -w @griplog/catalogue [-- path/to/exercisedb.json]
import { readFile, writeFile } from "node:fs/promises";

const API = "https://oss.exercisedb.dev/api/v1/exercises";
const CATALOGUE = new URL("../data/exercises.json", import.meta.url);
const OUTPUT = new URL("../data/animations.json", import.meta.url);
const OVERRIDES = new URL("../data/animation-overrides.json", import.meta.url);

/** Below this the names share too little to trust the match. */
const MIN_SCORE = 0.7;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/** The free API is rate limited, so pages are small and 429s wait as told. */
async function downloadExerciseDb() {
  const all = [];
  let cursor = null;
  for (;;) {
    const url = `${API}?limit=25${cursor ? `&after=${cursor}` : ""}`;
    const response = await fetch(url);
    if (response.status === 429) {
      await sleep((Number(response.headers.get("retry-after")) || 8) * 1000 + 500);
      continue;
    }
    if (!response.ok) throw new Error(`ExerciseDB responded ${response.status}`);
    const page = await response.json();
    all.push(...page.data);
    cursor = page.meta.nextCursor;
    if (!page.meta.hasNextPage || !cursor) return all;
    await sleep(1500);
  }
}

const EQUIPMENT = {
  barbell: "barbell",
  "olympic barbell": "barbell",
  dumbbell: "dumbbell",
  cable: "cable",
  machine: "machine",
  "leverage machine": "machine",
  "smith machine": "smith",
  kettlebells: "kettlebell",
  kettlebell: "kettlebell",
  bands: "band",
  "resistance band": "band",
  "medicine ball": "medicine",
  "exercise ball": "stability",
  "stability ball": "stability",
  "foam roll": "roller",
  roller: "roller",
  "e-z curl bar": "ez",
  "EZ bar": "ez",
  "body only": "bodyweight",
  bodyweight: "bodyweight",
};

const SYNONYMS = {
  dumbbells: "dumbbell",
  db: "dumbbell",
  bb: "barbell",
  kettlebells: "kettlebell",
  pulldown: "pulldown",
  ez: "ez",
  lying: "lying",
  flye: "fly",
  flyes: "fly",
  flys: "fly",
  raises: "raise",
  curls: "curl",
  extensions: "extension",
  rows: "row",
  lunges: "lunge",
  squats: "squat",
  shrugs: "shrug",
  presses: "press",
  dips: "dip",
  crunches: "crunch",
  incline: "incline",
  decline: "decline",
  overhead: "overhead",
  bodyweight: "bodyweight",
};

const STOP = new Set(["with", "the", "a", "on", "to", "of", "and", "your", "version", "v"]);
const EQUIPMENT_WORDS = new Set([
  "barbell",
  "dumbbell",
  "cable",
  "machine",
  "lever",
  "leverage",
  "smith",
  "kettlebell",
  "band",
  "ez",
  "bodyweight",
]);

/** One-word spellings that the other source writes as two words. */
const COMPOUNDS = {
  pushups: "push up",
  pushup: "push up",
  pullups: "pull up",
  pullup: "pull up",
  chinups: "chin up",
  situps: "sit up",
  skullcrusher: "skull crusher",
  skullcrushers: "skull crusher",
};

function tokens(name) {
  return (
    name
      .toLowerCase()
      .replace(/e-z/g, "ez")
      // "Medium grip" is the default grip, so it says nothing about the movement.
      .replace(/medium[ -]grip/g, " ")
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(" ")
      .flatMap((word) => (COMPOUNDS[word] ?? word).split(" "))
      .filter((word) => word && !STOP.has(word))
      .map((word) => SYNONYMS[word] ?? word)
  );
}

const NAME_GEAR = { lever: "machine", leverage: "machine", machine: "machine" };

function profile(name, equipment) {
  const words = tokens(name);
  // Gear named in the title is more specific than the equipment field ("Smith" vs "machine").
  const named = words
    .filter((word) => EQUIPMENT_WORDS.has(word))
    .map((word) => NAME_GEAR[word] ?? word);
  const gear = named.length ? named : equipment.map((item) => EQUIPMENT[item]).filter(Boolean);
  // The equipment shapes the movement, so it counts as part of the name.
  const set = new Set([...words.filter((word) => !EQUIPMENT_WORDS.has(word)), ...gear]);
  return { set, gear: new Set(gear) };
}

function score(a, b) {
  // Different known equipment is a different exercise, whatever the names say.
  if (a.gear.size && b.gear.size && ![...a.gear].some((item) => b.gear.has(item))) return 0;
  let shared = 0;
  for (const word of a.set) if (b.set.has(word)) shared += 1;
  return shared / (a.set.size + b.set.size - shared);
}

const MEDIA = "https://static.exercisedb.dev/media";

/** About one in ten listed exercises has no GIF on the CDN, so every id is checked. */
async function withGif(ids) {
  const found = new Set();
  const queue = [...ids];
  async function worker() {
    for (let id = queue.pop(); id; id = queue.pop()) {
      const response = await fetch(`${MEDIA}/${id}.gif`, { method: "HEAD" });
      if (response.ok) found.add(id);
    }
  }
  await Promise.all(Array.from({ length: 16 }, worker));
  return found;
}

const exerciseDbPath = process.argv[2];
const exerciseDb = exerciseDbPath
  ? JSON.parse(await readFile(exerciseDbPath, "utf8"))
  : await downloadExerciseDb();
const catalogue = JSON.parse(await readFile(CATALOGUE, "utf8"));
const overrides = JSON.parse(await readFile(OVERRIDES, "utf8"));

const playable = await withGif(exerciseDb.map((exercise) => exercise.exerciseId));
const candidates = exerciseDb
  .filter((exercise) => playable.has(exercise.exerciseId))
  .map((exercise) => ({
    id: exercise.exerciseId,
    name: exercise.name,
    profile: profile(exercise.name, exercise.equipments),
  }));

const animations = {};
const report = [];
for (const exercise of catalogue) {
  const own = profile(exercise.name, exercise.equipment ? [exercise.equipment] : []);
  let best = null;
  for (const candidate of candidates) {
    const value = score(own, candidate.profile);
    if (!best || value > best.value) best = { id: candidate.id, name: candidate.name, value };
  }
  report.push([best?.value.toFixed(2), exercise.name, exercise.equipment, best?.name].join("\t"));
  if (best && best.value >= MIN_SCORE) animations[exercise.id] = best.id;
}

// Hand-checked pairs win over the heuristic; null removes a wrong match.
for (const [id, exerciseDbId] of Object.entries(overrides)) {
  if (exerciseDbId !== null && !playable.has(exerciseDbId)) {
    throw new Error(`Override ${id} -> ${exerciseDbId} has no GIF`);
  }
  if (exerciseDbId === null) delete animations[id];
  else animations[id] = exerciseDbId;
}

// REPORT=path writes every best guess with its score, for checking the threshold.
if (process.env.REPORT) await writeFile(process.env.REPORT, report.sort().reverse().join("\n"));

const sorted = Object.fromEntries(
  Object.entries(animations).sort(([a], [b]) => a.localeCompare(b)),
);
await writeFile(OUTPUT, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`Linked ${Object.keys(sorted).length} of ${catalogue.length} exercises`);
