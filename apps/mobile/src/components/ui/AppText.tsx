import { StyleSheet, Text, type TextProps } from "react-native";

import { Colors, Fonts } from "@/constants/theme";

const variants = StyleSheet.create({
  display: {
    fontFamily: Fonts.display,
    fontSize: 36,
    lineHeight: 38,
    letterSpacing: -1.5,
    textTransform: "uppercase",
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    lineHeight: 27,
    letterSpacing: -0.8,
    textTransform: "uppercase",
  },
  heading: {
    fontFamily: Fonts.heading,
    fontSize: 17,
    lineHeight: 21,
    letterSpacing: -0.3,
  },
  body: {
    fontFamily: Fonts.body,
    fontSize: 15,
    lineHeight: 21,
  },
  bold: {
    fontFamily: Fonts.bold,
    fontSize: 15,
    lineHeight: 21,
  },
  label: {
    fontFamily: Fonts.monoBold,
    fontSize: 11,
    letterSpacing: 0.8,
    textTransform: "uppercase",
  },
  mono: {
    fontFamily: Fonts.mono,
    fontSize: 13,
  },
  number: {
    fontFamily: Fonts.monoBold,
    fontSize: 22,
    letterSpacing: -0.5,
  },
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
