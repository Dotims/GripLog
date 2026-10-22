import type { TextInputProps } from "react-native";
import { TextInput as GestureTextInput } from "react-native-gesture-handler";

/**
 * A text field inside a swipeable row. The gesture-handler field joins the
 * row's gesture, so a swipe that starts on the field still moves the row on
 * Android, where a plain native field keeps the touch to itself.
 */
export function RowInput(props: TextInputProps) {
  return <GestureTextInput {...props} />;
}
