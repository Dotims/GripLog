import { useState } from "react";
import { Platform, TextInput, type StyleProp, type TextStyle } from "react-native";

import { Colors } from "@/constants/theme";

import { KEYBOARD_TOOLBAR_ID } from "./KeyboardToolbar";
import { fieldStyles } from "./NumberInput";

export type RepRange = { reps: number | null; repsMax: number | null };

const format = ({ reps, repsMax }: RepRange) =>
  reps === null ? "" : repsMax !== null && repsMax > reps ? `${reps}-${repsMax}` : String(reps);

/** "8" is a fixed target, "8-12" a range. Half-typed text like "8-" keeps the bottom only. */
export function parseRepRange(text: string): RepRange {
  const [low = "", high = ""] = text.split("-");
  const reps = low === "" ? null : Number(low);
  const repsMax = high === "" || reps === null ? null : Number(high);
  return { reps, repsMax: repsMax !== null && repsMax > (reps ?? 0) ? repsMax : null };
}

type RepRangeInputProps = {
  value: RepRange;
  onChange: (value: RepRange) => void;
  placeholder?: string;
  style?: StyleProp<TextStyle>;
  accessibilityLabel: string;
};

export function RepRangeInput({
  value,
  onChange,
  placeholder,
  style,
  accessibilityLabel,
}: RepRangeInputProps) {
  const [text, setText] = useState(format(value));
  const [lastValue, setLastValue] = useState(value);

  // The value changed from outside (a set was copied): show it.
  if (value.reps !== lastValue.reps || value.repsMax !== lastValue.repsMax) {
    setLastValue(value);
    const typed = parseRepRange(text);
    if (typed.reps !== value.reps || typed.repsMax !== value.repsMax) setText(format(value));
  }

  return (
    <TextInput
      accessibilityLabel={accessibilityLabel}
      value={text}
      placeholder={placeholder}
      placeholderTextColor={Colors.faint}
      selectionColor={Colors.accent}
      keyboardAppearance="dark"
      // The iOS number pad has no dash, so a range needs the punctuation keyboard.
      keyboardType={Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric"}
      inputAccessoryViewID={Platform.OS === "ios" ? KEYBOARD_TOOLBAR_ID : undefined}
      returnKeyType="done"
      selectTextOnFocus
      maxLength={5}
      onChangeText={(next) => {
        const cleaned = next
          .replace(/[–—]/g, "-")
          .replace(/[^0-9-]/g, "")
          .replace(/-+/g, "-");
        setText(cleaned);
        const range = parseRepRange(cleaned);
        setLastValue(range);
        onChange(range);
      }}
      style={[fieldStyles.input, style]}
    />
  );
}
