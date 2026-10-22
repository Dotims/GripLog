import * as Haptics from "expo-haptics";
import { Trash2 } from "lucide-react-native";
import { useState, type ReactNode } from "react";
import { Keyboard, Pressable, StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";

import { Colors } from "@/constants/theme";

/** Width of the revealed delete button. */
const ACTION = 84;
/** Past this share of the row's width, letting go deletes straight away. */
const DELETE_AT = 0.5;
const SETTLE = { damping: 20, stiffness: 260, mass: 0.7 };

/** Closes the row left open, so only one shows its delete button at a time. */
let openRow: { close: () => void } | null = null;
function claimRow(row: { close: () => void }) {
  if (openRow !== row) openRow?.close();
  openRow = row;
}

type SwipeToDeleteProps = {
  children: ReactNode;
  onDelete: () => void;
  accessibilityLabel?: string;
};

/**
 * A row that slides left. A short swipe reveals a delete button, a long one
 * deletes. Deleting slides the row out, then folds its height and the red
 * behind it together, so nothing red is left hanging while the list closes up.
 */
export function SwipeToDelete({
  children,
  onDelete,
  accessibilityLabel = "Delete",
}: SwipeToDeleteProps) {
  const width = useSharedValue(0);
  const height = useSharedValue(0);
  const offset = useSharedValue(0);
  const start = useSharedValue(0);
  const collapse = useSharedValue(0);
  const gone = useSharedValue(0);
  const armed = useSharedValue(false);

  const finish = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    onDelete();
  };
  const buzz = () => Haptics.selectionAsync().catch(() => {});
  const [self] = useState(() => ({ close: () => offset.set(withSpring(0, SETTLE)) }));
  const claim = () => claimRow(self);
  // A swipe that starts on a field must not leave it focused with the keyboard up.
  const settleFocus = () => setTimeout(() => Keyboard.dismiss(), 60);

  // The row slides out while the red fades with it, then the empty gap closes.
  const remove = () => {
    "worklet";
    const out = { duration: 180, easing: Easing.out(Easing.cubic) };
    gone.set(withTiming(1, out));
    offset.set(
      withTiming(-width.get(), out, (done) => {
        if (!done) return;
        collapse.set(
          withTiming(1, { duration: 200, easing: Easing.inOut(Easing.cubic) }, (closed) => {
            if (closed) scheduleOnRN(finish);
          }),
        );
      }),
    );
  };

  const pan = Gesture.Pan()
    .activeOffsetX([-12, 12])
    .failOffsetY([-10, 10])
    .onStart(() => {
      start.set(offset.get());
      scheduleOnRN(claim);
    })
    .onUpdate((event) => {
      const next = Math.min(0, start.get() + event.translationX);
      offset.set(next);
      // A tick when the row crosses the point where letting go deletes it.
      const past = -next > width.get() * DELETE_AT;
      if (past !== armed.get()) {
        armed.set(past);
        scheduleOnRN(buzz);
      }
    })
    .onEnd((event) => {
      scheduleOnRN(settleFocus);
      const travelled = -offset.get();
      if (travelled > width.get() * DELETE_AT || (event.velocityX < -1800 && travelled > ACTION)) {
        remove();
      } else if (travelled > ACTION / 2) {
        offset.set(withSpring(-ACTION, SETTLE));
      } else {
        offset.set(withSpring(0, SETTLE));
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.get() }],
    opacity: 1 - gone.get(),
  }));
  const behindStyle = useAnimatedStyle(() => ({
    opacity: interpolate(-offset.get(), [0, 24], [0, 1], "clamp") * (1 - gone.get()),
  }));
  const iconStyle = useAnimatedStyle(() => {
    const reach = -offset.get();
    const w = width.get() || 1;
    return {
      // The icon rides along once the swipe goes past the button.
      transform: [
        { translateX: Math.min(0, -(reach - ACTION)) },
        { scale: armed.get() ? withSpring(1.2, SETTLE) : withSpring(1, SETTLE) },
      ],
      opacity: interpolate(reach, [0, ACTION * 0.6, w], [0, 1, 1], "clamp"),
    };
  });
  const wrapperStyle = useAnimatedStyle(() => {
    const c = collapse.get();
    if (c === 0) return {};
    return { height: height.get() * (1 - c) };
  });

  return (
    <Animated.View
      style={[styles.wrapper, wrapperStyle]}
      onLayout={(event) => {
        width.set(event.nativeEvent.layout.width);
        if (collapse.get() === 0) height.set(event.nativeEvent.layout.height);
      }}
    >
      <Animated.View style={[styles.behind, behindStyle]}>
        <Pressable
          onPress={remove}
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          style={styles.action}
        >
          <Animated.View style={iconStyle}>
            <Trash2 color={Colors.accentInk} size={20} strokeWidth={2.2} />
          </Animated.View>
        </Pressable>
      </Animated.View>
      <GestureDetector gesture={pan}>
        <Animated.View style={rowStyle}>
          <View>{children}</View>
        </Animated.View>
      </GestureDetector>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    overflow: "hidden",
  },
  behind: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
    justifyContent: "flex-end",
    backgroundColor: Colors.error,
  },
  action: {
    width: ACTION,
    alignItems: "center",
    justifyContent: "center",
  },
});
