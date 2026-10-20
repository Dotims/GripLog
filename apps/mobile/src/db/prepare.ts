import { migrate } from "drizzle-orm/expo-sqlite/migrator";

import { catalogue, CATALOGUE_VERSION } from "@/features/exercises/catalogue";
import { seedCatalogue } from "@/features/exercises/repository";
import { ensureProfile } from "@/features/profile/repository";

import migrations from "../../drizzle/migrations";
import { openAppDatabase } from "./client";
import type { Db } from "./types";

let preparing: Promise<Db> | null = null;

/** Opens, migrates and seeds the database. Runs once per launch; later calls share the promise. */
export function prepareDatabase(): Promise<Db> {
  preparing ??= (async () => {
    const db = await openAppDatabase();
    await migrate(db, migrations);
    ensureProfile(db);
    seedCatalogue(db, catalogue, CATALOGUE_VERSION);
    return db;
  })();
  return preparing;
}
