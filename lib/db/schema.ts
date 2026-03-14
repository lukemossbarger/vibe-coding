import { pgTable, text, integer, timestamp, boolean, uuid, varchar, primaryKey, index, jsonb, date } from "drizzle-orm/pg-core";

export const menuItems = pgTable("menu_items", {
  id: uuid("id").defaultRandom().primaryKey(),

  // Basic info
  name: varchar("name", { length: 255 }).notNull(),
  diningHall: varchar("dining_hall", { length: 100 }).notNull(),
  mealPeriod: varchar("meal_period", { length: 20 }).notNull(), // breakfast, lunch, dinner
  date: timestamp("date").notNull(),
  station: varchar("station", { length: 100 }), // Area/station in dining hall (e.g., "Grill", "Salad Bar")

  // Nutrition data
  calories: integer("calories"),
  protein: integer("protein"), // grams
  carbs: integer("carbs"), // grams
  fat: integer("fat"), // grams
  fiber: integer("fiber"), // grams
  sugar: integer("sugar"), // grams
  sodium: integer("sodium"), // mg

  // Dietary tags
  isVegetarian: boolean("is_vegetarian").default(false),
  isVegan: boolean("is_vegan").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  isKosher: boolean("is_kosher").default(false),
  isDairyFree: boolean("is_dairy_free").default(false),
  isNutFree: boolean("is_nut_free").default(false),

  // Additional info
  servingSize: varchar("serving_size", { length: 100 }),
  ingredients: text("ingredients"),
  allergens: text("allergens"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),

  // User info (for now, just storing locally - no auth)
  userId: varchar("user_id", { length: 255 }).notNull().unique(),

  // Physical attributes
  height: integer("height"), // inches
  weight: integer("weight"), // lbs
  gender: varchar("gender", { length: 20 }),

  // Nutrition goals
  targetCalories: integer("target_calories"),
  targetProtein: integer("target_protein"),
  targetCarbs: integer("target_carbs"),
  targetFat: integer("target_fat"),

  // Dietary restrictions
  isVegetarian: boolean("is_vegetarian").default(false),
  isVegan: boolean("is_vegan").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  isKosher: boolean("is_kosher").default(false),
  isDairyFree: boolean("is_dairy_free").default(false),
  isNutFree: boolean("is_nut_free").default(false),

  // Preferences
  preferredDiningHalls: text("preferred_dining_halls"), // JSON array
  dislikedIngredients: text("disliked_ingredients"), // JSON array

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// NextAuth.js Tables (for authentication)
// Note: Using nextauth_ prefix to avoid conflicts with Supabase Auth tables
// ============================================

export const users = pgTable("nextauth_users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("emailVerified"),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const accounts = pgTable("nextauth_accounts", {
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  provider: text("provider").notNull(),
  providerAccountId: text("providerAccountId").notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: text("token_type"),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
}, (account) => ({
  compoundKey: primaryKey({ columns: [account.provider, account.providerAccountId] }),
}));

export const sessions = pgTable("nextauth_sessions", {
  sessionToken: text("sessionToken").primaryKey(),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable("nextauth_verification_tokens", {
  identifier: text("identifier").notNull(),
  token: text("token").notNull(),
  expires: timestamp("expires").notNull(),
}, (vt) => ({
  compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
}));

// ============================================
// User Profiles (authenticated users)
// ============================================

export const userProfiles = pgTable("user_profiles", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }).unique(),

  // Physical attributes
  height: integer("height"), // inches
  weight: integer("weight"), // pounds
  age: integer("age"),
  gender: varchar("gender", { length: 20 }),
  activityLevel: varchar("activity_level", { length: 20 }),

  // Fitness goals
  fitnessGoal: varchar("fitness_goal", { length: 50 }),
  targetCalories: integer("target_calories"),
  targetProtein: integer("target_protein"),
  targetCarbs: integer("target_carbs"),
  targetFat: integer("target_fat"),
  targetSugar: integer("target_sugar"),

  // Dietary restrictions (boolean flags)
  isVegetarian: boolean("is_vegetarian").default(false),
  isVegan: boolean("is_vegan").default(false),
  isGlutenFree: boolean("is_gluten_free").default(false),
  isKosher: boolean("is_kosher").default(false),
  isDairyFree: boolean("is_dairy_free").default(false),
  isNutFree: boolean("is_nut_free").default(false),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// ============================================
// Tracked Meals (user meal history)
// ============================================

export const trackedMeals = pgTable("tracked_meals", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  // Menu item data (denormalized for historical accuracy)
  menuItemId: text("menu_item_id").notNull(), // Reference to menu item
  menuItemName: text("menu_item_name").notNull(),
  menuItemData: jsonb("menu_item_data").notNull(), // Full MenuItem object

  // Tracking metadata
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  date: date("date").notNull(), // YYYY-MM-DD for indexing
  source: varchar("source", { length: 20 }).notNull(), // 'recommendation' | 'manual'

  // Future: Rating fields (not implemented yet)
  rating: integer("rating"), // 1-5, nullable
  feedback: text("feedback"),
  ratedAt: timestamp("rated_at"),

  // Timestamps
  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  // Indexes for performance
  userDateIdx: index("tracked_meals_user_date_idx").on(table.userId, table.date),
  dateIdx: index("tracked_meals_date_idx").on(table.date),
}));

// ============================================
// Food Preferences (likes / dislikes)
// ============================================

export const foodPreferences = pgTable("food_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),

  name: varchar("name", { length: 255 }).notNull(), // e.g. "Chicken", "Grilled Salmon"
  type: varchar("type", { length: 10 }).notNull(), // "like" | "dislike"

  createdAt: timestamp("created_at").defaultNow().notNull(),
}, (table) => ({
  userIdx: index("food_prefs_user_idx").on(table.userId),
  uniquePref: index("food_prefs_unique_idx").on(table.userId, table.name, table.type),
}));
