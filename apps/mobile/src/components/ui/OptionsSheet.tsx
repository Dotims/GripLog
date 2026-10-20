import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BorderWidth, Colors, Radii, Shadow, Spacing } from "@/constants/theme";

import { AppText } from "./AppText";

export type SheetOption = {
  label: string;
  onPress: () => void;
  destructive?: boolean;
  selected?: boolean;
};

type OptionsSheetProps = {
  visible: boolean;
  title?: string;
  options: SheetOption[];
  onClose: () => void;
};

/** A bottom sheet of actions that looks the same on iOS, Android and the web. */
export function OptionsSheet({ visible, title, options, onClose }: OptionsSheetProps) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close" />
      <View style={[styles.sheet, { paddingBottom: insets.bottom + Spacing.md }]}>
        {title ? (
          <AppText variant="label" color={Colors.muted} style={styles.title}>
            {title}
          </AppText>
        ) : null}
        {options.map((option) => (
          <Pressable
            key={option.label}
            accessibilityRole="button"
            onPress={() => {
              onClose();
              option.onPress();
            }}
            style={({ pressed }) => [
              styles.option,
              option.selected && styles.selected,
              pressed && { backgroundColor: Colors.surfaceAlt },
            ]}
          >
            <AppText variant="heading" color={option.destructive ? Colors.error : Colors.text}>
              {option.label}
            </AppText>
          </Pressable>
        ))}
        <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
          <AppText variant="label">Cancel</AppText>
        </Pressable>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: Colors.overlay,
  },
  sheet: {
    position: "absolute",
    left: Spacing.sm,
    right: Spacing.sm,
    bottom: Spacing.sm,
    padding: Spacing.md,
    gap: 6,
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    borderRadius: Radii.card + 4,
    boxShadow: Shadow.hardLg,
  },
  title: {
    paddingHorizontal: Spacing.sm,
    paddingBottom: 4,
  },
  option: {
    paddingVertical: 13,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.chip,
  },
  selected: {
    backgroundColor: Colors.accentSoft,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 4,
    borderTopWidth: BorderWidth.hair,
    borderTopColor: Colors.border,
  },
});
