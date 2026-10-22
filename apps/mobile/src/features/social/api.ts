import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from "@tanstack/react-query";

import { useSession } from "@/features/account/SessionProvider";
import { graphql } from "@/lib/graphql";

export type FeedWorkout = {
  id: string;
  title: string;
  startedAt: string;
  durationSeconds: number;
  volumeKg: number;
  setCount: number;
  likeCount: number;
  likedByMe: boolean;
  user: { id: string; name: string; isMe: boolean };
  exercises: { exerciseId: string; name: string; sets: { id: string }[] }[];
};

type FeedPage = { feed: { items: FeedWorkout[]; nextCursor: string | null } };

export type PersonResult = {
  id: string;
  name: string;
  followedByMe: boolean;
  workoutCount: number;
};

// The query names exactly the fields a feed card renders, and nothing else.
const FEED_QUERY = /* GraphQL */ `
  query Feed($after: String) {
    feed(first: 10, after: $after) {
      nextCursor
      items {
        id
        title
        startedAt
        durationSeconds
        volumeKg
        setCount
        likeCount
        likedByMe
        user {
          id
          name
          isMe
        }
        exercises {
          exerciseId
          name
          sets {
            id
          }
        }
      }
    }
  }
`;

const SEARCH_QUERY = /* GraphQL */ `
  query SearchUsers($query: String!) {
    searchUsers(query: $query) {
      id
      name
      followedByMe
      workoutCount
    }
  }
`;

const SUGGESTED_QUERY = /* GraphQL */ `
  query SuggestedUsers {
    suggestedUsers(first: 12) {
      id
      name
      followedByMe
      workoutCount
    }
  }
`;

export const feedKey = ["feed"] as const;
const peopleKey = ["people"] as const;

export function useFeed() {
  const { user } = useSession();
  return useInfiniteQuery({
    queryKey: feedKey,
    queryFn: ({ pageParam }) =>
      graphql<FeedPage, { after: string | null }>(FEED_QUERY, { after: pageParam }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.feed.nextCursor,
    enabled: user !== null,
  });
}

/**
 * Likes feel instant: the cache is updated before the server answers
 * (optimistic update) and rolled back if the request fails.
 */
export function useToggleLike() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, liked }: { id: string; liked: boolean }) =>
      graphql(
        liked
          ? `mutation($id: ID!) { unlikeWorkout(workoutId: $id) { id } }`
          : `mutation($id: ID!) { likeWorkout(workoutId: $id) { id } }`,
        { id },
      ),
    onMutate: async ({ id, liked }) => {
      await queryClient.cancelQueries({ queryKey: feedKey });
      const previous = queryClient.getQueryData<InfiniteData<FeedPage>>(feedKey);
      queryClient.setQueryData<InfiniteData<FeedPage>>(
        feedKey,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((page) => ({
              feed: {
                ...page.feed,
                items: page.feed.items.map((w) =>
                  w.id === id
                    ? { ...w, likedByMe: !liked, likeCount: w.likeCount + (liked ? -1 : 1) }
                    : w,
                ),
              },
            })),
          },
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(feedKey, context.previous);
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedKey }),
  });
}

export function useSearchPeople(query: string) {
  const trimmed = query.trim();
  return useQuery({
    queryKey: [...peopleKey, "search", trimmed],
    queryFn: () =>
      graphql<{ searchUsers: PersonResult[] }, { query: string }>(SEARCH_QUERY, { query: trimmed }),
    enabled: trimmed.length >= 2,
    select: (data) => data.searchUsers,
  });
}

/** People to follow, the most active first; follows stay in the list until you leave. */
export function useSuggestedPeople() {
  const { user } = useSession();
  return useQuery({
    queryKey: [...peopleKey, "suggested"],
    queryFn: () => graphql<{ suggestedUsers: PersonResult[] }>(SUGGESTED_QUERY),
    enabled: user !== null,
    select: (data) => data.suggestedUsers,
    staleTime: 0,
  });
}

type PeopleData = { searchUsers?: PersonResult[]; suggestedUsers?: PersonResult[] };

function markFollowed(data: PeopleData | undefined, id: string, followedByMe: boolean) {
  if (!data) return data;
  const mark = (list?: PersonResult[]) =>
    list?.map((person) => (person.id === id ? { ...person, followedByMe } : person));
  return {
    ...data,
    ...(data.searchUsers && { searchUsers: mark(data.searchUsers) }),
    ...(data.suggestedUsers && { suggestedUsers: mark(data.suggestedUsers) }),
  };
}

/** Follow flips at once in every list of people and rolls back if the server says no. */
export function useToggleFollow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, following }: { id: string; following: boolean }) =>
      graphql(
        following
          ? `mutation($id: ID!) { unfollow(userId: $id) { id } }`
          : `mutation($id: ID!) { follow(userId: $id) { id } }`,
        { id },
      ),
    onMutate: async ({ id, following }) => {
      await queryClient.cancelQueries({ queryKey: peopleKey });
      const previous = queryClient.getQueriesData<PeopleData>({ queryKey: peopleKey });
      queryClient.setQueriesData<PeopleData>({ queryKey: peopleKey }, (data) =>
        markFollowed(data, id, !following),
      );
      return { previous };
    },
    onError: (_error, _variables, context) => {
      context?.previous.forEach(([key, data]) => queryClient.setQueryData(key, data));
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: feedKey }),
  });
}
