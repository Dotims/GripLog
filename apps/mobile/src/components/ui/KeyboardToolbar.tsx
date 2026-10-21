import { InputAccessoryView, Keyboard, Platform, Pressable, StyleSheet, View } from "react-native";

import { Colors, Spacing } from "@/constants/theme";

import { AppText } from "./AppText";

export const KEYBOARD_TOOLBAR_ID = "griplog-number-toolbar";

/**
 * iOS number pads have no return key, so the system floats its own Done pill
 * over the rows above the keyboard. Inputs that point at this bar get a
 * full-width toolbar instead. Render it once on each screen with number inputs.
 */
export function KeyboardToolbar() {
  if (Platform.OS !== "ios") return null;

  return (
    <InputAccessoryView nativeID={KEYBOARD_TOOLBAR_ID} backgroundColor={Colors.surfaceRaised}>
      <View style={styles.bar}>
        <Pressable
          onPress={() => Keyboard.dismiss()}
          accessibilityRole="button"
          accessibilityLabel="Hide keyboard"
          hitSlop={10}
          style={({ pressed }) => [styles.done, pressed && { opacity: 0.6 }]}
        >
          <AppText variant="bold" color={Colors.accent}>
            Done
          </AppText>
        </Pressable>
      </View>
    </InputAccessoryView>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: 44,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: Spacing.lg,
    backgroundColor: Colors.surfaceRaised,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Colors.hairline,
  },
  done: {
    paddingVertical: 6,
    paddingLeft: Spacing.md,
  },
});
