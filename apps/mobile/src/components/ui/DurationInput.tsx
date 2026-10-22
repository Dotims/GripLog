import { useState } from "react";
import { Platform, type StyleProp, type TextStyle } from "react-native";

import { Colors } from "@/constants/theme";

import { KEYBOARD_TOOLBAR_ID } from "./KeyboardToolbar";
import { RowInput } from "./RowInput";
import { fieldStyles } from "./NumberInput";

type DurationInputProps = {
  /** Seconds. */
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel: string;
  testID?: string;
};

const toDigits = (seconds: number | null) =>
  seconds === null
    ? ""
    : `${Math.floor(seconds / 60)}${String(seconds % 60).padStart(2, "0")}`.replace(/^0+/, "");

const toText = (digits: string) =>
  digits === "" ? "" : `${Number(digits.slice(0, -2) || 0)}:${digits.padStart(2, "0").slice(-2)}`;

/** Digits fill from the right like a stopwatch: typing 1, 3, 0 reads 1:30. */
export function parseDurationDigits(digits: string): number | null {
  if (digits === "") return null;
  const value = Number(digits);
  return Math.floor(value / 100) * 60 + (value % 100);
}

export function DurationInput({
  value,
  onChange,
  placeholder,
  style,
  accessibilityLabel,
  testID,
}: DurationInputProps) {
  const [digits, setDigits] = useState(toDigits(value));
  const [lastValue, setLastValue] = useState(value);

  // The value changed from outside (filled from a previous set): show it.
  if (value !== lastValue) {
    setLastValue(value);
    if (parseDurationDigits(digits) !== value) setDigits(toDigits(value));
  }

  return (
    <RowInput
      testID={testID}
      accessibilityLabel={accessibilityLabel}
      value={toText(digits)}
      placeholder={placeholder}
      placeholderTextColor={Colors.faint}
      selectionColor={Colors.accent}
      keyboardAppearance="dark"
      keyboardType="number-pad"
      inputAccessoryViewID={Platform.OS === "ios" ? KEYBOARD_TOOLBAR_ID : undefined}
      selectTextOnFocus
      onChangeText={(next) => {
        const cleaned = next.replace(/\D/g, "").replace(/^0+/, "").slice(0, 4);
        const seconds = parseDurationDigits(cleaned);
        setDigits(cleaned);
        setLastValue(seconds);
        onChange(seconds);
      }}
      style={[fieldStyles.input, style]}
    />
  );
}
