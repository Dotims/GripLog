import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";

import { AppText } from "./AppText";

type StatProps = {
  label: string;
  value: string;
  unit?: string;
  inverted?: boolean;
};

export function Stat({ label, value, unit, inverted = false }: StatProps) {
  const ink = inverted ? Colors.surface : Colors.text;
  return (
    <View style={styles.stat}>
      <AppText variant="label" color={inverted ? Colors.faint : Colors.muted} numberOfLines={1}>
        {label}
      </AppText>
      <View style={styles.valueRow}>
        <AppText variant="number" color={ink} numberOfLines={1} adjustsFontSizeToFit>
          {value}
        </AppText>
        {unit ? (
          <AppText variant="mono" color={inverted ? Colors.faint : Colors.muted}>
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
    gap: 2,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: 4,
  },
});
