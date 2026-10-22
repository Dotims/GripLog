import { formatClock, type WeightUnit } from "@griplog/core";
import Constants from "expo-constants";
import { useRouter } from "expo-router";
import { Cloud, Minus, Plus, Target, Upload } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, Switch, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  IconButton,
  Screen,
  SectionLabel,
  SegmentedControl,
  TextField,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { useProfile } from "@/features/profile/hooks";
import { usePreferences } from "@/features/profile/PreferencesProvider";
import { updateProfile } from "@/features/profile/repository";

const UNITS = [
  { value: "kg", label: "Kilograms" },
  { value: "lb", label: "Pounds" },
] as const;

const REST_STEP = 15;

export default function SettingsScreen() {
  const router = useRouter();
  const db = useDatabase();
  const profile = useProfile();
  const {
    unit,
    setUnit,
    defaultRestSeconds,
    setDefaultRestSeconds,
    soundsEnabled,
    setSoundsEnabled,
  } = usePreferences();
  const [firstName, setFirstName] = useState(profile?.firstName ?? "");
  const [lastName, setLastName] = useState(profile?.lastName ?? "");
  const [bio, setBio] = useState(profile?.bio ?? "");

  const dirty =
    firstName !== (profile?.firstName ?? "") ||
    lastName !== (profile?.lastName ?? "") ||
    bio !== (profile?.bio ?? "");

  return (
    <Screen scroll edges={[]}>
      <SectionLabel>Profile</SectionLabel>
      <View style={styles.row}>
        <View style={styles.flex}>
          <TextField
            label="First name"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />
        </View>
        <View style={styles.flex}>
          <TextField
            label="Last name"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </View>
      </View>
      <TextField
        label="Bio"
        value={bio}
        onChangeText={setBio}
        multiline
        maxLength={300}
        placeholder="Chasing a 100 kg bench."
      />
      <Button
        label="Save profile"
        disabled={!dirty}
        onPress={() =>
          updateProfile(db, {
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            bio: bio.trim() || null,
          })
        }
      />

      <SectionLabel>Units</SectionLabel>
      <SegmentedControl<WeightUnit> options={UNITS} value={unit} onChange={setUnit} />

      <SectionLabel>Default rest timer</SectionLabel>
      <Card style={styles.rest}>
        <IconButton
          icon={Minus}
          label="Shorter rest"
          onPress={() => setDefaultRestSeconds(Math.max(0, defaultRestSeconds - REST_STEP))}
        />
        <AppText variant="number">
          {defaultRestSeconds === 0 ? "Off" : formatClock(defaultRestSeconds)}
        </AppText>
        <IconButton
          icon={Plus}
          label="Longer rest"
          onPress={() => setDefaultRestSeconds(Math.min(600, defaultRestSeconds + REST_STEP))}
        />
      </Card>

      <SectionLabel>Sounds</SectionLabel>
      <Card style={styles.toggle}>
        <View style={styles.flex}>
          <AppText variant="bold">Sound effects</AppText>
          <AppText variant="label" color={Colors.muted}>
            A tick for each set, a chime when rest is over, a fanfare for records. Quiet when the
            phone is on silent.
          </AppText>
        </View>
        <Switch
          value={soundsEnabled}
          onValueChange={setSoundsEnabled}
          trackColor={{ false: Colors.surfaceAlt, true: Colors.accent }}
          thumbColor={Colors.text}
          accessibilityLabel="Sound effects"
        />
      </Card>

      <SectionLabel>Goals</SectionLabel>
      <Button
        label="Weekly goal and lift goal"
        icon={Target}
        variant="secondary"
        onPress={() => router.push("/goals")}
      />

      <SectionLabel>Account</SectionLabel>
      <Button
        label="Account and sync"
        icon={Cloud}
        variant="secondary"
        onPress={() => router.push("/account")}
      />

      <SectionLabel>Data</SectionLabel>
      <Button
        label="Import from Hevy"
        icon={Upload}
        variant="secondary"
        onPress={() => router.push("/import")}
      />

      <AppText variant="label" color={Colors.muted} align="center" style={styles.version}>
        GripLog {Constants.expoConfig?.version ?? ""}
      </AppText>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  flex: {
    flex: 1,
  },
  rest: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: Spacing.md,
  },
  toggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  version: {
    marginTop: Spacing.xl,
  },
});
