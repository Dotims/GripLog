#!/usr/bin/env -S npx tsx
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { createGripLogClient } from "./client";
import { createCoachServer } from "./server";

const apiUrl = process.env.GRIPLOG_API_URL ?? "http://localhost:3000";
const token = process.env.GRIPLOG_TOKEN;
if (!token) {
  console.error(
    "Set GRIPLOG_TOKEN. Get one with: npm run token -w @griplog/mcp -- you@example.com your-password",
  );
  process.exit(1);
}

// stdout carries the MCP protocol, so anything for humans goes to stderr.
await createCoachServer(createGripLogClient(apiUrl, token)).connect(new StdioServerTransport());
console.error(`GripLog coach connected to ${apiUrl}`);
