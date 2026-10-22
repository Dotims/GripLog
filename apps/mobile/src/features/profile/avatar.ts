import { Directory, File, Paths } from "expo-file-system";
import * as ImagePicker from "expo-image-picker";
import { Platform } from "react-native";

/**
 * Lets the user pick a square photo and copies it into the app's documents,
 * because the picker's own file lives in a cache the OS may clear.
 */
export async function pickAvatar(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.7,
  });
  const asset = result.canceled ? null : result.assets[0];
  if (!asset) return null;
  if (Platform.OS === "web") return asset.uri;

  const folder = new Directory(Paths.document, "avatars");
  if (!folder.exists) folder.create();
  const target = new File(folder, `avatar-${Date.now()}.jpg`);
  await new File(asset.uri).copy(target);
  return target.uri;
}

export function initials(firstName: string, lastName: string): string {
  const letters = `${firstName.trim().charAt(0)}${lastName.trim().charAt(0)}`.toUpperCase();
  return letters || "GL";
}

/** Initials from a full display name, "Kuba Nowak" to "KN". */
export function nameInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return initials(parts[0] ?? "", parts.length > 1 ? (parts.at(-1) ?? "") : "");
}
