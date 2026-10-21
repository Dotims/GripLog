import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";

import { AppText } from "./AppText";

type StatProps = {
  label: string;
  value: string;
  unit?: string;
  /** Kept for compatibility: every surface is dark now. */
  inverted?: boolean;
};

export function Stat({ label, value, unit }: StatProps) {
  return (
    <View style={styles.stat}>
      <AppText variant="label" color={Colors.muted} numberOfLines={1}>
        {label}
      </AppText>
      <View style={styles.valueRow}>
        <AppText variant="number" numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="label" color={Colors.muted}>
            {unit}
          </AppText>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stat: {
    flex: 1,
    gap: 4,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
});
