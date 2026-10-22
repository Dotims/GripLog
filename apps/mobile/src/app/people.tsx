import { useRouter } from "expo-router";
import { LogIn, UserCheck, UserPlus, Users } from "lucide-react-native";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import Animated, { FadeIn } from "react-native-reanimated";

import {
  AppText,
  Button,
  Card,
  EmptyState,
  Screen,
  SectionLabel,
  TextField,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useSession } from "@/features/account/SessionProvider";
import { Avatar } from "@/features/profile/Avatar";
import { nameInitials } from "@/features/profile/avatar";
import {
  useSearchPeople,
  useSuggestedPeople,
  useToggleFollow,
  type PersonResult,
} from "@/features/social/api";
import { readableError } from "@/lib/api";

function PersonRow({ person, isLast }: { person: PersonResult; isLast: boolean }) {
  const toggle = useToggleFollow();
  const workouts = person.workoutCount === 1 ? "1 workout" : `${person.workoutCount} workouts`;
  return (
    <View style={[styles.row, !isLast && styles.divider]}>
      <Avatar uri={null} initials={nameInitials(person.name)} size={44} />
      <View style={styles.flex}>
        <AppText variant="bold" numberOfLines={1}>
          {person.name}
        </AppText>
        <AppText variant="label" color={Colors.muted}>
          {workouts}
        </AppText>
      </View>
      <Button
        label={person.followedByMe ? "Following" : "Follow"}
        icon={person.followedByMe ? UserCheck : UserPlus}
        size="sm"
        variant={person.followedByMe ? "secondary" : "primary"}
        onPress={() => toggle.mutate({ id: person.id, following: person.followedByMe })}
      />
    </View>
  );
}

function PeopleList({ people }: { people: PersonResult[] }) {
  return (
    <Animated.View entering={FadeIn.duration(200)}>
      <Card style={styles.list}>
        {people.map((person, index) => (
          <PersonRow key={person.id} person={person} isLast={index === people.length - 1} />
        ))}
      </Card>
    </Animated.View>
  );
}

export default function PeopleScreen() {
  const router = useRouter();
  const { user } = useSession();
  const [query, setQuery] = useState("");
  const searching = query.trim().length >= 2;
  const results = useSearchPeople(query);
  const suggested = useSuggestedPeople();
  const shown = searching ? results : suggested;

  if (!user) {
    return (
      <Screen scroll edges={[]}>
        <EmptyState
          icon={Users}
          title="Train with friends"
          message="Sign in to follow friends and see their workouts in your feed."
          action={
            <Button label="Sign in" icon={LogIn} onPress={() => router.replace("/account")} />
          }
        />
      </Screen>
    );
  }

  return (
    <Screen scroll edges={[]}>
      <TextField
        label="Search"
        value={query}
        onChangeText={setQuery}
        placeholder="A friend's name"
        autoCapitalize="words"
        returnKeyType="search"
      />

      <SectionLabel>{searching ? "Results" : "Suggested for you"}</SectionLabel>

      {shown.isLoading ? <ActivityIndicator color={Colors.accent} /> : null}
      {shown.error ? <AppText color={Colors.error}>{readableError(shown.error)}</AppText> : null}
      {shown.data?.length === 0 ? (
        <AppText color={Colors.muted}>
          {searching ? "Nobody by that name yet." : "You already follow everyone here."}
        </AppText>
      ) : null}
      {shown.data && shown.data.length > 0 ? <PeopleList people={shown.data} /> : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: Spacing.md,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    paddingVertical: Spacing.md,
  },
  divider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.hairline,
  },
  flex: {
    flex: 1,
  },
});
