import type { LucideIcon } from "lucide-react-native";
import type { ColorValue } from "react-native";
import Animated, { useAnimatedStyle, withSpring } from "react-native-reanimated";

/** A tab bar icon that lifts a little when its tab is chosen. */
export function TabIcon({
  icon: Icon,
  color,
  size,
  focused,
}: {
  icon: LucideIcon;
  color: ColorValue;
  size: number;
  focused: boolean;
}) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { scale: withSpring(focused ? 1.1 : 1, { damping: 12, stiffness: 260 }) },
      { translateY: withSpring(focused ? -1 : 0, { damping: 12, stiffness: 260 }) },
    ],
  }));
  return (
    <Animated.View style={style}>
      <Icon color={String(color)} size={size} strokeWidth={focused ? 2.3 : 2} />
    </Animated.View>
  );
}
