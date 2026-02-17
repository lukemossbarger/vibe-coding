import { db } from "../lib/db/client";
import { sql } from "drizzle-orm";

async function fixUserProfilesForeignKey() {
  try {
    console.log("Fixing user_profiles foreign key constraint...");

    // Drop the old foreign key constraint
    await db.execute(sql`
      ALTER TABLE user_profiles
      DROP CONSTRAINT IF EXISTS user_profiles_user_id_users_id_fk;
    `);
    console.log("✓ Dropped old foreign key constraint");

    // Drop the old foreign key constraint (alternative name)
    await db.execute(sql`
      ALTER TABLE user_profiles
      DROP CONSTRAINT IF EXISTS user_profiles_user_id_fkey;
    `);
    console.log("✓ Dropped alternative foreign key constraint (if existed)");

    // Add new foreign key constraint pointing to nextauth_users
    await db.execute(sql`
      ALTER TABLE user_profiles
      ADD CONSTRAINT user_profiles_user_id_nextauth_users_id_fk
      FOREIGN KEY (user_id) REFERENCES nextauth_users(id) ON DELETE CASCADE;
    `);
    console.log("✓ Added new foreign key constraint to nextauth_users");

    // Do the same for tracked_meals
    console.log("\nFixing tracked_meals foreign key constraint...");

    await db.execute(sql`
      ALTER TABLE tracked_meals
      DROP CONSTRAINT IF EXISTS tracked_meals_user_id_users_id_fk;
    `);
    console.log("✓ Dropped old foreign key constraint");

    await db.execute(sql`
      ALTER TABLE tracked_meals
      DROP CONSTRAINT IF EXISTS tracked_meals_user_id_fkey;
    `);
    console.log("✓ Dropped alternative foreign key constraint (if existed)");

    await db.execute(sql`
      ALTER TABLE tracked_meals
      ADD CONSTRAINT tracked_meals_user_id_nextauth_users_id_fk
      FOREIGN KEY (user_id) REFERENCES nextauth_users(id) ON DELETE CASCADE;
    `);
    console.log("✓ Added new foreign key constraint to nextauth_users");

    console.log("\n✅ All foreign key constraints fixed!");

  } catch (error) {
    console.error("Error fixing foreign keys:", error);
  } finally {
    process.exit(0);
  }
}

fixUserProfilesForeignKey();
