import { useEffect, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

import { Colors, SupersetColors } from "@/constants/theme";

const COLORS = [Colors.accent, Colors.gold, Colors.success, Colors.text, ...SupersetColors];
const DURATION = 2600;
const GRAVITY = 1400;

type Piece = {
  vx: number;
  vy: number;
  spin: number;
  wobble: number;
  width: number;
  height: number;
  color: string;
  round: boolean;
};

function makePieces(count: number, gold: boolean): Piece[] {
  return Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 1.9;
    const speed = 520 + Math.random() * 620;
    const palette = gold ? [Colors.gold, Colors.gold, ...COLORS] : COLORS;
    return {
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      spin: (Math.random() - 0.5) * 1440,
      wobble: Math.random() * Math.PI * 2,
      width: 6 + Math.random() * 6,
      height: i % 3 === 0 ? 6 + Math.random() * 4 : 12 + Math.random() * 8,
      color: palette[i % palette.length]!,
      round: i % 5 === 0,
    };
  });
}

function ConfettiPiece({
  piece,
  time,
  originX,
  originY,
}: {
  piece: Piece;
  time: SharedValue<number>;
  originX: number;
  originY: number;
}) {
  const style = useAnimatedStyle(() => {
    const t = (time.get() * DURATION) / 1000;
    // Air drag slows the burst, so pieces float down instead of dropping.
    const drag = 1 - Math.exp(-t * 2.2);
    const x = originX + (piece.vx / 2.2) * drag + Math.sin(piece.wobble + t * 6) * 10;
    const y = originY + (piece.vy / 2.2) * drag + 0.5 * GRAVITY * 0.35 * t * t;
    return {
      opacity: time.get() > 0.75 ? 1 - (time.get() - 0.75) / 0.25 : 1,
      transform: [
        { translateX: x },
        { translateY: y },
        { rotate: `${piece.spin * t}deg` },
        { rotateY: `${t * 540 + piece.wobble * 60}deg` },
      ],
    };
  });
  return (
    <Animated.View
      style={[
        styles.piece,
        {
          width: piece.width,
          height: piece.round ? piece.width : piece.height,
          borderRadius: piece.round ? 999 : 2,
          backgroundColor: piece.color,
        },
        style,
      ]}
    />
  );
}

/** A one-off burst from the top centre that falls past the screen. Ignores touches. */
export function Confetti({ count = 70, gold = false }: { count?: number; gold?: boolean }) {
  const { width, height } = useWindowDimensions();
  const [pieces] = useState(() => makePieces(count, gold));
  const time = useSharedValue(0);

  useEffect(() => {
    time.set(withTiming(1, { duration: DURATION, easing: Easing.linear }));
  }, [time]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {pieces.map((piece, index) => (
        <ConfettiPiece
          key={index}
          piece={piece}
          time={time}
          originX={width / 2}
          originY={height * 0.28}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  piece: {
    position: "absolute",
    left: 0,
    top: 0,
  },
});
