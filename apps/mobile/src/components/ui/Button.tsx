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

import { Colors, Fonts, Radii } from "@/constants/theme";

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
  primary: { background: Colors.accent, pressed: Colors.accentPressed, ink: Colors.accentInk },
  secondary: { background: Colors.surfaceRaised, pressed: Colors.surfaceAlt, ink: Colors.text },
  dark: { background: Colors.surfaceRaised, pressed: Colors.surfaceAlt, ink: Colors.accent },
  ghost: { background: "transparent", pressed: Colors.surfaceRaised, ink: Colors.muted },
  danger: { background: "transparent", pressed: Colors.surfaceRaised, ink: Colors.error },
} as const;

const SIZES = {
  sm: { height: 36, paddingHorizontal: 14, fontSize: 14, icon: 16, radius: Radii.sm },
  md: { height: 48, paddingHorizontal: 18, fontSize: 15, icon: 18, radius: Radii.md },
  lg: { height: 56, paddingHorizontal: 22, fontSize: 16, icon: 20, radius: Radii.md },
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
          borderRadius: metrics.radius,
          backgroundColor: pressed ? colors.pressed : colors.background,
        },
        inactive && styles.disabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={colors.ink} />
      ) : (
        <View style={styles.content}>
          {Icon ? <Icon color={colors.ink} size={metrics.icon} strokeWidth={2.2} /> : null}
          <AppText
            style={{ fontFamily: Fonts.semibold, fontSize: metrics.fontSize }}
            color={colors.ink}
          >
            {label}
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
    borderCurve: "continuous",
  },
  disabled: {
    opacity: 0.4,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
});
