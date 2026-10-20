import type { LucideIcon } from "lucide-react-native";
import type { ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { BorderWidth, Colors, Radii, Spacing } from "@/constants/theme";

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
        <Icon color={Colors.text} size={26} strokeWidth={2.5} />
      </View>
      <AppText variant="title" align="center">
        {title}
      </AppText>
      <AppText color={Colors.muted} align="center">
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
    padding: Spacing.xl,
    borderWidth: BorderWidth.thick,
    borderStyle: "dashed",
    borderColor: Colors.border,
    borderRadius: Radii.card,
  },
  icon: {
    width: 56,
    height: 56,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.highlight,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    marginBottom: Spacing.xs,
    transform: [{ rotate: "-4deg" }],
  },
  action: {
    marginTop: Spacing.sm,
    alignSelf: "stretch",
  },
});
