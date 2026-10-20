import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { BorderWidth, Colors, PRESS_OFFSET, Radii, Shadow } from "@/constants/theme";

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tone?: "surface" | "accent" | "highlight" | "dark";
  shadow?: "hard" | "hardLg";
  accessibilityLabel?: string;
  testID?: string;
};

const TONES = {
  surface: Colors.surface,
  accent: Colors.accent,
  highlight: Colors.highlight,
  dark: Colors.text,
} as const;

/**
 * The basic neo-brutalist block: thick border and a hard shadow. Pressable
 * cards sink into their shadow while held, like a physical button.
 */
export function Card({
  children,
  onPress,
  onLongPress,
  style,
  tone = "surface",
  shadow = "hard",
  accessibilityLabel,
  testID,
}: CardProps) {
  const base = [styles.card, { backgroundColor: TONES[tone], boxShadow: Shadow[shadow] }, style];

  if (!onPress && !onLongPress) {
    return (
      <View style={base} testID={testID}>
        {children}
      </View>
    );
  }

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      style={({ pressed }) => [base, pressed && styles.pressed]}
    >
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    borderRadius: Radii.card,
  },
  pressed: {
    boxShadow: Shadow.none,
    transform: [{ translateX: PRESS_OFFSET }, { translateY: PRESS_OFFSET }],
  },
});
