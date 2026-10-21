import { createContext, use, type ReactNode } from "react";

import { readableError } from "@/lib/api";

import { authClient } from "./auth-client";

type SessionUser = { id: string; name: string; email: string };

type Session = {
  user: SessionUser | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<string | null>;
  signUp: (name: string, email: string, password: string) => Promise<string | null>;
  signOut: () => Promise<void>;
};

/**
 * Who is signed in. Context fits: read across the app, changes on sign in and
 * sign out only. The app works fully without an account; signing in only
 * turns on sync and the social feed.
 */
const SessionContext = createContext<Session | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const { data, isPending } = authClient.useSession();

  const value: Session = {
    user: data?.user ? { id: data.user.id, name: data.user.name, email: data.user.email } : null,
    isLoading: isPending,
    // Both return an error message, or null on success.
    signIn: async (email, password) => {
      const { error } = await authClient.signIn.email({ email, password });
      return error ? readableError(error.message, "Could not sign in") : null;
    },
    signUp: async (name, email, password) => {
      const { error } = await authClient.signUp.email({ name, email, password });
      return error ? readableError(error.message, "Could not create the account") : null;
    },
    signOut: async () => {
      await authClient.signOut();
    },
  };

  return <SessionContext value={value}>{children}</SessionContext>;
}

export function useSession(): Session {
  const session = use(SessionContext);
  if (!session) throw new Error("useSession must be used inside <SessionProvider>");
  return session;
}
