import SchemaBuilder from "@pothos/core";

import type { Database } from "../db/client";
import type { SessionUser } from "../http/types";
import type { Loaders } from "./loaders";

export type GraphQLContext = {
  db: Database;
  viewer: SessionUser;
  loaders: Loaders;
};

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
