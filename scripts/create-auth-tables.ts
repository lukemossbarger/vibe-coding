import { db } from "../lib/db/client";
import { sql } from "drizzle-orm";

async function createAuthTables() {
  try {
    console.log("Creating NextAuth tables...");

    // Create nextauth_users table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS nextauth_users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT,
        email TEXT NOT NULL UNIQUE,
        "emailVerified" TIMESTAMP,
        image TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ nextauth_users table created");

    // Create nextauth_accounts table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS nextauth_accounts (
        "userId" UUID NOT NULL REFERENCES nextauth_users(id) ON DELETE CASCADE,
        type TEXT NOT NULL,
        provider TEXT NOT NULL,
        "providerAccountId" TEXT NOT NULL,
        refresh_token TEXT,
        access_token TEXT,
        expires_at INTEGER,
        token_type TEXT,
        scope TEXT,
        id_token TEXT,
        session_state TEXT,
        PRIMARY KEY (provider, "providerAccountId")
      );
    `);
    console.log("✓ nextauth_accounts table created");

    // Create nextauth_sessions table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS nextauth_sessions (
        "sessionToken" TEXT PRIMARY KEY,
        "userId" UUID NOT NULL REFERENCES nextauth_users(id) ON DELETE CASCADE,
        expires TIMESTAMP NOT NULL
      );
    `);
    console.log("✓ nextauth_sessions table created");

    // Create nextauth_verification_tokens table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS nextauth_verification_tokens (
        identifier TEXT NOT NULL,
        token TEXT NOT NULL,
        expires TIMESTAMP NOT NULL,
        PRIMARY KEY (identifier, token)
      );
    `);
    console.log("✓ nextauth_verification_tokens table created");

    console.log("\n✅ All NextAuth tables created successfully!");

  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    process.exit(0);
  }
}

createAuthTables();
