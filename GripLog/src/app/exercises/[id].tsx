import { Stack, useLocalSearchParams } from "expo-router";
import { StyleSheet, Text, View } from "react-native";

import { BorderWidth, Colors, Fonts, Radii, Shadow } from "@/constants/theme";

export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          headerShown: true,
          headerTitle: "",
          headerShadowVisible: false,
          headerStyle: { backgroundColor: Colors.background },
          headerTintColor: Colors.text,
        }}
      />

      <Text style={styles.kicker}>Exercise</Text>
      <Text style={styles.title}>Detail</Text>

      <View style={styles.idTag}>
        <Text style={styles.idLabel}>ID</Text>
        <Text style={styles.idValue}>{id}</Text>
      </View>

      <Text style={styles.note}>Full details coming next.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    paddingHorizontal: 20,
    paddingTop: 8,
    gap: 4,
  },
  kicker: {
    color: Colors.muted,
    fontFamily: Fonts.mono,
    fontSize: 12,
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  title: {
    color: Colors.text,
    fontSize: 48,
    fontWeight: "900",
    letterSpacing: -1.5,
    textTransform: "uppercase",
  },
  idTag: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    borderRadius: Radii.chip,
    boxShadow: Shadow.hard,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  idLabel: {
    color: Colors.accent,
    fontFamily: Fonts.mono,
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1,
  },
  idValue: {
    color: Colors.text,
    fontFamily: Fonts.mono,
    fontSize: 14,
    fontWeight: "700",
  },
  note: {
    color: Colors.muted,
    fontSize: 13,
    marginTop: 16,
  },
});
