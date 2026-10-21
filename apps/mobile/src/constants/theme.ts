/**
 * GripLog design tokens: a dark, quiet interface where colour carries meaning.
 * Red is the one accent (actions, the current week, progress), green means
 * done, gold means a personal record. Everything else is greys.
 */
export const Colors = {
  background: "#0A0A0B",
  surface: "#141416",
  surfaceRaised: "#1C1C1F",
  surfaceAlt: "#26262A",
  hairline: "rgba(255, 255, 255, 0.07)",
  text: "#F4F4F6",
  muted: "#9B9BA4",
  faint: "#5E5E66",
  accent: "#FF4757",
  accentPressed: "#E23E4D",
  accentSoft: "rgba(255, 71, 87, 0.14)",
  accentInk: "#FFFFFF",
  success: "#32D17A",
  successSoft: "rgba(50, 209, 122, 0.12)",
  gold: "#F5C451",
  goldSoft: "rgba(245, 196, 81, 0.14)",
  error: "#FF5A4F",
  overlay: "rgba(0, 0, 0, 0.6)",
  chartIdle: "#34343A",
} as const;

/** Inter, loaded in the root layout. */
export const Fonts = {
  regular: "Inter_400Regular",
  medium: "Inter_500Medium",
  semibold: "Inter_600SemiBold",
  bold: "Inter_700Bold",
  heavy: "Inter_800ExtraBold",
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
  sm: 10,
  md: 14,
  card: 20,
  pill: 999,
} as const;

/** Tabular figures keep weights and timers from jittering as digits change. */
export const tabular = { fontVariant: ["tabular-nums" as const] };
