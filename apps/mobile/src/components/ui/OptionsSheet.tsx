import { Modal, Pressable, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, Radii, Spacing } from "@/constants/theme";

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
        <View style={styles.grabber} />
        {title ? (
          <AppText variant="caption" color={Colors.muted} style={styles.title}>
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
            <AppText
              variant="heading"
              color={
                option.destructive ? Colors.error : option.selected ? Colors.accent : Colors.text
              }
            >
              {option.label}
            </AppText>
          </Pressable>
        ))}
        <Pressable onPress={onClose} style={styles.cancel} accessibilityRole="button">
          <AppText variant="heading" color={Colors.muted}>
            Cancel
          </AppText>
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
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: 2,
    backgroundColor: Colors.surfaceRaised,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  grabber: {
    alignSelf: "center",
    width: 36,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.faint,
    marginBottom: Spacing.md,
  },
  title: {
    paddingHorizontal: Spacing.md,
    paddingBottom: 6,
  },
  option: {
    paddingVertical: 14,
    paddingHorizontal: Spacing.md,
    borderRadius: Radii.md,
  },
  selected: {
    backgroundColor: Colors.accentSoft,
  },
  cancel: {
    alignItems: "center",
    paddingVertical: 14,
    marginTop: 4,
  },
});
