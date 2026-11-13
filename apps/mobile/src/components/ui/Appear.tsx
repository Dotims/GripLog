import type { ReactNode } from "react";
import type { StyleProp, ViewStyle } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

/** Rows past this index mount without the entering animation. */
const ANIMATED_ROWS = 8;

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
      entering={index < ANIMATED_ROWS ? FadeIn.delay(index * 30).duration(200) : undefined}
      style={style}
    >
      {children}
    </Animated.View>
  );
}
