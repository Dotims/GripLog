import { Pressable, StyleSheet } from "react-native";

import { Colors, Radii } from "@/constants/theme";

import { AppText } from "./AppText";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: "accent" | "gold" | "light";
};

const SELECTED = {
  accent: { background: Colors.accentSoft, ink: Colors.accent },
  gold: { background: Colors.goldSoft, ink: Colors.gold },
  light: { background: Colors.text, ink: Colors.background },
} as const;

export function Chip({ label, selected = false, onPress, tone = "light" }: ChipProps) {
  const colors = selected
    ? SELECTED[tone]
    : { background: Colors.surfaceRaised, ink: Colors.muted };
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? "button" : "text"}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.chip,
        { backgroundColor: colors.background },
        pressed && { opacity: 0.7 },
      ]}
    >
      <AppText variant="label" color={colors.ink} numberOfLines={1} style={styles.text}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderRadius: Radii.pill,
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  text: {
    textTransform: "capitalize",
  },
});
