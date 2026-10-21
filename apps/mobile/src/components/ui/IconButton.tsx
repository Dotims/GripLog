import type { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

import { Colors, Radii } from "@/constants/theme";

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
    <Pressable
      testID={testID}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={8}
      style={({ pressed }) => [
        styles.base,
        { width: size, height: size },
        tone === "accent" && { backgroundColor: Colors.accent },
        tone === "surface" && { backgroundColor: Colors.surfaceRaised },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Icon
        color={tone === "accent" ? Colors.accentInk : Colors.text}
        size={Math.round(size * 0.48)}
        strokeWidth={2}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.pill,
  },
});
