import type { LucideIcon } from "lucide-react-native";
import type { ColorValue } from "react-native";

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
  return <Icon color={String(color)} size={size} strokeWidth={focused ? 2.3 : 2} />;
}
