// Downloads free-exercise-db (public domain) and writes the trimmed catalogue bundled with the app.
// Usage: npm run build -w @griplog/catalogue
import { writeFile } from "node:fs/promises";

const SOURCE =
  "https://raw.githubusercontent.com/yuhonas/free-exercise-db/main/dist/exercises.json";
const OUTPUT = new URL("../data/exercises.json", import.meta.url);

const DURATION_HINTS = /plank|hold|hang|stretch|wall sit/i;

function trackingType(exercise) {
  if (exercise.category === "cardio") return "distance_duration";
  if (exercise.category === "stretching" || DURATION_HINTS.test(exercise.name)) return "duration";
  if (exercise.equipment === "body only" || exercise.equipment === null) return "reps";
  return "weight_reps";
}

const response = await fetch(SOURCE);
if (!response.ok) throw new Error(`Download failed: ${response.status}`);
const source = await response.json();

const catalogue = source
  .map((exercise) => ({
    id: exercise.id,
    name: exercise.name.trim(),
    trackingType: trackingType(exercise),
    category: exercise.category,
    equipment: exercise.equipment ?? null,
    level: exercise.level,
    primaryMuscles: exercise.primaryMuscles,
    secondaryMuscles: exercise.secondaryMuscles,
    instructions: exercise.instructions,
    images: exercise.images,
  }))
  .sort((a, b) => a.name.localeCompare(b.name));

await writeFile(OUTPUT, JSON.stringify(catalogue));
console.log(`Wrote ${catalogue.length} exercises`);
