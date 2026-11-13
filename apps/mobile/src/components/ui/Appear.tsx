import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";

/** Rows past this index mount without the entering animation. */
const ANIMATED_ROWS = 10;

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
