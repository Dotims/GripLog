import type { TrackingType } from "@griplog/core";
import { Image } from "expo-image";
import { Activity, Dumbbell, Timer, type LucideIcon } from "lucide-react-native";
import { useState } from "react";
import {
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type StyleProp,
  type ViewStyle,
} from "react-native";

import { Colors } from "@/constants/theme";

import { animationUrl } from "./catalogue";

const ICONS: Record<TrackingType, LucideIcon> = {
  weight_reps: Dumbbell,
  reps: Dumbbell,
  duration: Timer,
  distance_duration: Activity,
};

type ExerciseImageProps = {
  /** Catalogue id; linked exercises show their ExerciseDB animation. */
  exerciseId?: string;
  name: string;
  trackingType?: TrackingType;
  /** Play the animation; lists show its first frame, the start position. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ExerciseImage({
  exerciseId,
  name,
  trackingType = "weight_reps",
  animated = false,
  style,
}: ExerciseImageProps) {
  const [failed, setFailed] = useState(false);
  const [side, setSide] = useState(0);
  const gif = exerciseId && !failed ? animationUrl(exerciseId) : undefined;

  if (gif) {
    return (
      <View
        style={[styles.frame, styles.animation, style]}
        accessibilityLabel={name}
        accessibilityRole="image"
      >
        <Image
          source={{ uri: gif }}
          style={StyleSheet.absoluteFill}
          contentFit="contain"
          cachePolicy="disk"
          autoplay={animated}
          transition={200}
          onError={() => setFailed(true)}
        />
      </View>
    );
  }

  const Icon = ICONS[trackingType];
  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    setSide(Math.min(width, height));
  };

  return (
    <View
      style={[styles.frame, styles.tile, style]}
      onLayout={onLayout}
      accessibilityLabel={name}
      accessibilityRole="image"
    >
      {side > 0 ? (
        <Icon color={Colors.faint} size={Math.round(side * 0.4)} strokeWidth={1.6} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    borderCurve: "continuous",
  },
  // The GIFs have a white background.
  animation: {
    backgroundColor: Colors.media,
  },
  tile: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceAlt,
  },
});
