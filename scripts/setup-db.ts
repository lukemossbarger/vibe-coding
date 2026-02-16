import postgres from "postgres";
import * as dotenv from "dotenv";

dotenv.config();

const sql = postgres(process.env.DATABASE_URL!, {
  ssl: "require",
  connection: {
    application_name: "vibe-coding-setup",
  },
});

async function setupDatabase() {
  console.log("🔧 Setting up database tables...\n");

  try {
    // Create menu_items table
    await sql`
      CREATE TABLE IF NOT EXISTS menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        dining_hall VARCHAR(100) NOT NULL,
        meal_period VARCHAR(20) NOT NULL,
        date TIMESTAMP NOT NULL,
        calories INTEGER,
        protein INTEGER,
        carbs INTEGER,
        fat INTEGER,
        fiber INTEGER,
        sugar INTEGER,
        sodium INTEGER,
        is_vegetarian BOOLEAN DEFAULT FALSE,
        is_vegan BOOLEAN DEFAULT FALSE,
        is_gluten_free BOOLEAN DEFAULT FALSE,
        is_kosher BOOLEAN DEFAULT FALSE,
        is_dairy_free BOOLEAN DEFAULT FALSE,
        is_nut_free BOOLEAN DEFAULT FALSE,
        serving_size VARCHAR(100),
        ingredients TEXT,
        allergens TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        UNIQUE(name, dining_hall, meal_period, date)
      )
    `;
    console.log("✅ Created menu_items table");

    // Create user_preferences table
    await sql`
      CREATE TABLE IF NOT EXISTS user_preferences (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR(255) UNIQUE NOT NULL,
        height INTEGER,
        weight INTEGER,
        gender VARCHAR(20),
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
        preferred_dining_halls TEXT,
        disliked_ingredients TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      )
    `;
    console.log("✅ Created user_preferences table");

    // Create indexes
    await sql`CREATE INDEX IF NOT EXISTS idx_menu_items_dining_hall ON menu_items(dining_hall)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_menu_items_date ON menu_items(date)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_menu_items_meal_period ON menu_items(meal_period)`;
    await sql`CREATE INDEX IF NOT EXISTS idx_menu_items_dietary ON menu_items(is_vegetarian, is_vegan, is_gluten_free)`;
    console.log("✅ Created indexes");

    console.log("\n🎉 Database setup complete!");
  } catch (error) {
    console.error("❌ Error setting up database:", error);
    throw error;
  } finally {
    await sql.end();
  }
}

setupDatabase();
