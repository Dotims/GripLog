import { useMutation } from "@tanstack/react-query";
import { CloudUpload, LogOut, RefreshCw } from "lucide-react-native";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

import {
  AppText,
  Button,
  Card,
  Screen,
  SectionLabel,
  SegmentedControl,
  Stat,
  TextField,
} from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";
import { useDatabase } from "@/db/DatabaseProvider";
import { useLiveQuery } from "@/db/use-live-query";
import { syncOutbox } from "@/db/schema";
import { useSession } from "@/features/account/SessionProvider";
import { blockedChanges, pendingChangeCount } from "@/features/sync/outbox";
import { runSync, useSyncState } from "@/features/sync/sync-state";
import { readableError } from "@/lib/api";
import { formatTime } from "@/lib/dates";
import { queryClient } from "@/lib/query-client";

const MODES = [
  { value: "signIn", label: "Sign in" },
  { value: "signUp", label: "Create account" },
] as const;

export default function AccountScreen() {
  const { user } = useSession();
  return (
    <Screen scroll edges={[]}>
      {user ? <SignedIn /> : <SignInForm />}
    </Screen>
  );
}

function SignInForm() {
  const { signIn, signUp } = useSession();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // A mutation gives loading and error state for free, without hand-rolled flags.
  const submit = useMutation({
    mutationFn: async () => {
      const error =
        mode === "signIn"
          ? await signIn(email.trim(), password)
          : await signUp(name.trim(), email.trim(), password);
      if (error) throw new Error(error);
    },
  });

  return (
    <>
      <Card style={styles.card}>
        <AppText variant="heading">Your data stays on this phone</AppText>
        <AppText color={Colors.muted}>
          An account is optional. It backs your workouts up, keeps them in sync across devices and
          lets friends follow your training.
        </AppText>
      </Card>
      <SegmentedControl options={MODES} value={mode} onChange={setMode} />
      {mode === "signUp" ? (
        <TextField label="Name" value={name} onChangeText={setName} autoCapitalize="words" />
      ) : null}
      <TextField
        label="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <TextField
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
      />
      {submit.error ? <AppText color={Colors.error}>{readableError(submit.error)}</AppText> : null}
      <Button
        label={mode === "signIn" ? "Sign in" : "Create account"}
        size="lg"
        loading={submit.isPending}
        disabled={!email || password.length < 8 || (mode === "signUp" && !name)}
        onPress={() => submit.mutate()}
      />
    </>
  );
}

function SignedIn() {
  const db = useDatabase();
  const { user, signOut } = useSession();
  const { status, lastSyncedAt, lastError } = useSyncState();
  const pending = useLiveQuery(() => pendingChangeCount(db), [syncOutbox]);
  const blocked = useLiveQuery(() => blockedChanges(db).length, [syncOutbox]);

  const syncNow = useMutation({
    mutationFn: () => runSync(db),
    // New data from the server makes the social feed stale.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["feed"] }),
  });

  return (
    <>
      <Card style={styles.card}>
        <AppText variant="label" color={Colors.muted}>
          Signed in as
        </AppText>
        <AppText variant="title">{user?.name}</AppText>
        <AppText color={Colors.muted}>{user?.email}</AppText>
      </Card>

      <SectionLabel>Sync</SectionLabel>
      <Card style={styles.stats}>
        <Stat label="Waiting" value={String(pending)} unit={pending === 1 ? "change" : "changes"} />
        <Stat
          label="Last sync"
          value={
            status === "syncing"
              ? "now"
              : lastSyncedAt
                ? formatTime(new Date(lastSyncedAt).toISOString())
                : "-"
          }
        />
      </Card>
      {blocked > 0 ? (
        <AppText color={Colors.muted}>
          {blocked} {blocked === 1 ? "change has" : "changes have"} values the server does not
          accept and {blocked === 1 ? "waits" : "wait"} until you edit{" "}
          {blocked === 1 ? "it" : "them"}.
        </AppText>
      ) : null}
      {status === "error" && lastError ? (
        <View style={styles.error}>
          <CloudUpload color={Colors.error} size={18} strokeWidth={2} />
          <AppText color={Colors.error} style={styles.flex}>
            {lastError}. Changes stay queued and go out next time.
          </AppText>
        </View>
      ) : null}
      <Button
        label="Sync now"
        icon={RefreshCw}
        size="lg"
        loading={syncNow.isPending || status === "syncing"}
        onPress={() => syncNow.mutate()}
      />
      <Button label="Sign out" icon={LogOut} variant="danger" onPress={signOut} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  stats: {
    flexDirection: "row",
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  error: {
    flexDirection: "row",
    gap: Spacing.sm,
    alignItems: "flex-start",
  },
  flex: {
    flex: 1,
  },
});
