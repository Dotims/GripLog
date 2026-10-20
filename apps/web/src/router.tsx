import { QueryClient } from "@tanstack/react-query";
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  Outlet,
  redirect,
  useNavigate,
} from "@tanstack/react-router";
import { Suspense } from "react";

import { authClient } from "./lib/auth";
import { feedQuery, myExercisesQuery, workoutQuery } from "./lib/queries";
import { FeedPage } from "./routes/feed";
import { LoginPage } from "./routes/login";
import { ProgressPage } from "./routes/progress";
import { WorkoutPage } from "./routes/workout";

export const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } });

const rootRoute = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  component: () => <Outlet />,
});

const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/login",
  component: LoginPage,
});

/** Every page below needs a session; without one the router sends you to /login before rendering anything. */
const appRoute = createRoute({
  getParentRoute: () => rootRoute,
  id: "app",
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data) throw redirect({ to: "/login" });
    return { user: data.user };
  },
  component: AppLayout,
  errorComponent: ({ error, reset }) => (
    <main className="main">
      <div className="card">
        <p className="eyebrow">Something went wrong</p>
        <p className="error">{error instanceof Error ? error.message : String(error)}</p>
        <button className="button button-secondary" onClick={reset}>
          Try again
        </button>
      </div>
    </main>
  ),
});

function AppLayout() {
  const { user } = appRoute.useRouteContext();
  const navigate = useNavigate();
  return (
    <div className="shell">
      <nav className="sidebar">
        <p className="brand">
          Grip<span>Log</span>
        </p>
        <Link to="/" className="nav-link">
          Feed
        </Link>
        <Link to="/progress" search={{ exercise: undefined }} className="nav-link">
          Progress
        </Link>
        <div className="sidebar-footer">
          <span className="meta">{user.name}</span>
          <button
            className="button button-secondary"
            onClick={async () => {
              await authClient.signOut();
              queryClient.clear();
              navigate({ to: "/login" });
            }}
          >
            Sign out
          </button>
        </div>
      </nav>
      <main className="main">
        <Suspense fallback={<p className="meta">Loading</p>}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}

const feedRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/",
  // Prefetch in the loader, read with useSuspenseInfiniteQuery: no loading flash on navigation.
  loader: ({ context }) => context.queryClient.ensureInfiniteQueryData(feedQuery),
  component: FeedPage,
});

const progressRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/progress",
  validateSearch: (search: Record<string, unknown>): { exercise: string | undefined } => ({
    exercise: typeof search.exercise === "string" ? search.exercise : undefined,
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(myExercisesQuery),
  component: function Progress() {
    const { exercise } = progressRoute.useSearch();
    return <ProgressPage exerciseId={exercise} />;
  },
});

const workoutRoute = createRoute({
  getParentRoute: () => appRoute,
  path: "/workouts/$id",
  loader: ({ context, params }) => context.queryClient.ensureQueryData(workoutQuery(params.id)),
  component: function Workout() {
    const { id } = workoutRoute.useParams();
    return <WorkoutPage id={id} />;
  },
});

const routeTree = rootRoute.addChildren([
  loginRoute,
  appRoute.addChildren([feedRoute, progressRoute, workoutRoute]),
]);

export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
});

// Makes Link, navigate and useParams type-check against the routes above.
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
