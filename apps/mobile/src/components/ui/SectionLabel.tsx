import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "./AppText";

export function SectionLabel({ children, right }: { children: string; right?: ReactNode }) {
  return (
    <View style={styles.row}>
      <AppText variant="heading" style={styles.label}>
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
    marginTop: 8,
  },
  label: {
    flex: 1,
  },
});
