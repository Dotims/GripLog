import { Pressable, StyleSheet } from "react-native";

import { BorderWidth, Colors, Radii } from "@/constants/theme";

import { AppText } from "./AppText";

type ChipProps = {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  tone?: "accent" | "highlight" | "dark";
};

const SELECTED = {
  accent: { background: Colors.accent, ink: Colors.accentInk },
  highlight: { background: Colors.highlight, ink: Colors.text },
  dark: { background: Colors.text, ink: Colors.surface },
} as const;

export function Chip({ label, selected = false, onPress, tone = "accent" }: ChipProps) {
  const colors = selected ? SELECTED[tone] : { background: Colors.surface, ink: Colors.text };
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
      <AppText variant="label" color={colors.ink} numberOfLines={1}>
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    alignSelf: "flex-start",
    borderWidth: BorderWidth.hair,
    borderColor: Colors.border,
    borderRadius: Radii.chip,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
});
