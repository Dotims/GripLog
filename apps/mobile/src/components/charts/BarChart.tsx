import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/components/ui";
import { Colors } from "@/constants/theme";

export type BarDatum = { key: string; label: string; value: number };

type BarChartProps = {
  data: readonly BarDatum[];
  height?: number;
  /** Bar drawn in the accent colour, usually the current week. */
  highlightKey?: string;
};

function Bar({
  ratio,
  index,
  highlighted,
}: {
  ratio: number;
  index: number;
  highlighted: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * 35, withTiming(ratio, { duration: 500 }));
  }, [index, progress, ratio]);

  const style = useAnimatedStyle(() => ({ height: `${Math.max(progress.value * 100, 2)}%` }));

  return (
    <Animated.View
      style={[
        styles.bar,
        style,
        { backgroundColor: highlighted ? Colors.accent : Colors.chartIdle },
      ]}
    />
  );
}

/** Animated column chart. Bars are plain views, so it renders the same on every platform. */
export function BarChart({ data, height = 120, highlightKey }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 0);

  return (
    <View style={styles.wrapper}>
      <View style={[styles.plot, { height }]}>
        {data.map((datum, index) => (
          <View key={datum.key} style={styles.column}>
            <Bar
              ratio={max > 0 ? datum.value / max : 0}
              index={index}
              highlighted={datum.key === highlightKey}
            />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {data.map((datum) => (
          <AppText
            key={datum.key}
            variant="label"
            color={datum.key === highlightKey ? Colors.text : Colors.faint}
            style={styles.label}
            numberOfLines={1}
          >
            {datum.label}
          </AppText>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  plot: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 6,
  },
  column: {
    flex: 1,
    height: "100%",
    justifyContent: "flex-end",
  },
  bar: {
    width: "100%",
    borderRadius: 6,
  },
  labels: {
    flexDirection: "row",
    gap: 6,
  },
  label: {
    flex: 1,
    fontSize: 10,
    textAlign: "center",
  },
});
