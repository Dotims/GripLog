import type { ReactNode } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";

import { Colors, Radii } from "@/constants/theme";

import { PressableScale } from "./PressableScale";

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
    <PressableScale
      onPress={onPress}
      onLongPress={onLongPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      testID={testID}
      scaleTo={0.98}
      style={base}
    >
      {children}
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radii.card,
    borderCurve: "continuous",
  },
});
