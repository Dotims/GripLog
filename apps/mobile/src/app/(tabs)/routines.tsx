import { StyleSheet, Text, View } from "react-native";

import { Colors } from "@/constants/theme";

export default function RoutinesScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Routines Screen</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  text: {
    color: Colors.text,
  },
});
