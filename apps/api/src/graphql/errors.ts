import { createGraphQLError } from "graphql-yoga";

/**
 * An error meant for the client. Yoga masks every other error as
 * "Unexpected error." so internals never leak; errors made here pass through.
 */
export function clientError(message: string, code: "BAD_USER_INPUT" | "NOT_FOUND") {
  return createGraphQLError(message, { extensions: { code } });
}
