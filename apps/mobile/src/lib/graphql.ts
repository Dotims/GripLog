import { authHeaders } from "@/features/account/auth-client";

import { API_URL } from "./api";

export class GraphQLRequestError extends Error {
  override name = "GraphQLRequestError";
}

/**
 * A tiny GraphQL client: POST the query, return `data`, throw on `errors`.
 * TanStack Query adds the caching, retries and pagination around it, so a
 * full client like Apollo would duplicate what we already have.
 */
export async function graphql<
  TData,
  TVariables extends Record<string, unknown> = Record<string, never>,
>(query: string, variables?: TVariables): Promise<TData> {
  const response = await fetch(`${API_URL}/graphql`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(await authHeaders()) },
    credentials: "include",
    body: JSON.stringify({ query, variables }),
  });
  if (response.status === 401) throw new GraphQLRequestError("Sign in to see the feed");
  const body = (await response.json()) as { data?: TData; errors?: { message: string }[] };
  if (body.errors?.length)
    throw new GraphQLRequestError(body.errors.map((e) => e.message).join("\n"));
  if (!body.data) throw new GraphQLRequestError(`GraphQL request failed with ${response.status}`);
  return body.data;
}
