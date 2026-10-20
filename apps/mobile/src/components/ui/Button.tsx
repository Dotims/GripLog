import * as Haptics from "expo-haptics";
import type { LucideIcon } from "lucide-react-native";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { BorderWidth, Colors, Fonts, PRESS_OFFSET, Radii, Shadow } from "@/constants/theme";

import { AppText } from "./AppText";

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "dark" | "ghost" | "danger";
  size?: "md" | "lg" | "sm";
  icon?: LucideIcon;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  testID?: string;
};

const VARIANTS = {
  primary: { background: Colors.accent, ink: Colors.accentInk },
  secondary: { background: Colors.surface, ink: Colors.text },
  dark: { background: Colors.text, ink: Colors.surface },
  ghost: { background: "transparent", ink: Colors.text },
  danger: { background: Colors.surface, ink: Colors.error },
} as const;

const SIZES = {
  sm: { height: 36, paddingHorizontal: 12, fontSize: 12, icon: 16 },
  md: { height: 48, paddingHorizontal: 16, fontSize: 14, icon: 18 },
  lg: { height: 58, paddingHorizontal: 20, fontSize: 16, icon: 22 },
} as const;

export function Button({
  label,
  onPress,
  variant = "primary",
  size = "md",
  icon: Icon,
  loading = false,
  disabled = false,
  style,
  testID,
}: ButtonProps) {
  const colors = VARIANTS[variant];
  const metrics = SIZES[size];
  const flat = variant === "ghost";
  const inactive = disabled || loading;

  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        onPress();
      }}
      style={({ pressed }) => [
        styles.base,
        {
          height: metrics.height,
          paddingHorizontal: metrics.paddingHorizontal,
          backgroundColor: colors.background,
        },
        flat ? styles.flat : styles.raised,
        pressed && !flat && styles.pressed,
        pressed && flat && styles.flatPressed,
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon color={colors.ink} size={metrics.icon} strokeWidth={2.5} /> : null}
          <AppText
            style={{ fontFamily: Fonts.heading, fontSize: metrics.fontSize, letterSpacing: 0.4 }}
            color={colors.ink}
          >
            {label.toUpperCase()}
          </AppText>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: Radii.card,
  },
  raised: {
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    boxShadow: Shadow.hard,
  },
  flat: {
    borderWidth: 0,
  },
  pressed: {
    boxShadow: Shadow.none,
    transform: [{ translateX: PRESS_OFFSET }, { translateY: PRESS_OFFSET }],
  },
  flatPressed: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.45,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
