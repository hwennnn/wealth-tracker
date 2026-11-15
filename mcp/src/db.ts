import pg from "pg";

// `date` columns come back as "YYYY-MM-DD" strings, not JS Dates shifted by the server's timezone.
pg.types.setTypeParser(1082, (value) => value);
// numeric(12,2) comes back as a string by default.
pg.types.setTypeParser(1700, (value) => Number(value));

export type Db = {
  /** Runs `fn` in one transaction as `web_user`, with RLS scoped to the configured user. */
  asUser<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T>;
  userId: string;
  close(): Promise<void>;
};

/**
 * Connects as `authenticator` (the same login PostgREST uses) and switches to `web_user`
 * per transaction, with `request.jwt.claims.sub` set. The existing RLS policies then
 * apply exactly as they do for the web app, so the MCP server cannot see other users' rows.
 */
export function createDb(databaseUrl: string, userId: string): Db {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 5 });
  const claims = JSON.stringify({ sub: userId, role: "web_user" });

  return {
    userId,
    async asUser(fn) {
      const client = await pool.connect();
      try {
        await client.query("BEGIN");
        await client.query("SELECT set_config('request.jwt.claims', $1, true)", [claims]);
        await client.query("SET LOCAL ROLE web_user");
        const result = await fn(client);
        await client.query("COMMIT");
        return result;
      } catch (error) {
        await client.query("ROLLBACK").catch(() => undefined);
        throw error;
      } finally {
        client.release();
      }
    },
    close: () => pool.end(),
  };
}
