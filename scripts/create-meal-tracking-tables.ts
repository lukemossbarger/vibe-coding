import { db } from "../lib/db/client";
import { sql } from "drizzle-orm";

async function createMealTrackingTables() {
  try {
    console.log("Creating meal tracking tables...");

    // Create user_profiles table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS user_profiles (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES nextauth_users(id) ON DELETE CASCADE UNIQUE,
        height INTEGER,
        weight INTEGER,
        age INTEGER,
        gender VARCHAR(20),
        activity_level VARCHAR(20),
        fitness_goal VARCHAR(50),
        target_calories INTEGER,
        target_protein INTEGER,
        target_carbs INTEGER,
        target_fat INTEGER,
        is_vegetarian BOOLEAN DEFAULT FALSE,
        is_vegan BOOLEAN DEFAULT FALSE,
        is_gluten_free BOOLEAN DEFAULT FALSE,
        is_kosher BOOLEAN DEFAULT FALSE,
        is_dairy_free BOOLEAN DEFAULT FALSE,
        is_nut_free BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ user_profiles table created");

    // Create tracked_meals table
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS tracked_meals (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES nextauth_users(id) ON DELETE CASCADE,
        menu_item_id TEXT NOT NULL,
        menu_item_name TEXT NOT NULL,
        menu_item_data JSONB NOT NULL,
        timestamp TIMESTAMP NOT NULL DEFAULT NOW(),
        date DATE NOT NULL,
        source VARCHAR(20) NOT NULL,
        rating INTEGER,
        feedback TEXT,
        rated_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);
    console.log("✓ tracked_meals table created");

    // Create indexes
    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS tracked_meals_user_date_idx ON tracked_meals(user_id, date);
    `);
    console.log("✓ tracked_meals_user_date_idx index created");

    await db.execute(sql`
      CREATE INDEX IF NOT EXISTS tracked_meals_date_idx ON tracked_meals(date);
    `);
    console.log("✓ tracked_meals_date_idx index created");

    console.log("\n✅ All meal tracking tables created successfully!");

  } catch (error) {
    console.error("Error creating tables:", error);
  } finally {
    process.exit(0);
  }
}

createMealTrackingTables();
