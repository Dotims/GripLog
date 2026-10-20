import { formatClock } from "@griplog/core";

import { AppText, type TextVariant } from "@/components/ui/AppText";
import { useNow } from "@/lib/use-now";

export function ElapsedTime({
  startedAt,
  variant = "number",
  color,
}: {
  startedAt: string;
  variant?: TextVariant;
  color?: string;
}) {
  const now = useNow();
  const seconds = (now - new Date(startedAt).getTime()) / 1000;
  return (
    <AppText variant={variant} color={color}>
      {formatClock(seconds)}
    </AppText>
  );
}
