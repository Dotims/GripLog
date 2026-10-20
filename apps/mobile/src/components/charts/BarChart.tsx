import { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/components/ui";
import { BorderWidth, Colors } from "@/constants/theme";

export type BarDatum = { key: string; label: string; value: number };

type BarChartProps = {
  data: readonly BarDatum[];
  height?: number;
  inverted?: boolean;
  /** Bar drawn in the accent colour, usually the current week. */
  highlightKey?: string;
};

function Bar({
  ratio,
  index,
  highlighted,
  inverted,
}: {
  ratio: number;
  index: number;
  highlighted: boolean;
  inverted: boolean;
}) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withDelay(index * 40, withTiming(ratio, { duration: 450 }));
  }, [index, progress, ratio]);

  const style = useAnimatedStyle(() => ({ height: `${progress.value * 100}%` }));
  const empty = ratio === 0;

  return (
    <Animated.View
      style={[
        styles.bar,
        style,
        {
          backgroundColor: highlighted ? Colors.accent : inverted ? Colors.surface : Colors.text,
          borderColor: inverted ? Colors.surface : Colors.border,
        },
        empty && styles.emptyBar,
      ]}
    />
  );
}

/** Animated column chart. Bars are plain views, so it renders the same on every platform. */
export function BarChart({ data, height = 120, inverted = false, highlightKey }: BarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 0);
  const ink = inverted ? Colors.faint : Colors.muted;

  return (
    <View style={styles.wrapper}>
      <View style={[styles.plot, { height }]}>
        {data.map((datum, index) => (
          <View key={datum.key} style={styles.column}>
            <Bar
              ratio={max > 0 ? datum.value / max : 0}
              index={index}
              highlighted={datum.key === highlightKey}
              inverted={inverted}
            />
          </View>
        ))}
      </View>
      <View style={styles.labels}>
        {data.map((datum) => (
          <AppText
            key={datum.key}
            variant="label"
            color={ink}
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
    gap: 6,
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
    minHeight: 3,
    borderWidth: BorderWidth.hair,
    borderRadius: 3,
  },
  emptyBar: {
    opacity: 0.25,
  },
  labels: {
    flexDirection: "row",
    gap: 6,
  },
  label: {
    flex: 1,
    fontSize: 9,
    letterSpacing: 0,
    textAlign: "center",
  },
});
