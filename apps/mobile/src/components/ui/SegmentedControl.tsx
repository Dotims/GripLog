import * as Haptics from "expo-haptics";
import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";

import { Colors, Fonts, Radii } from "@/constants/theme";

import { AppText } from "./AppText";

type SegmentedControlProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

const PADDING = 3;
const SLIDE = { damping: 22, stiffness: 260, mass: 0.7 };

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  const [width, setWidth] = useState(0);
  const segment = width > 0 ? (width - PADDING * 2) / options.length : 0;
  const index = Math.max(
    0,
    options.findIndex((option) => option.value === value),
  );

  // The highlight slides to the chosen segment instead of jumping.
  const thumbStyle = useAnimatedStyle(() => ({
    width: segment,
    transform: [{ translateX: withSpring(index * segment, SLIDE) }],
  }));

  return (
    <View
      style={styles.track}
      accessibilityRole="tablist"
      onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
    >
      {segment > 0 ? <Animated.View style={[styles.thumb, thumbStyle]} /> : null}
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => {
              if (selected) return;
              Haptics.selectionAsync().catch(() => {});
              onChange(option.value);
            }}
            style={styles.segment}
          >
            <AppText
              variant="label"
              color={selected ? Colors.text : Colors.muted}
              style={selected && styles.selectedText}
            >
              {option.label}
            </AppText>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: "row",
    padding: PADDING,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderCurve: "continuous",
  },
  thumb: {
    position: "absolute",
    top: PADDING,
    bottom: PADDING,
    left: PADDING,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: Radii.sm,
    borderCurve: "continuous",
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
  },
  selectedText: {
    fontFamily: Fonts.semibold,
  },
});
