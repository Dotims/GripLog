import { Search, X } from "lucide-react-native";
import { useDeferredValue, useState, type ReactElement } from "react";
import { FlatList, Pressable, ScrollView, StyleSheet, TextInput, View } from "react-native";

import { AppText, Chip } from "@/components/ui";
import { BorderWidth, Colors, Fonts, Radii, Spacing } from "@/constants/theme";

import { MUSCLE_GROUPS } from "./catalogue";
import { ExerciseCard } from "./ExerciseCard";
import { filterExercises, sortByUsage } from "./filter";
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
  const exercises = useExercises();
  const usage = useExerciseUsage();
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
            <Search color={Colors.muted} size={18} strokeWidth={2.5} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={`Search ${exercises.length} exercises`}
              placeholderTextColor={Colors.faint}
              selectionColor={Colors.accent}
              style={styles.searchInput}
              autoCorrect={false}
              testID="exercise-search"
            />
            {query ? (
              <Pressable onPress={() => setQuery("")} accessibilityLabel="Clear search" hitSlop={8}>
                <X color={Colors.text} size={18} strokeWidth={2.5} />
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
              tone="dark"
              onPress={() => setMuscle(null)}
            />
            {MUSCLE_GROUPS.map((group) => (
              <Chip
                key={group}
                label={group}
                selected={muscle === group}
                tone="dark"
                onPress={() => setMuscle(muscle === group ? null : group)}
              />
            ))}
          </ScrollView>
          <AppText variant="label" color={Colors.muted}>
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
    gap: 10,
  },
  header: {
    gap: Spacing.md,
    marginBottom: 4,
  },
  search: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 48,
    paddingHorizontal: 14,
    backgroundColor: Colors.surface,
    borderWidth: BorderWidth.thick,
    borderColor: Colors.border,
    borderRadius: Radii.card,
  },
  searchInput: {
    flex: 1,
    height: "100%",
    color: Colors.text,
    fontFamily: Fonts.body,
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
