import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Body from "react-native-body-highlighter";

import { Colors } from "@/constants/theme";

import { bestSide, type WorkedMuscle } from "./muscles";

// Helpers in a muted red, the main work in the accent.
const INTENSITY = ["rgba(255, 71, 87, 0.42)", Colors.accent] as const;
const BODY = "#2E2E33";

/** The drawing is 200 by 400 points at scale 1. */
const BASE_HEIGHT = 400;

type MuscleMapProps = {
  muscles: readonly WorkedMuscle[];
  /** Height of one figure in points. */
  height: number;
  /** Both views side by side, or only the one that shows the most work. */
  sides?: "both" | "best";
  style?: StyleProp<ViewStyle>;
};

/** A body with the trained muscles lit, front and back. Purely decorative, so it ignores touches. */
export function MuscleMap({ muscles, height, sides = "both", style }: MuscleMapProps) {
  const scale = height / BASE_HEIGHT;
  const views = sides === "both" ? (["front", "back"] as const) : [bestSide(muscles)];
  // The head is drawn in its own light colour; keep the whole figure one tone.
  const data = [
    { slug: "head" as const, styles: { fill: BODY } },
    ...muscles.map(({ slug, intensity }) => ({ slug, intensity })),
  ];

  return (
    <View style={[styles.row, style]} pointerEvents="none" accessible={false}>
      {views.map((side) => (
        <Body
          key={side}
          data={data}
          side={side}
          scale={scale}
          colors={INTENSITY}
          border="none"
          defaultFill={BODY}
          hiddenParts={["hair"]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
});
