import { useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";
import Svg, { Circle, Defs, Line, LinearGradient, Path, Stop } from "react-native-svg";

import { AppText } from "@/components/ui";
import { Colors } from "@/constants/theme";

export type LinePoint = { key: string; value: number; label: string };

type LineChartProps = {
  points: readonly LinePoint[];
  height?: number;
  formatValue: (value: number) => string;
};

const PADDING = 12;

export function LineChart({ points, height = 170, formatValue }: LineChartProps) {
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
  const line = points
    .map((point, index) => `${index === 0 ? "M" : "L"}${x(index)},${y(point.value)}`)
    .join(" ");
  const area = `${line} L${x(points.length - 1)},${height} L${x(0)},${height} Z`;
  const last = points.at(-1);

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <AppText variant="label" color={Colors.muted}>
          Low {formatValue(min)}
        </AppText>
        <AppText variant="label" color={Colors.muted}>
          High {formatValue(max)}
        </AppText>
      </View>
      <View style={{ height }} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && last ? (
          <Animated.View entering={FadeIn.duration(500)}>
            <Svg width={width} height={height}>
              <Defs>
                <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                  <Stop offset="0" stopColor={Colors.accent} stopOpacity={0.28} />
                  <Stop offset="1" stopColor={Colors.accent} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              {[0.25, 0.5, 0.75].map((fraction) => (
                <Line
                  key={fraction}
                  x1={0}
                  x2={width}
                  y1={height * fraction}
                  y2={height * fraction}
                  stroke={Colors.hairline}
                  strokeWidth={1}
                />
              ))}
              <Path d={area} fill="url(#area)" />
              <Path
                d={line}
                fill="none"
                stroke={Colors.accent}
                strokeWidth={2.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
              <Circle cx={x(points.length - 1)} cy={y(last.value)} r={9} fill={Colors.accentSoft} />
              <Circle cx={x(points.length - 1)} cy={y(last.value)} r={4.5} fill={Colors.accent} />
            </Svg>
          </Animated.View>
        ) : null}
      </View>
      <View style={styles.header}>
        <AppText variant="label" color={Colors.faint}>
          {points[0]?.label}
        </AppText>
        <AppText variant="label" color={Colors.faint}>
          {last?.label}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});
