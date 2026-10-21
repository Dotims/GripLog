import { Image } from "expo-image";
import { useEffect } from "react";
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

import { exerciseImageUrl } from "./catalogue";

const AnimatedImage = Animated.createAnimatedComponent(Image);

type ExerciseImageProps = {
  images: readonly string[];
  name: string;
  /** Crossfade between the start and end photo, standing in for a GIF. */
  animated?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function ExerciseImage({ images, name, animated = false, style }: ExerciseImageProps) {
  const [first, second] = images;
  const opacity = useSharedValue(0);

  useEffect(() => {
    if (!animated || !second) return;
    opacity.value = withRepeat(
      withSequence(
        withDelay(700, withTiming(1, { duration: 450 })),
        withDelay(700, withTiming(0, { duration: 450 })),
      ),
      -1,
    );
    return () => cancelAnimation(opacity);
  }, [animated, opacity, second]);

  const topStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

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
  placeholder: {
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.surfaceAlt,
  },
});
