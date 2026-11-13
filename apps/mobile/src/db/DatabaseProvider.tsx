import { Component, createContext, Suspense, use, type ReactNode } from "react";
import { StyleSheet, View } from "react-native";

import { AppText } from "@/components/ui";
import { Colors, Spacing } from "@/constants/theme";

import { prepareDatabase } from "./prepare";
import type { Db } from "./types";

const DatabaseContext = createContext<Db | null>(null);

function ReadyDatabase({ children }: { children: ReactNode }) {
  // Suspends until migrations and seeding finish, behind the splash screen.
  const db = use(prepareDatabase());
  return <DatabaseContext value={db}>{children}</DatabaseContext>;
}

class DatabaseErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  override state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  override render() {
    if (!this.state.error) return this.props.children;
    return (
      <View style={styles.error}>
        <AppText variant="title">Database error</AppText>
        <AppText color={Colors.muted}>{this.state.error.message}</AppText>
      </View>
    );
  }
}

export function DatabaseProvider({ children }: { children: ReactNode }) {
  return (
    <DatabaseErrorBoundary>
      <Suspense fallback={null}>
        <ReadyDatabase>{children}</ReadyDatabase>
      </Suspense>
    </DatabaseErrorBoundary>
  );
}

export function useDatabase(): Db {
  const database = use(DatabaseContext);
  if (!database) throw new Error("useDatabase must be used inside <DatabaseProvider>");
  return database;
}

const styles = StyleSheet.create({
  error: {
    flex: 1,
    justifyContent: "center",
    gap: Spacing.sm,
    padding: Spacing.xl,
    backgroundColor: Colors.background,
  },
});
