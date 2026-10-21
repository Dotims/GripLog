import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { Colors, Radii, Spacing } from "@/constants/theme";

import { AppText } from "./AppText";

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  message: string;
  action?: ReactNode;
};

export function EmptyState({ icon: Icon, title, message, action }: EmptyStateProps) {
  return (
    <View style={styles.box}>
      <View style={styles.icon}>
        <Icon color={Colors.accent} size={26} strokeWidth={2} />
      </View>
      <AppText variant="title" align="center">
        {title}
      </AppText>
      <AppText color={Colors.muted} align="center" style={styles.message}>
        {message}
      </AppText>
      {action ? <View style={styles.action}>{action}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: Colors.surface,
    borderRadius: Radii.card,
    borderCurve: "continuous",
  },
  icon: {
    width: 60,
    height: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.accentSoft,
    borderRadius: Radii.pill,
    marginBottom: Spacing.sm,
  },
  message: {
    maxWidth: 280,
  },
  action: {
    marginTop: Spacing.md,
    alignSelf: "stretch",
  },
});
