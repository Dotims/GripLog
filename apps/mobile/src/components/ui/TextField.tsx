import { StyleSheet, TextInput, View, type TextInputProps } from "react-native";

import { BorderWidth, Colors, Fonts, Radii } from "@/constants/theme";

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
        {...props}
        style={[styles.input, props.multiline && styles.multiline, style]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    gap: 6,
  },
  input: {
    minHeight: 48,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    borderRadius: Radii.card,
    color: Colors.text,
    fontFamily: Fonts.body,
    fontSize: 16,
  },
  multiline: {
    minHeight: 96,
    textAlignVertical: "top",
  },
});
