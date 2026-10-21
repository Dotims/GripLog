import type { ReactNode } from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Colors, Radii } from "@/constants/theme";

type CardProps = {
  children: ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: StyleProp<ViewStyle>;
  tone?: "surface" | "raised" | "accent" | "gold";
  accessibilityLabel?: string;
  testID?: string;
};

const TONES = {
  surface: Colors.surface,
  raised: Colors.surfaceRaised,
  accent: Colors.accent,
  gold: Colors.goldSoft,
} as const;

/** A rounded surface. Depth comes from the surface colour, not borders or shadows. */
export function Card({
  children,
  onPress,
  onLongPress,
  style,
  tone = "surface",
  accessibilityLabel,
  testID,
}: CardProps) {
  const base = [styles.card, { backgroundColor: TONES[tone] }, style];

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
    borderRadius: Radii.card,
    borderCurve: "continuous",
  },
  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
});
