import { Search, X } from "lucide-react-native";
import { useDeferredValue, useState, type ReactElement } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { AppText, Chip } from "@/components/ui";
import { Colors, Fonts, Radii, Spacing } from "@/constants/theme";

import { COMMON_EXERCISE_IDS } from "@/features/import/hevy-exercise-map";

import { animationUrl, MUSCLE_GROUPS } from "./catalogue";
import { ExerciseCard } from "./ExerciseCard";
import { filterExercises, libraryExercises, sortByUsage } from "./filter";
import { useExercises, useExerciseUsage } from "./hooks";
import type { ExerciseListItem } from "./repository";

type ExerciseBrowserProps = {
  onSelect: (exercise: ExerciseListItem) => void;
  selectedIds?: ReadonlySet<string>;
  header?: ReactElement;
  bottomInset?: number;
};

export function ExerciseBrowser({
  onSelect,
  selectedIds,
  header,
  bottomInset = 0,
}: ExerciseBrowserProps) {
  const usage = useExerciseUsage();
  const exercises = libraryExercises(
    useExercises(),
    usage,
    (id) => animationUrl(id) !== undefined,
    COMMON_EXERCISE_IDS,
  );
  const [query, setQuery] = useState("");
  const [muscle, setMuscle] = useState<string | null>(null);
  // Typing stays responsive; filtering 900 rows catches up a frame later.
  const deferredQuery = useDeferredValue(query);

  const visible = sortByUsage(filterExercises(exercises, deferredQuery, muscle), usage);

  return (
    <FlatList
      data={visible}
      keyExtractor={(item) => item.id}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      contentContainerStyle={[styles.content, { paddingBottom: Spacing.xxl + bottomInset }]}
      initialNumToRender={12}
      windowSize={7}
      ListHeaderComponent={
        <View style={styles.header}>
          {header}
          <View style={styles.search}>
            <Search color={Colors.muted} size={18} strokeWidth={2} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${exercises.length} exercises`}
              placeholderTextColor={Colors.faint}
              selectionColor={Colors.accent}
              keyboardAppearance="dark"
              style={styles.searchInput}
              autoCorrect={false}
              testID="exercise-search"
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} accessibilityLabel="Clear search" hitSlop={8}>
                <X color={Colors.muted} size={18} strokeWidth={2} />
              </Pressable>
            ) : null}
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chips}
            keyboardShouldPersistTaps="handled"
          >
            <Chip
              label="All"
              selected={muscle === null}
              tone="light"
              onPress={() => setMuscle(null)}
            />
            {MUSCLE_GROUPS.map((group) => (
              <Chip
                key={group}
                label={group}
                selected={muscle === group}
                tone="light"
                onPress={() => setMuscle(muscle === group ? null : group)}
              />
            ))}
          </ScrollView>
          <AppText variant="caption" color={Colors.faint}>
            {visible.length} {visible.length === 1 ? "exercise" : "exercises"}
          </AppText>
        </View>
      }
      renderItem={({ item }) => (
        <ExerciseCard
          exercise={item}
          onPress={() => onSelect(item)}
          selected={selectedIds?.has(item.id)}
          uses={usage.get(item.id)}
        />
      )}
      ListEmptyComponent={
        <AppText color={Colors.muted} align="center" style={styles.empty}>
          Nothing matches. Try fewer words or another muscle.
        </AppText>
      }
    />
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
    gap: 8,
  },
  header: {
    gap: Spacing.md,
    marginBottom: 4,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 46,
    paddingHorizontal: 14,
    backgroundColor: Colors.surfaceRaised,
    borderRadius: Radii.md,
    borderCurve: "continuous",
  },
  searchInput: {
    flex: 1,
    height: "100%",
    color: Colors.text,
    fontFamily: Fonts.regular,
    fontSize: 16,
  },
  chips: {
    gap: 6,
    paddingRight: Spacing.lg,
  },
  empty: {
    paddingVertical: Spacing.xl,
  },
});
