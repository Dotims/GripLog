import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Colors } from "@/constants/theme";

import { AppText } from "./AppText";

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <View style={styles.bar} />
      <AppText variant="label" style={styles.label}>
        {children}
      </AppText>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
  },
  bar: {
    width: 10,
    height: 10,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  label: {
    flex: 1,
    fontSize: 12,
  },
});
