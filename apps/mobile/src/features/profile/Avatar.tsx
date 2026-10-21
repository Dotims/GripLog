import { Image } from "expo-image";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { Colors, Fonts, Radii } from "@/constants/theme";

export function Avatar({
  uri,
  initials,
  size = 72,
}: {
  uri: string | null;
  initials: string;
  size?: number;
}) {
  return (
    <View style={[styles.frame, { width: size, height: size }]}>
      {uri ? (
        <Image source={{ uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
      ) : (
        <AppText color={Colors.accent} style={{ fontFamily: Fonts.bold, fontSize: size * 0.36 }}>
          {initials}
        </AppText>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: Colors.accentSoft,
    borderRadius: Radii.pill,
  },
});
