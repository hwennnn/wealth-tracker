import { timingSafeEqual } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import express from "express";
import { createDb } from "./db";
import { createRates } from "./rates";
import { INSTRUCTIONS, registerTools } from "./tools";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    console.error(`${name} is required`);
    process.exit(1);
  }
  return value;
}

const token = required("MCP_TOKEN");
if (token.length < 32) {
  console.error("MCP_TOKEN must be at least 32 characters");
  process.exit(1);
}
const db = createDb(required("DATABASE_URL"), required("WEALTH_USER_ID"));
const getRates = createRates(process.env.EXCHANGE_RATE_API_KEY);
const defaultDisplayCurrency = (process.env.DEFAULT_DISPLAY_CURRENCY || "SGD").toUpperCase();
const port = Number(process.env.PORT || 3001);

function authorized(header: string | undefined): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const given = Buffer.from(header.slice(7));
  const expected = Buffer.from(token);
  return given.length === expected.length && timingSafeEqual(given, expected);
}

function buildServer() {
  const server = new McpServer(
    { name: "wealth-tracker", title: "WealthTracker", version: "1.0.0" },
    { instructions: INSTRUCTIONS }
  );
  registerTools(server, { db, getRates, defaultDisplayCurrency });
  return server;
}

const app = express();
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// Stateless Streamable HTTP: a fresh server + transport per request, no sessions to lose on restart.
app.post("/", async (req, res) => {
  if (!authorized(req.headers.authorization)) {
    res.status(401).set("WWW-Authenticate", "Bearer").json({ error: "unauthorized" });
    return;
  }
  const server = buildServer();
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (error) {
    console.error("mcp request failed", error);
    if (!res.headersSent) {
      res.status(500).json({ jsonrpc: "2.0", error: { code: -32603, message: "Internal error" }, id: null });
    }
  }
});

app.all("/", (_req, res) => {
  res.status(405).set("Allow", "POST").json({ error: "Use POST (stateless Streamable HTTP)" });
});

app.listen(port, "0.0.0.0", () => {
  console.log(`wealth-tracker MCP listening on :${port} (display currency ${defaultDisplayCurrency})`);
});

for (const signal of ["SIGTERM", "SIGINT"]) {
  process.on(signal, () => {
    db.close().finally(() => process.exit(0));
  });
}
