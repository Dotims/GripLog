import type { WeightUnit } from "@griplog/core";
import { eq } from "drizzle-orm";

import { nowIso } from "@/db/ids";
import { profile } from "@/db/schema";
import type { Db } from "@/db/types";
import { enqueueChange } from "@/features/sync/outbox";

export const PROFILE_ID = 1;

export function ensureProfile(db: Db): void {
  db.insert(profile).values({ id: PROFILE_ID, updatedAt: nowIso() }).onConflictDoNothing().run();
}

export function profileQuery(db: Db) {
  return db.select().from(profile).where(eq(profile.id, PROFILE_ID)).limit(1);
}

export type ProfilePatch = Partial<{
  firstName: string;
  lastName: string;
  bio: string | null;
  avatarUri: string | null;
  unit: WeightUnit;
  defaultRestSeconds: number;
}>;

/** Name and bio sync to the account; the avatar and preferences stay on the device. */
const SYNCED_FIELDS = ["firstName", "lastName", "bio"] as const;

export function updateProfile(db: Db, patch: ProfilePatch): void {
  db.transaction((tx) => {
    tx.update(profile)
      .set({ ...patch, updatedAt: nowIso() })
      .where(eq(profile.id, PROFILE_ID))
      .run();
    if (SYNCED_FIELDS.some((field) => field in patch)) {
      enqueueChange(tx, "profile", String(PROFILE_ID));
    }
  });
}
