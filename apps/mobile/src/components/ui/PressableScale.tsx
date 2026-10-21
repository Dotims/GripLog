import type { ReactNode } from "react";
import {
  Pressable,
  type GestureResponderEvent,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated, {
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Quick to sink under the finger, a little springy on release. */
const PRESS_IN = { duration: 90 };
const RELEASE = { damping: 14, stiffness: 320, mass: 0.6 };

type PressableScaleProps = Omit<PressableProps, "style" | "children"> & {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** How far the surface sinks while pressed. */
  scaleTo?: number;
  /** Background colour at rest and while pressed, blended as the press goes. */
  background?: { idle: string; pressed: string };
};

/** A pressable that gives way under the finger, used by cards, buttons and chips. */
export function PressableScale({
  children,
  style,
  scaleTo = 0.97,
  background,
  onPressIn,
  onPressOut,
  disabled,
  ...props
}: PressableScaleProps) {
  const pressed = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 - (1 - scaleTo) * pressed.value }],
    ...(background
      ? {
          backgroundColor: interpolateColor(
            pressed.value,
            [0, 1],
            [background.idle, background.pressed],
          ),
        }
      : null),
  }));

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      onPressIn={(event: GestureResponderEvent) => {
        pressed.set(withTiming(1, PRESS_IN));
        onPressIn?.(event);
      }}
      onPressOut={(event: GestureResponderEvent) => {
        pressed.set(withSpring(0, RELEASE));
        onPressOut?.(event);
      }}
      style={[style, animatedStyle]}
    >
      {children}
    </AnimatedPressable>
  );
}
