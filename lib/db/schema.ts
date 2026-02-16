import { pgTable, text, integer, timestamp, boolean, uuid, varchar } from "drizzle-orm/pg-core";

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
