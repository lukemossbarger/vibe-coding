import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is not set");
}

// `prepare: false` is required for Supabase's transaction-mode connection pooler.
// A single shared instance prevents connection pool exhaustion.
const client = postgres(process.env.DATABASE_URL, {
  prepare: false,
  max: 3,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
