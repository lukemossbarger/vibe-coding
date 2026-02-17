import { db } from "../lib/db/client";
import { sql } from "drizzle-orm";

async function checkNextAuthTables() {
  try {
    console.log("=== Checking NextAuth Tables ===\n");

    // Check nextauth_users
    const users = await db.execute(sql`SELECT * FROM nextauth_users ORDER BY created_at DESC LIMIT 5;`);
    console.log("Users in nextauth_users:");
    console.log(JSON.stringify(users, null, 2));

    // Check nextauth_sessions
    const sessions = await db.execute(sql`SELECT * FROM nextauth_sessions ORDER BY expires DESC LIMIT 5;`);
    console.log("\nSessions in nextauth_sessions:");
    console.log(JSON.stringify(sessions, null, 2));

    // Check nextauth_accounts
    const accounts = await db.execute(sql`SELECT * FROM nextauth_accounts LIMIT 5;`);
    console.log("\nAccounts in nextauth_accounts:");
    console.log(JSON.stringify(accounts, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkNextAuthTables();
