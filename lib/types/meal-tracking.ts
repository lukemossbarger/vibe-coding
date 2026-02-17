// Meal tracking type definitions

// MenuItem type imported from menu-explorer
// (In the future, consider extracting MenuItem to a shared types file)
export interface MenuItem {
  id: string;
  name: string;
  diningHall: string;
  mealPeriod: string;
  date: Date;
  station: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  fiber: number | null;
  sugar: number | null;
  sodium: number | null;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isKosher: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  servingSize: string | null;
  ingredients: string | null;
  allergens: string | null;
}

export interface TrackedMeal {
  id: string; // UUID from database
  userId: string; // User ID from NextAuth session
  menuItem: MenuItem;
  timestamp: number; // Date.now()
  date: string; // YYYY-MM-DD for grouping
  source: 'recommendation' | 'manual'; // Future: distinguish AI picks vs manual adds
}

export interface NutritionTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
}

export interface MealRecommendation {
  menuItemId: string;
  reasoning: string;
}

export interface RecommendationResponse {
  recommendations: MealRecommendation[];
}

export interface MacroProgress {
  calories: { consumed: number; target: number; remaining: number };
  protein: { consumed: number; target: number; remaining: number };
  carbs: { consumed: number; target: number; remaining: number };
  fat: { consumed: number; target: number; remaining: number };
  sugar: { consumed: number; target: number; remaining: number };
}
