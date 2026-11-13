import { asc, desc, eq, isNull, max } from "drizzle-orm";
import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

import { newId, nowIso } from "@/db/ids";
import { workoutPhotos, workouts } from "@/db/schema";
import type { Db } from "@/db/types";

export type PhotoSource = "camera" | "library";

/** Copies the photo into documents; the picker's file sits in a cache the OS may clear. */
export async function pickWorkoutPhoto(source: PhotoSource): Promise<string | null> {
  const options: ImagePicker.ImagePickerOptions = {
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [4, 5],
    quality: 0.75,
  };
  if (source === "camera") {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) return null;
  }
  const result =
    source === "camera"
      ? await ImagePicker.launchCameraAsync(options)
      : await ImagePicker.launchImageLibraryAsync(options);
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  if (Platform.OS === "web") return asset.uri;

  const folder = new Directory(Paths.document, "workout-photos");
  if (!folder.exists) folder.create();
  const target = new File(folder, `${newId()}.jpg`);
  await new File(asset.uri).copy(target);
  return target.uri;
}

export function addWorkoutPhoto(db: Db, workoutId: string, uri: string): void {
  const last = db
    .select({ value: max(workoutPhotos.position) })
    .from(workoutPhotos)
    .where(eq(workoutPhotos.workoutId, workoutId))
    .get()?.value;
  db.insert(workoutPhotos)
    .values({
      id: newId(),
      workoutId,
      uri,
      position: last === null || last === undefined ? 0 : last + 1,
      createdAt: nowIso(),
    })
    .run();
}

export function removeWorkoutPhoto(db: Db, photoId: string): void {
  const row = db.select().from(workoutPhotos).where(eq(workoutPhotos.id, photoId)).get();
  if (!row) return;
  db.delete(workoutPhotos).where(eq(workoutPhotos.id, photoId)).run();
  discardPhotoFiles([row.uri]);
}

export function discardPhotoFiles(uris: readonly string[]): void {
  if (Platform.OS === "web") return;
  for (const uri of uris) {
    try {
      const file = new File(uri);
      if (file.exists) file.delete();
    } catch {
      // Nothing to clean up.
    }
  }
}

export function workoutPhotosQuery(db: Db, workoutId: string) {
  return db
    .select()
    .from(workoutPhotos)
    .where(eq(workoutPhotos.workoutId, workoutId))
    .orderBy(asc(workoutPhotos.position));
}

export function recentPhotosQuery(db: Db, limit: number) {
  return db
    .select({
      id: workoutPhotos.id,
      uri: workoutPhotos.uri,
      workoutId: workoutPhotos.workoutId,
    })
    .from(workoutPhotos)
    .innerJoin(workouts, eq(workouts.id, workoutPhotos.workoutId))
    .where(isNull(workouts.deletedAt))
    .orderBy(desc(workouts.startedAt), asc(workoutPhotos.position))
    .limit(limit);
}
