import { Platform } from "react-native";

export const Colors = {
  accent: "#FF3B47", 
  accentSoft: "#FFDADD", 
  accentInk: "#FFFFFF", 
  background: "#DDE0E3", // cool concrete ground — white cards pop against it
  surface: "#FFFFFF", 
  border: "#000000", 
  text: "#17181A", 
  muted: "#5A5C61", // secondary ink, cool grey — darker for small mono legibility
  error: "#C81E1E", 
} as const;

// Monospace only, reserved for labels, meta and numbers.
export const Fonts = {
  mono: Platform.select({
    ios: "Menlo",
    android: "monospace",
    default: "monospace",
  }),
} as const;

export const Radii = {
  card: 10,
  chip: 6,
} as const;

export const BorderWidth = {
  hair: 1.5,
  thick: 2.5,
} as const;

export const Shadow = {
  hard: "3px 3px 0 #000000",
  hardLg: "5px 5px 0 #000000",
} as const;
