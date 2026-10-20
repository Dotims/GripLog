import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Svg, { Circle, Line, Polyline } from "react-native-svg";

import { AppText } from "@/components/ui";
import { Colors } from "@/constants/theme";

export type LinePoint = { key: string; value: number; label: string };

type LineChartProps = {
  points: readonly LinePoint[];
  height?: number;
  formatValue: (value: number) => string;
};

const PADDING = 10;

export function LineChart({ points, height = 160, formatValue }: LineChartProps) {
  const [width, setWidth] = useState(0);
  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || 1;

  const x = (index: number) =>
    points.length === 1
      ? width / 2
      : PADDING + (index / (points.length - 1)) * (width - PADDING * 2);
  const y = (value: number) => PADDING + (1 - (value - min) / span) * (height - PADDING * 2);
  const coordinates = points.map((point, index) => `${x(index)},${y(point.value)}`).join(" ");

  return (
    <View style={styles.wrapper}>
      <View style={{ height }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 ? (
          <Animated.View entering={FadeIn.duration(400)}>
            <Svg width={width} height={height}>
              {[0, 0.5, 1].map((fraction) => (
                <Line
                  key={fraction}
                  x1={0}
                  x2={width}
                  y1={PADDING + fraction * (height - PADDING * 2)}
                  y2={PADDING + fraction * (height - PADDING * 2)}
                  stroke={Colors.faint}
                  strokeWidth={1}
                  strokeDasharray="4 4"
                />
              ))}
              <Polyline
                points={coordinates}
                fill="none"
                stroke={Colors.accent}
                strokeWidth={3}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              {points.map((point, index) => (
                <Circle
                  key={point.key}
                  cx={x(index)}
                  cy={y(point.value)}
                  r={index === points.length - 1 ? 6 : 3.5}
                  fill={index === points.length - 1 ? Colors.accent : Colors.surface}
                  stroke={Colors.border}
                  strokeWidth={2}
                />
              ))}
            </Svg>
          </Animated.View>
        ) : null}
        <AppText variant="label" color={Colors.muted} style={[styles.axisLabel, { top: -4 }]}>
          {formatValue(max)}
        </AppText>
        <AppText variant="label" color={Colors.muted} style={[styles.axisLabel, { bottom: -4 }]}>
          {formatValue(min)}
        </AppText>
      </View>
      <View style={styles.footer}>
        <AppText variant="label" color={Colors.muted}>
          {points[0]?.label}
        </AppText>
        <AppText variant="label" color={Colors.muted}>
          {points.at(-1)?.label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 4,
  },
  axisLabel: {
    position: "absolute",
    left: 0,
    backgroundColor: Colors.surface,
    paddingRight: 4,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
