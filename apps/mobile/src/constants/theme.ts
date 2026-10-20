export const Colors = {
  accent: "#FF3B47",
  accentSoft: "#FFDADD",
  accentInk: "#FFFFFF",
  background: "#DDE0E3", // cool concrete ground, white cards pop against it
  surface: "#FFFFFF",
  surfaceAlt: "#F1F2F4",
  border: "#000000",
  text: "#17181A",
  muted: "#5A5C61", // secondary ink, cool grey, dark enough for small mono text
  faint: "#9A9DA3",
  error: "#C81E1E",
  success: "#14883E",
  successSoft: "#CDEFD6",
  highlight: "#FFD23F", // personal records
  overlay: "rgba(23, 24, 26, 0.45)",
} as const;

/** Loaded in the root layout. Mono is reserved for labels, meta and numbers. */
export const Fonts = {
  display: "Archivo_900Black",
  heading: "Archivo_800ExtraBold",
  bold: "Archivo_700Bold",
  body: "Archivo_500Medium",
  mono: "JetBrainsMono_500Medium",
  monoBold: "JetBrainsMono_700Bold",
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const Radii = {
  card: 10,
  chip: 6,
  pill: 999,
} as const;

export const BorderWidth = {
  hair: 1.5,
  thick: 2.5,
} as const;

export const Shadow = {
  hard: "3px 3px 0 #000000",
  hardLg: "5px 5px 0 #000000",
  none: "0px 0px 0 #000000",
} as const;

/** How far a pressed card sinks into its shadow. */
export const PRESS_OFFSET = 3;
