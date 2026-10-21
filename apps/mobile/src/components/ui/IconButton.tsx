import type { LucideIcon } from "lucide-react-native";
import { StyleSheet } from "react-native";

import { Colors, Radii } from "@/constants/theme";

import { PressableScale } from "./PressableScale";

const BACKGROUNDS = {
  surface: { idle: Colors.surfaceRaised, pressed: Colors.surfaceAlt },
  accent: { idle: Colors.accent, pressed: Colors.accentPressed },
  plain: { idle: "rgba(28, 28, 31, 0)", pressed: Colors.surfaceRaised },
} as const;

type IconButtonProps = {
  icon: LucideIcon;
  onPress: () => void;
  label: string;
  tone?: "surface" | "accent" | "plain";
  size?: number;
  testID?: string;
};

export function IconButton({
  icon: Icon,
  onPress,
  label,
  tone = "surface",
  size = 40,
  testID,
}: IconButtonProps) {
  return (
    <PressableScale
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      scaleTo={0.88}
      background={BACKGROUNDS[tone]}
      style={[styles.base, { width: size, height: size }]}
    >
      <Icon
        color={tone === "accent" ? Colors.accentInk : Colors.text}
        size={Math.round(size * 0.48)}
        strokeWidth={2}
      />
    </PressableScale>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.pill,
  },
});
