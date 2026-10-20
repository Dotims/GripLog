import type { LucideIcon } from "lucide-react-native";
import { Pressable, StyleSheet } from "react-native";

import { BorderWidth, Colors, Radii } from "@/constants/theme";

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
  const plain = tone === "plain";
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
        !plain && styles.framed,
        tone === "accent" && { backgroundColor: Colors.accent },
        tone === "surface" && { backgroundColor: Colors.surface },
        pressed && { opacity: 0.6 },
      ]}
    >
      <Icon
        color={tone === "accent" ? Colors.accentInk : Colors.text}
        size={Math.round(size * 0.5)}
        strokeWidth={2.5}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.card,
  },
  framed: {
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
  },
});
