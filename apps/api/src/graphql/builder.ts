import SchemaBuilder from "@pothos/core";

import type { Database } from "../db/client";
import type { SessionUser } from "../http/types";
import type { Loaders } from "./loaders";

export type GraphQLContext = {
  db: Database;
  viewer: SessionUser;
  loaders: Loaders;
};

/**
 * Pothos builds the schema from TypeScript, so resolvers and types cannot
 * drift apart the way a hand-written SDL file and its resolvers can.
 */
export const builder = new SchemaBuilder<{
  Context: GraphQLContext;
  Scalars: { DateTime: { Input: Date; Output: Date } };
  DefaultFieldNullability: false;
}>({
  defaultFieldNullability: false,
});

builder.scalarType("DateTime", {
  serialize: (value) => value.toISOString(),
  parseValue: (value) => new Date(String(value)),
});
