import { menuItems, userPreferences } from "./schema";

export type MenuItem = typeof menuItems.$inferSelect;
export type NewMenuItem = typeof menuItems.$inferInsert;

export type UserPreference = typeof userPreferences.$inferSelect;
export type NewUserPreference = typeof userPreferences.$inferInsert;

export type MealPeriod = "breakfast" | "lunch" | "dinner";
export type Gender = "male" | "female" | "other";

export interface NutritionGoals {
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
}

export interface DietaryRestrictions {
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isKosher?: boolean;
  isDairyFree?: boolean;
  isNutFree?: boolean;
}
