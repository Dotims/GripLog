import { StyleSheet, Text, type TextProps } from "react-native";

import { Colors, Fonts, tabular } from "@/constants/theme";

const variants = StyleSheet.create({
  display: { fontFamily: Fonts.bold, fontSize: 32, lineHeight: 38, letterSpacing: -0.8 },
  title: { fontFamily: Fonts.bold, fontSize: 22, lineHeight: 28, letterSpacing: -0.4 },
  heading: { fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 22 },
  bold: { fontFamily: Fonts.semibold, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: Fonts.medium, fontSize: 13, lineHeight: 17, letterSpacing: 0.1 },
  caption: {
    fontFamily: Fonts.semibold,
    fontSize: 11,
    lineHeight: 14,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  mono: { fontFamily: Fonts.medium, fontSize: 14, lineHeight: 19, ...tabular },
  number: { fontFamily: Fonts.bold, fontSize: 24, lineHeight: 29, letterSpacing: -0.5, ...tabular },
});

export type TextVariant = keyof typeof variants;

type AppTextProps = TextProps & {
  variant?: TextVariant;
  color?: string;
  align?: "left" | "center" | "right";
};

export function AppText({
  variant = "body",
  color = Colors.text,
  align,
  style,
  ...props
}: AppTextProps) {
  return <Text {...props} style={[variants[variant], { color, textAlign: align }, style]} />;
}
