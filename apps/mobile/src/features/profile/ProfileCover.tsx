import { startOfWeek } from "@griplog/core";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import type { ReactNode } from "react";
import { Pressable, StyleSheet, useWindowDimensions, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import { Colors } from "@/constants/theme";

const CELL = 13;
const GAP = 3;
const DAY_MS = 24 * 60 * 60 * 1000;

type CoverPhoto = { id: string; uri: string; workoutId: string };

type ProfileCoverProps = {
  height: number;
  /** Newest first; up to three are shown. */
  photos: readonly CoverPhoto[];
  /** Workout start times, for the training map when there are no photos. */
  startedAt: readonly string[];
  onOpenWorkout: (workoutId: string) => void;
  /** Buttons laid over the top right corner. */
  actions?: ReactNode;
  topInset: number;
};

/**
 * The profile banner is made from your training, never picked: the photos you
 * added to your latest workouts, or a map of the days you trained.
 */
export function ProfileCover({
  height,
  photos,
  startedAt,
  onOpenWorkout,
  actions,
  topInset,
}: ProfileCoverProps) {
  return (
    <View style={[styles.cover, { height }]}>
      {photos.length > 0 ? (
        <PhotoMosaic photos={photos.slice(0, 3)} onOpenWorkout={onOpenWorkout} />
      ) : (
        <TrainingMap startedAt={startedAt} top={topInset + 12} />
      )}
      <LinearGradient
        pointerEvents="none"
        colors={["rgba(10, 10, 11, 0.55)", "transparent", "transparent", Colors.background]}
        locations={[0, 0.3, 0.55, 1]}
        style={StyleSheet.absoluteFill}
      />
      {actions ? <View style={[styles.actions, { top: topInset + 8 }]}>{actions}</View> : null}
    </View>
  );
}

function PhotoMosaic({
  photos,
  onOpenWorkout,
}: {
  photos: readonly CoverPhoto[];
  onOpenWorkout: (workoutId: string) => void;
}) {
  const tile = (photo: CoverPhoto, style: object) => (
    <Pressable
      key={photo.id}
      style={style}
      onPress={() => onOpenWorkout(photo.workoutId)}
      accessibilityRole="imagebutton"
      accessibilityLabel="Open the workout of this photo"
    >
      <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
    </Pressable>
  );
  const [first, second, third] = photos;
  return (
    <Animated.View entering={FadeIn.duration(400)} style={styles.mosaic}>
      {first ? tile(first, styles.flex) : null}
      {second ? (
        <View style={[styles.flex, styles.column]}>
          {tile(second, styles.flex)}
          {third ? tile(third, styles.flex) : null}
        </View>
      ) : null}
    </Animated.View>
  );
}

/** A grid of days, one column per week, newest on the right: brighter means trained. */
function TrainingMap({ startedAt, top }: { startedAt: readonly string[]; top: number }) {
  const { width } = useWindowDimensions();
  const weeks = Math.ceil(width / (CELL + GAP)) + 1;
  const today = new Date();
  const firstWeek = startOfWeek(new Date(today.getTime() - (weeks - 1) * 7 * DAY_MS));

  const perDay = new Map<string, number>();
  for (const iso of startedAt) {
    const date = new Date(iso);
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
    perDay.set(key, (perDay.get(key) ?? 0) + 1);
  }

  const columns = Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => {
      const date = new Date(firstWeek);
      date.setDate(firstWeek.getDate() + week * 7 + day);
      const future = date.getTime() > today.getTime();
      const count = perDay.get(`${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`) ?? 0;
      return { key: `${week}-${day}`, future, count };
    }),
  );

  return (
    <Animated.View
      entering={FadeIn.duration(500)}
      style={[styles.map, { paddingTop: top, right: -GAP }]}
    >
      {columns.map((column, index) => (
        <View key={index} style={styles.mapColumn}>
          {column.map((cell) => (
            <View
              key={cell.key}
              style={[
                styles.cell,
                cell.future
                  ? styles.cellFuture
                  : cell.count > 1
                    ? styles.cellMany
                    : cell.count === 1
                      ? styles.cellOne
                      : null,
              ]}
            />
          ))}
        </View>
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  cover: {
    overflow: "hidden",
    backgroundColor: Colors.surface,
  },
  mosaic: {
    ...StyleSheet.absoluteFill,
    flexDirection: "row",
    gap: 2,
  },
  column: {
    gap: 2,
  },
  flex: {
    flex: 1,
  },
  actions: {
    position: "absolute",
    right: 16,
    flexDirection: "row",
    gap: 8,
  },
  map: {
    position: "absolute",
    top: 0,
    flexDirection: "row",
    gap: GAP,
  },
  mapColumn: {
    gap: GAP,
  },
  cell: {
    width: CELL,
    height: CELL,
    borderRadius: 4,
    backgroundColor: "#1B1B1F",
  },
  cellFuture: {
    backgroundColor: "transparent",
  },
  cellOne: {
    backgroundColor: "rgba(255, 71, 87, 0.55)",
  },
  cellMany: {
    backgroundColor: Colors.accent,
  },
});
