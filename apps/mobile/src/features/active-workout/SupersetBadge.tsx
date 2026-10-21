import { Link2 } from "lucide-react-native";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { Radii } from "@/constants/theme";

/** "Superset A" in the group's colour, on the header of each linked exercise. */
export function SupersetBadge({ letter, color }: { letter: string; color: string }) {
  return (
    <View style={[styles.badge, { backgroundColor: `${color}24` }]}>
      <Link2 color={color} size={12} strokeWidth={2.4} />
      <AppText variant="caption" color={color}>
        Superset {letter}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radii.pill,
  },
});
