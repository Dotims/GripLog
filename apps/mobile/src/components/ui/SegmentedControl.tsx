import * as Haptics from "expo-haptics";
import { Pressable, StyleSheet, View } from "react-native";

import { Colors, Radii } from "@/constants/theme";

import { AppText } from "./AppText";

type SegmentedControlProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: SegmentedControlProps<T>) {
  return (
    <View style={styles.track} accessibilityRole="tablist">
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
            style={[styles.segment, selected && styles.selected]}
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
    padding: 3,
    gap: 3,
    backgroundColor: Colors.surface,
    borderRadius: Radii.md,
    borderCurve: "continuous",
  },
  segment: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: Radii.sm,
    borderCurve: "continuous",
  },
  selected: {
    backgroundColor: Colors.surfaceAlt,
  },
  selectedText: {
    fontFamily: "Inter_600SemiBold",
  },
});
