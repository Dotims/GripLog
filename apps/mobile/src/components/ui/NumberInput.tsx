import { useState } from "react";
import { Platform, StyleSheet, type StyleProp, type TextStyle } from "react-native";

import { Colors, Fonts, Radii, tabular } from "@/constants/theme";

import { KEYBOARD_TOOLBAR_ID } from "./KeyboardToolbar";
import { RowInput } from "./RowInput";

type NumberInputProps = {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  decimals?: boolean;
  style?: StyleProp<TextStyle>;
  accessibilityLabel: string;
  testID?: string;
};

function format(value: number | null): string {
  return value === null ? "" : String(value);
}

/**
 * Keeps its own text so half-typed numbers like "82." survive, and reports a
 * parsed number (or null when empty) on every change.
 */
export function NumberInput({
  value,
  onChange,
  placeholder,
  decimals = true,
  style,
  accessibilityLabel,
  testID,
}: NumberInputProps) {
  const [text, setText] = useState(format(value));
  const [lastValue, setLastValue] = useState(value);

  // The value changed from outside (filled from a previous set): show it.
  if (value !== lastValue) {
    setLastValue(value);
    if (Number(text.replace(",", ".")) !== value) setText(format(value));
  }

  return (
    <RowInput
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      value={text}
      placeholder={placeholder}
      placeholderTextColor={Colors.faint}
      selectionColor={Colors.accent}
      keyboardAppearance="dark"
      keyboardType={decimals ? "decimal-pad" : "number-pad"}
      returnKeyType="done"
      inputAccessoryViewID={Platform.OS === "ios" ? KEYBOARD_TOOLBAR_ID : undefined}
      selectTextOnFocus
      maxLength={7}
      onChangeText={(next) => {
        const cleaned = next.replace(",", ".").replace(decimals ? /[^0-9.]/g : /[^0-9]/g, "");
        setText(cleaned);
        if (cleaned === "" || cleaned === ".") {
          setLastValue(null);
          onChange(null);
          return;
        }
        const parsed = Number(cleaned);
        if (Number.isFinite(parsed)) {
          setLastValue(parsed);
          onChange(parsed);
        }
      }}
      style={[fieldStyles.input, style]}
    />
  );
}

/** Shared by the number, duration and rep range fields so a set row reads as one line. */
export const fieldStyles = StyleSheet.create({
  input: {
    minWidth: 56,
    height: 38,
    paddingHorizontal: 6,
    paddingVertical: 0,
    borderRadius: Radii.sm,
    borderCurve: "continuous",
    backgroundColor: Colors.surfaceAlt,
    color: Colors.text,
    fontFamily: Fonts.semibold,
    fontSize: 16,
    textAlign: "center",
    ...tabular,
  },
});
