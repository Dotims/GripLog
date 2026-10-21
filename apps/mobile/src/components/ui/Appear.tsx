import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

/** Rows past the first screen mount while scrolling and should not make you wait. */
const ANIMATED_ROWS = 10;

/** A list row that rises into place, each one a beat after the one above. */
export function Appear({
  index,
  children,
  style,
}: {
  index: number;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Animated.View
      entering={index < ANIMATED_ROWS ? FadeInDown.delay(index * 40).duration(320) : undefined}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
