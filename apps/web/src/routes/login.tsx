import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";

import { authClient } from "../lib/auth";

export function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signIn" | "signUp">("signIn");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submit = useMutation({
    mutationFn: async () => {
      const { error } =
        mode === "signIn"
          ? await authClient.signIn.email({ email, password })
          : await authClient.signUp.email({ email, password, name });
      if (error) throw new Error(error.message ?? "Something went wrong");
    },
    onSuccess: () => navigate({ to: "/" }),
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    submit.mutate();
  };

  return (
    <main className="login">
      <form className="card" onSubmit={onSubmit}>
        <p className="eyebrow">GripLog</p>
        <h1 className="title">{mode === "signIn" ? "Sign in" : "Join"}</h1>
        {mode === "signUp" ? (
          <label className="field">
            <span className="stat-label">Name</span>
            <input
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </label>
        ) : null}
        <label className="field">
          <span className="stat-label">Email</span>
          <input
            className="input"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </label>
        <label className="field">
          <span className="stat-label">Password</span>
          <input
            className="input"
            type="password"
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>
        {submit.error ? <p className="error">{submit.error.message}</p> : null}
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="button" type="submit" disabled={submit.isPending}>
            {mode === "signIn" ? "Sign in" : "Create account"}
          </button>
          <button
            className="button button-ghost"
            type="button"
            onClick={() => setMode(mode === "signIn" ? "signUp" : "signIn")}
          >
            {mode === "signIn" ? "Create an account" : "I have an account"}
          </button>
        </div>
      </form>
    </main>
  );
}
