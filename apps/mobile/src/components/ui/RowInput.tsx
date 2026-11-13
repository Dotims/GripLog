import { useEffect, useRef, useState } from "react";
import {
  Platform,
  Pressable,
  StyleSheet,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";

/** Style keys that place the field in its row; the rest style the text box itself. */
const LAYOUT_KEYS = new Set([
  "width",
  "minWidth",
  "maxWidth",
  "flex",
  "flexGrow",
  "flexShrink",
  "flexBasis",
  "alignSelf",
  "margin",
  "marginLeft",
  "marginRight",
  "marginHorizontal",
]);

type RowInputProps = Omit<TextInputProps, "style"> & {
  style?: StyleProp<TextStyle>;
};

/** Android: ignores touches until tapped, so a swipe can start on the field. */
export function RowInput({ style, onFocus, onBlur, ...props }: RowInputProps) {
  const ref = useRef<TextInput>(null);
  const [focused, setFocused] = useState(false);
  const [unlocked, setUnlocked] = useState(false);
  const flat = StyleSheet.flatten(style) ?? {};
  const layout: ViewStyle = {};
  const box: TextStyle = {};
  for (const [key, value] of Object.entries(flat)) {
    if (LAYOUT_KEYS.has(key)) (layout as Record<string, unknown>)[key] = value;
    else (box as Record<string, unknown>)[key] = value;
  }

  const passive = Platform.OS === "android" && !focused && !unlocked;

  useEffect(() => {
    if (!unlocked) return;
    const timer = setTimeout(() => ref.current?.focus(), 60);
    return () => clearTimeout(timer);
  }, [unlocked]);

  return (
    <Pressable
      style={layout}
      onPress={() => setUnlocked(true)}
      accessible={false}
      disabled={!passive}
    >
      <View pointerEvents={passive ? "none" : "auto"}>
        <TextInput
          ref={ref}
          {...props}
          onFocus={(event) => {
            setFocused(true);
            onFocus?.(event);
          }}
          onBlur={(event) => {
            setFocused(false);
            setUnlocked(false);
            onBlur?.(event);
          }}
          style={box}
        />
      </View>
    </Pressable>
  );
}
