import { Image } from "expo-image";
import { useEffect, useState } from "react";
import { StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  cancelAnimation,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";

import { AppText } from "@/components/ui";
import { Colors } from "@/constants/theme";

import { animationUrl, exerciseImageUrl } from "./catalogue";

const AnimatedImage = Animated.createAnimatedComponent(Image);

type ExerciseImageProps = {
  /** Catalogue id; exercises linked to ExerciseDB show its animation instead of photos. */
  exerciseId?: string;
  images: readonly string[];
  name: string;
  /** Play the animation, or crossfade the start and end photo when there is none. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ExerciseImage({
  exerciseId,
  images,
  name,
  animated = false,
  style,
}: ExerciseImageProps) {
  const [first, second] = images;
  const opacity = useSharedValue(0);
  // A GIF that fails to load (offline, never cached) falls back to the photos.
  const [gifFailed, setGifFailed] = useState(false);
  const gif = exerciseId && !gifFailed ? animationUrl(exerciseId) : undefined;

  useEffect(() => {
    if (gif || !animated || !second) return;
    opacity.value = withRepeat(
      withSequence(
        withDelay(700, withTiming(1, { duration: 450 })),
        withDelay(700, withTiming(0, { duration: 450 })),
      ),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, [animated, gif, opacity, second]);

  const topStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

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
          // Lists show the start position; the detail screen plays the movement.
          autoplay={animated}
          transition={150}
          onError={() => setGifFailed(true)}
        />
      </View>
    );
  }

  if (!first) {
    return (
      <View style={[styles.placeholder, style]} accessibilityLabel={name}>
        <AppText variant="title" color={Colors.faint}>
          {name.slice(0, 1).toUpperCase()}
        </AppText>
      </View>
    );
  }

  return (
    <View style={[styles.frame, style]} accessibilityLabel={name} accessibilityRole="image">
      <Image
        source={{ uri: exerciseImageUrl(first) }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        cachePolicy="disk"
        transition={150}
      />
      {animated && second ? (
        <AnimatedImage
          source={{ uri: exerciseImageUrl(second) }}
          style={[StyleSheet.absoluteFill, topStyle]}
          contentFit="cover"
          cachePolicy="disk"
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    overflow: "hidden",
    backgroundColor: Colors.surfaceAlt,
  },
  // The animations are drawn on white, so the frame matches instead of showing a seam.
  animation: {
    backgroundColor: Colors.media,
  },
  placeholder: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceAlt,
  },
});
