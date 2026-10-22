import { useEffect, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedProps,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

import { Colors } from "@/constants/theme";

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

type GoalRingProps = {
  /** 0 to 1. */
  progress: number;
  size: number;
  stroke?: number;
  color?: string;
  children?: ReactNode;
};

/** A ring that fills to the progress when it appears, with whatever goes in the middle. */
export function GoalRing({
  progress,
  size,
  stroke = 10,
  color = Colors.accent,
  children,
}: GoalRingProps) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const fill = useSharedValue(0);

  useEffect(() => {
    fill.set(
      withDelay(
        150,
        withTiming(Math.min(1, Math.max(0, progress)), {
          duration: 900,
          easing: Easing.out(Easing.cubic),
        }),
      ),
    );
  }, [fill, progress]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - fill.get()),
  }));

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} style={styles.svg}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={Colors.surfaceAlt}
          strokeWidth={stroke}
          fill="none"
        />
        <AnimatedCircle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${circumference} ${circumference}`}
          animatedProps={animatedProps}
        />
      </Svg>
      <View style={styles.center}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  // Start the ring at twelve o'clock.
  svg: {
    transform: [{ rotate: "-90deg" }],
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
});
