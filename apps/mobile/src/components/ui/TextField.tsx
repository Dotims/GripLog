import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { Colors, Fonts, Radii } from "@/constants/theme";

import { AppText } from "./AppText";

type TextFieldProps = TextInputProps & {
  label?: string;
};

export function TextField({ label, style, ...props }: TextFieldProps) {
  return (
    <View style={styles.wrapper}>
      {label ? (
        <AppText variant="label" color={Colors.muted}>
          {label}
        </AppText>
      ) : null}
      <TextInput
        placeholderTextColor={Colors.faint}
        selectionColor={Colors.accent}
        keyboardAppearance="dark"
        {...props}
        style={[styles.input, props.multiline && styles.multiline, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 8,
  },
  input: {
    minHeight: 50,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radii.md,
    borderCurve: "continuous",
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  multiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },
});
