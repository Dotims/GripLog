# GripLog

Mobile app for people who train at the gym. Compose your own training plans, or let an AI coach build and adapt them for you. Tell it your goal, equipment and schedule, log your sessions, and it adjusts your next workout from your real performance: progressive overload when you beat targets, a deload when you stall.

- Compose training plans yourself (splits, exercises, sets and reps), or generate one with AI
- AI coach builds the best plan from your goal, experience, equipment and days per week
- Fast logging: weight x reps, RPE, rest timer, "same as last time" in one tap
- The plan adapts after every session based on what you actually lifted
- Progress that means something: training volume, estimated 1RM per lift, personal records, charts
- Ask the coach: a chat that knows your full history
- Offline-first, so it works on the gym floor without signal, and syncs to the cloud

## Working agreement (read this first)

This is a **learning project**. I (the repo owner) am building it myself to learn React Native, TypeScript and clean architecture. Your job is to **teach and guide, not to build it for me.**

**Do:**
- Explain concepts, patterns and trade-offs (React Native, Expo Router, state, data, testing).
- Help me design the architecture: where a file belongs, how modules relate, how to name things.
- Review the code I write and point out problems, always with the reasoning behind them.
- When I am stuck, give hints and direction first, then more guidance only if I need it.
- Tell me what to learn next and why.

**Do not:**
- Do not write feature or business-logic code for me (the coaching engine, data layer, hooks, screen logic, stores). I write that myself, by hand.
- Do not hand me finished implementations to paste. Walk me through writing them.
- Do not run ahead or do several steps at once. Keep me in the driver's seat.

**The one exception:**
- **UI code you may generate for me**: presentational components, layout and styling. I will wire up the logic and state myself.

**Style:** act like a patient mentor. Prefer explanations and questions over code. The goal is that I understand and can rewrite everything myself.

When a topic from **Learning goals** (below) comes up, slow down and teach the underlying mechanism, not just the API. These came up in interviews and I need to understand them deeply.

This is also a portfolio project, so quality matters: strict types, tests, CI and clean structure are part of the point.

## Learning goals (practice these deliberately)

These came up in interviews and are a core reason this project exists. Design choices and explanations should exercise each one on purpose, in depth.

1. **Database transactions, in depth.** Not just the definition: ACID, isolation levels (read committed, repeatable read, serializable), locking, and commit vs rollback. Learn to implement a real multi-statement transaction, first in local SQLite, then in Postgres/Supabase, and understand what actually happens underneath. Vehicle: saving a workout together with its sets and any new personal records, all or nothing.
2. **Writing tests, in practice.** How to actually write and structure tests, and how testing is wired into a project: set up Jest and React Native Testing Library from scratch, unit-test the coaching engine, test a component, use mocks, read coverage. Vehicle: the pure `src/lib/coach` engine plus key screens.
3. **CI pipelines (GitHub Actions).** What a pipeline really is: triggers, jobs, steps, runners, caching, status checks, and why it runs on every change. Vehicle: a workflow that runs typecheck, lint and tests on every push and pull request.
4. **REST API vs GraphQL (priority).** A hands-on comparison for client-server communication: many endpoints vs one graph, over-fetching and under-fetching, typing, caching, error handling, and when each one wins. Vehicle: Supabase exposes both REST (PostgREST) and GraphQL on the same database, so read and write some data each way and compare them directly.
5. **Advanced React and state, including Context.** Understand re-render behavior, and deliberately use React Context to feel its trade-offs, then compare Context vs Zustand vs TanStack Query and when to reach for each. Vehicle: put one piece of state (for example an active-workout or settings provider) behind Context, and compare it with a Zustand store.

## Environment and versions

- **Expo SDK 56**, React Native 0.85, React 19, TypeScript 6.
- **expo-router** with file-based routing, **typed routes** and **React Compiler** are enabled.
- Expo changed a lot in recent versions. Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing code, and prefer official Expo modules.
- With React Compiler on, avoid reaching for manual `useMemo`/`useCallback` unless there is a measured reason.

## Stack

Already in the project:
- **Expo + TypeScript** (React Native), Expo Router, React Compiler
- **@expo/ui**, **expo-symbols**, **expo-glass-effect** for native-feeling UI

To add as we build (each with a clear reason):
- **Supabase** (Postgres) for auth, cloud data and sync, plus **Edge Functions** as the AI proxy
- **expo-sqlite** as the local, offline-first store
- **TanStack Query** for server state, **Zustand** for client and session state
- **Free AI**: Groq or Google Gemini free tier, called only from a Supabase Edge Function (key stays on the server), returning structured JSON
- **Coaching engine**: a pure TypeScript module (1RM, progression, deload), fully unit-tested
- **Charts**: react-native-gifted-charts or victory-native
- **Jest + React Native Testing Library** for tests, **GitHub Actions** for CI
- **expo-notifications** for workout reminders (later)

## Decisions worth noting

- **AI is separated from the math.** The AI generates and explains plans in natural language. The deterministic parts (estimated 1RM via Epley/Brzycki, next-session targets, stall and deload detection) live in pure functions that are unit-tested. This keeps the app reliable and testable, and it is the strongest engineering story in the project.
- **Server state and client state are kept apart on purpose** (TanStack Query vs Zustand). Zustand holds the live workout session (current exercise, set, rest timer); TanStack Query owns everything that comes from the backend.
- **Offline-first.** Local SQLite is the source of truth while logging; it syncs to Supabase when online. You should be able to finish a whole workout with no signal.
- **Saving a workout and its sets is one transaction**: all or nothing.
- **The AI key never ships in the app.** It only exists inside the Supabase Edge Function.
- **Strict TypeScript everywhere**, and typed routes from expo-router.
- **REST and GraphQL side by side.** Supabase exposes both on the same database, so part of the data layer uses REST (PostgREST) and part uses GraphQL, on purpose, to compare them for client-server communication.
- **Context vs stores, on purpose.** At least one piece of state goes through React Context so it can be compared directly with Zustand and TanStack Query.

## Project structure (target)

- `src/app/` - screens and navigation (expo-router)
- `src/components/` - reusable presentational UI
- `src/features/<feature>/` - feature modules (hooks, queries, local state)
- `src/lib/coach/` - the pure coaching engine (tested, no React, no I/O)
- `src/lib/db/` - SQLite plus the Supabase data layer
- `src/lib/ai/` - client that calls the Edge Function
- `src/store/` - Zustand stores
- Tests live next to the code they cover, or in `__tests__/`

## Roadmap

1. Core: compose a plan, log a workout, list it (local SQLite, offline-first)
2. Coaching engine (1RM, progression, deload) with the first Jest tests
3. AI plan generation and adaptation (Supabase Edge Function + free LLM)
4. Supabase: auth, RLS, cloud sync
5. Progress: charts, history, personal records
6. AI coach chat with context from your history
7. CI/CD: GitHub Actions (typecheck, lint, Jest), EAS build
8. Polish: empty states, error handling, README with GIFs, deployed demo
9. v2: notifications, a shared or real-time training mode, home-screen widget

## Conventions

- TypeScript strict, no `any`. Keep screens thin; put logic in hooks and in `src/lib`.
- Every pure function in `src/lib/coach` has tests.
- Conventional commits.
- Work on feature branches, never commit straight to `main`.
- Git history stays clean and mine: commits authored by me, no AI attribution anywhere (no `Co-Authored-By`, no "Generated with" lines).
