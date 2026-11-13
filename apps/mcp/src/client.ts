/** The slice of the GripLog API the coach needs. An interface, so tests can fake it. */
export type GripLogClient = {
  query<T>(query: string, variables?: Record<string, unknown>): Promise<T>;
};

/** GraphQL client with a session token; the MCP server never reads the database directly. */
export function createGripLogClient(apiUrl: string, token: string): GripLogClient {
  return {
    async query<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
      const response = await fetch(`${apiUrl.replace(/\/$/, "")}/graphql`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ query, variables }),
      });
      if (response.status === 401)
        throw new Error("The GripLog token is missing or expired. Run `npm run token` again.");
      const body = (await response.json()) as { data?: T; errors?: { message: string }[] };
      if (body.errors?.length) throw new Error(body.errors.map((e) => e.message).join("\n"));
      if (!body.data) throw new Error(`GripLog API answered ${response.status}`);
      return body.data;
    },
  };
}
