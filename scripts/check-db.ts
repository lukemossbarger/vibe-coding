import { db } from "../lib/db/client";
import { sql } from "drizzle-orm";

async function checkDatabase() {
  try {
    // Check if users table exists and its structure
    const usersColumns = await db.execute(sql`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position;
    `);

    console.log("Users table columns (raw result):");
    console.log(JSON.stringify(usersColumns, null, 2));

    // Check if there are any users
    const users = await db.execute(sql`SELECT * FROM users LIMIT 5;`);
    console.log("\nUsers in database (raw result):");
    console.log(JSON.stringify(users, null, 2));

    // Check sessions
    const sessions = await db.execute(sql`SELECT * FROM sessions LIMIT 5;`);
    console.log("\nSessions in database (raw result):");
    console.log(JSON.stringify(sessions, null, 2));

  } catch (error) {
    console.error("Error:", error);
  } finally {
    process.exit(0);
  }
}

checkDatabase();
