import { UserCheck, UserPlus } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";

import { AppText, Button, Card, Screen, TextField } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { Avatar } from "@/features/profile/Avatar";
import { initials } from "@/features/profile/avatar";
import { useSearchPeople, useToggleFollow } from "@/features/social/api";

export default function PeopleScreen() {
  const [query, setQuery] = useState("");
  const people = useSearchPeople(query);
  const toggle = useToggleFollow();

  return (
    <Screen scroll edges={[]}>
      <TextField
        label="Search by name"
        value={query}
        onChangeText={setQuery}
        placeholder="At least two letters"
        autoCapitalize="words"
        autoFocus
      />
      {people.isFetching ? <ActivityIndicator color={Colors.accent} /> : null}
      {people.error ? <AppText color={Colors.error}>{people.error.message}</AppText> : null}
      {people.data?.length === 0 ? (
        <AppText color={Colors.muted}>Nobody by that name yet.</AppText>
      ) : null}
      {people.data?.map((person) => (
        <Card key={person.id} style={styles.row}>
          <Avatar uri={null} initials={initials(person.name, "")} size={44} />
          <View style={styles.flex}>
            <AppText variant="bold">{person.name}</AppText>
            <AppText variant="label" color={Colors.muted}>
              {person.workoutCount} workouts
            </AppText>
          </View>
          <Button
            label={person.followedByMe ? "Following" : "Follow"}
            icon={person.followedByMe ? UserCheck : UserPlus}
            size="sm"
            variant={person.followedByMe ? "secondary" : "primary"}
            onPress={() => toggle.mutate({ id: person.id, following: person.followedByMe })}
          />
        </Card>
      ))}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
  },
  flex: {
    flex: 1,
  },
});
