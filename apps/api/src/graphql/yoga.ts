import { createYoga } from "graphql-yoga";

import type { GraphQLContext } from "./builder";
import { schema } from "./schema";

export const yoga = createYoga<GraphQLContext>({
  schema,
  graphqlEndpoint: "/graphql",
  graphiql: process.env.NODE_ENV !== "production",
  landingPage: false,
});
