import { useState } from "react";
import { StyleSheet, TextInput, type StyleProp, type TextStyle } from "react-native";

import { Colors, Fonts, Radii } from "@/constants/theme";

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
    <TextInput
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      value={text}
      placeholder={placeholder}
      placeholderTextColor={Colors.faint}
      selectionColor={Colors.accent}
      keyboardType={decimals ? "decimal-pad" : "number-pad"}
      returnKeyType="done"
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
      style={[styles.input, style]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    minWidth: 56,
    height: 36,
    paddingHorizontal: 6,
    borderRadius: Radii.chip,
    backgroundColor: Colors.surfaceAlt,
    color: Colors.text,
    fontFamily: Fonts.monoBold,
    fontSize: 15,
    textAlign: "center",
  },
});
