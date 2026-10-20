const endpoint = `${import.meta.env.VITE_API_URL ?? ""}/graphql`;

/** POSTs a query with the session cookie and returns `data`, throwing on GraphQL errors. */
export async function graphql<TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<TData> {
  const response = await fetch(endpoint, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query, variables }),
  });
  const body = (await response.json()) as { data?: TData; errors?: { message: string }[] };
  if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join("\n"));
  if (!body.data) throw new Error(`Request failed with ${response.status}`);
  return body.data;
}
