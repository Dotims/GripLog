const DAY_MS = 24 * 60 * 60 * 1000;
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** "Today", "Yesterday", "Mon 13 Oct", or "13 Oct 2024" for other years. */
export function formatRelativeDay(iso: string, now: Date = new Date()): string {
  const date = new Date(iso);
  const days = Math.round((startOfDay(now) - startOfDay(date)) / DAY_MS);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  const dayMonth = `${date.getDate()} ${MONTHS[date.getMonth()]}`;
  if (date.getFullYear() !== now.getFullYear()) return `${dayMonth} ${date.getFullYear()}`;
  return `${WEEKDAYS[date.getDay()]} ${dayMonth}`;
}

export function formatTime(iso: string): string {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

export function formatShortDate(date: Date): string {
  return `${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function todayLabel(now: Date = new Date()): string {
  return `${WEEKDAYS[now.getDay()]} ${now.getDate()} ${MONTHS[now.getMonth()]}`;
}

/** Default title for a new workout, the way Hevy names them. */
export function workoutTitleForNow(now: Date = new Date()): string {
  const hour = now.getHours();
  if (hour < 5) return "Night workout";
  if (hour < 12) return "Morning workout";
  if (hour < 17) return "Afternoon workout";
  if (hour < 21) return "Evening workout";
  return "Night workout";
}

export function durationSeconds(startIso: string, endIso: string): number {
  return Math.max(0, (new Date(endIso).getTime() - new Date(startIso).getTime()) / 1000);
}

/** "in about 3 weeks · Nov 2026" for a forecast; days under two weeks are named as days. */
export function formatForecast(date: Date, now: Date = new Date()): string {
  const days = Math.max(1, Math.round((startOfDay(date) - startOfDay(now)) / DAY_MS));
  const span =
    days < 14
      ? `${days} ${days === 1 ? "day" : "days"}`
      : days < 70
        ? `${Math.round(days / 7)} weeks`
        : `${Math.round(days / 30.4)} months`;
  return `in about ${span} · ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
}
