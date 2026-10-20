import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Colors, Spacing } from "@/constants/theme";

import { AppText } from "./AppText";

type ScreenHeaderProps = {
  title: string;
  eyebrow?: string;
  right?: ReactNode;
};

/** Big uppercase title with a small mono line above it, used at the top of every tab. */
export function ScreenHeader({ title, eyebrow, right }: ScreenHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        {eyebrow ? (
          <AppText variant="label" color={Colors.muted}>
            {eyebrow}
          </AppText>
        ) : null}
        <AppText variant="display" numberOfLines={1} adjustsFontSizeToFit>
          {title}
        </AppText>
      </View>
      {right ? <View style={styles.right}>{right}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    gap: Spacing.md,
  },
  text: {
    flex: 1,
    gap: 2,
  },
  right: {
    flexDirection: "row",
    gap: Spacing.sm,
    paddingBottom: 2,
  },
});
