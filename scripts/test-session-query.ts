import { db } from "../lib/db/client";
import { sql } from "drizzle-orm";

async function testSessionQuery() {
  try {
    const result = await db.execute(sql`
      SELECT
        nextauth_sessions."sessionToken",
        nextauth_sessions."userId",
        nextauth_sessions.expires,
        nextauth_users.id,
        nextauth_users.name,
        nextauth_users.email,
        nextauth_users."emailVerified",
        nextauth_users.image,
        nextauth_users.created_at
      FROM nextauth_sessions
      INNER JOIN nextauth_users ON nextauth_users.id = nextauth_sessions."userId"
      WHERE nextauth_sessions."sessionToken" = 'f1b06b8d-e280-4e9a-8724-a1b506a0ba29'
    `);

    console.log("Query succeeded!");
    console.log(JSON.stringify(result, null, 2));
  } catch (error) {
    console.error("Query failed:", error);
  } finally {
    process.exit(0);
  }
}

testSessionQuery();
