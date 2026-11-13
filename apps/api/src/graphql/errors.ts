import { createGraphQLError } from "graphql-yoga";

/** Reaches the client as is; Yoga masks every other error. */
export function clientError(message: string, code: "BAD_USER_INPUT" | "NOT_FOUND") {
  return createGraphQLError(message, { extensions: { code } });
}
