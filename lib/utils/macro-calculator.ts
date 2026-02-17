import { UserProfile } from '@/lib/types/user-profile';
import { NutritionTotals, MacroProgress } from '@/lib/types/meal-tracking';

export function calculateMacroProgress(
  profile: UserProfile,
  consumed: NutritionTotals
): MacroProgress | null {
  if (!profile.targetCalories || !profile.targetProtein || !profile.targetCarbs || !profile.targetFat) {
    return null;
  }

  const targetSugar = profile.targetSugar ?? 50; // Default 50g daily sugar limit

  return {
    calories: {
      consumed: consumed.calories,
      target: profile.targetCalories,
      remaining: profile.targetCalories - consumed.calories,
    },
    protein: {
      consumed: consumed.protein,
      target: profile.targetProtein,
      remaining: profile.targetProtein - consumed.protein,
    },
    carbs: {
      consumed: consumed.carbs,
      target: profile.targetCarbs,
      remaining: profile.targetCarbs - consumed.carbs,
    },
    fat: {
      consumed: consumed.fat,
      target: profile.targetFat,
      remaining: profile.targetFat - consumed.fat,
    },
    sugar: {
      consumed: consumed.sugar,
      target: targetSugar,
      remaining: targetSugar - consumed.sugar,
    },
  };
}
