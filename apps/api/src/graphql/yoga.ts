import { createYoga } from "graphql-yoga";

import type { GraphQLContext } from "./builder";
import { schema } from "./schema";

/**
 * GraphQL for the social feed: a client asks for exactly the fields a card
 * shows (author, title, top exercises, like count) in one round trip, and new
 * screens need no new endpoint. Sync stays REST, where a fixed command fits better.
 */
export const yoga = createYoga<GraphQLContext>({
  schema,
  graphqlEndpoint: "/graphql",
  graphiql: process.env.NODE_ENV !== "production",
  landingPage: false,
});
