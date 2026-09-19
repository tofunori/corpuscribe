#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { CorpusDatabase } from "./database.js";

function databasePath(): string {
  const argumentIndex = process.argv.indexOf("--database");
  const fromArgument = argumentIndex >= 0 ? process.argv[argumentIndex + 1] : undefined;
  const path = fromArgument ?? process.env.CORPUSCRIBE_DB;
  if (!path) {
    throw new Error("Set CORPUSCRIBE_DB or pass --database /absolute/path/to/linguistic.sqlite");
  }
  return path;
}

function result(value: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(value, null, 2) }],
    structuredContent: { result: value },
  };
}

const rhetoricalFilter = z.object({
  label: z.string().min(1).describe("Jev label, for example certainty or estimated"),
  choice: z.string().min(1).describe("Required choice, for example possible or present"),
  minProbability: z.number().min(0).max(1).default(0.5),
});

const corpus = new CorpusDatabase(databasePath());
const server = new McpServer({ name: "corpuscribe", version: "0.1.0" });

server.registerTool(
  "corpus_status",
  {
    description: "Return corpus coverage and the number of synchronized Jev labels.",
    inputSchema: z.object({}),
  },
  async () => result(corpus.status()),
);

server.registerTool(
  "corpus_search",
  {
    description: "Find sourced sentences containing an exact word or phrase, optionally filtered by Jev labels.",
    inputSchema: z.object({
      query: z.string().min(1),
      limit: z.number().int().min(1).max(50).default(10),
      rhetoricalFilters: z.array(rhetoricalFilter).max(8).default([]),
    }),
  },
  async ({ query, limit, rhetoricalFilters }) => result(corpus.search(query, limit, rhetoricalFilters)),
);

server.registerTool(
  "terminology_compare",
  {
    description: "Compare the prevalence of two to six terms and return sourced examples for each.",
    inputSchema: z.object({ terms: z.array(z.string().min(1)).min(2).max(6) }),
  },
  async ({ terms }) => result(corpus.compareTerms(terms)),
);

const transport = new StdioServerTransport();
await server.connect(transport);

process.on("SIGINT", () => {
  corpus.close();
  process.exit(0);
});
