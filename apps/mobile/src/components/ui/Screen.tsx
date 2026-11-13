import type { ReactNode } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
  type ScrollViewProps,
} from "react-native";
import { useSafeAreaInsets, type Edge } from "react-native-safe-area-context";

import { Colors, Spacing } from "@/constants/theme";

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  /** Presented as a modal sheet: on iOS the sheet already starts below the status bar. */
  sheet?: boolean;
  contentContainerStyle?: ScrollViewProps["contentContainerStyle"];
  keyboardShouldPersistTaps?: ScrollViewProps["keyboardShouldPersistTaps"];
};

/** Insets from context: SafeAreaView in a sliding iOS modal measures a zero top inset. */
export function useScreenInsets(edges: Edge[] = ["top"], sheet = false) {
  const insets = useSafeAreaInsets();
  return {
    top: edges.includes("top") && !(sheet && Platform.OS === "ios") ? insets.top : 0,
    bottom: edges.includes("bottom") ? insets.bottom : 0,
  };
}

export function Screen({
  children,
  scroll = false,
  edges = ["top"],
  sheet = false,
  contentContainerStyle,
  keyboardShouldPersistTaps = "handled",
}: ScreenProps) {
  const { top, bottom } = useScreenInsets(edges, sheet);

  return (
    <View style={[styles.root, { paddingTop: top, paddingBottom: bottom }]}>
      {scroll ? (
        // Edge-to-edge Android does not resize for the keyboard, so the scroll view is padded.
        <KeyboardAvoidingView
          style={styles.root}
          behavior={Platform.OS === "android" ? "padding" : undefined}
        >
          <ScrollView
            contentContainerStyle={[styles.content, contentContainerStyle]}
            keyboardShouldPersistTaps={keyboardShouldPersistTaps}
            keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
            automaticallyAdjustKeyboardInsets
            showsVerticalScrollIndicator={false}
            indicatorStyle="white"
          >
            {children}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        children
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl * 2,
    gap: Spacing.lg,
  },
});
