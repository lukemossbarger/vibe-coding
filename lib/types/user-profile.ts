/**
 * User profile and preferences types
 */

export type FitnessGoal = "lose_weight" | "maintain" | "gain_muscle" | "gain_weight";
export type ActivityLevel = "sedentary" | "light" | "moderate" | "active" | "very_active";
export type Gender = "male" | "female" | "other";

export interface UserProfile {
  // Physical attributes
  height?: number; // in inches
  weight?: number; // in pounds
  age?: number;
  gender?: Gender;
  activityLevel?: ActivityLevel;

  // Fitness goals
  fitnessGoal?: FitnessGoal;

  // Macronutrient targets (in grams per day)
  targetCalories?: number;
  targetProtein?: number;
  targetCarbs?: number;
  targetFat?: number;

  // Dietary restrictions
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  isKosher?: boolean;
  isDairyFree?: boolean;
  isNutFree?: boolean;

  // Preferences
  preferredDiningHalls?: string[];
  dislikedIngredients?: string[];
}

/**
 * Calculate daily calorie needs using Mifflin-St Jeor equation
 */
export function calculateTDEE(profile: UserProfile): number | null {
  if (!profile.weight || !profile.height || !profile.age || !profile.gender) {
    return null;
  }

  // Convert to metric
  const weightKg = profile.weight * 0.453592;
  const heightCm = profile.height * 2.54;

  // Mifflin-St Jeor BMR calculation
  let bmr: number;
  if (profile.gender === "male") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * profile.age + 5;
  } else if (profile.gender === "female") {
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * profile.age - 161;
  } else {
    // Use average for non-binary
    bmr = 10 * weightKg + 6.25 * heightCm - 5 * profile.age - 78;
  }

  // Activity multipliers
  const activityMultipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };

  const multiplier = activityMultipliers[profile.activityLevel || "moderate"];
  return Math.round(bmr * multiplier);
}

/**
 * Calculate macronutrient targets based on fitness goal
 */
export function calculateMacros(
  calories: number,
  goal: FitnessGoal,
  weight: number
): { protein: number; carbs: number; fat: number } {
  const weightKg = weight * 0.453592;

  let proteinRatio: number;
  let fatRatio: number;

  switch (goal) {
    case "lose_weight":
      proteinRatio = 0.35; // 35% protein
      fatRatio = 0.25; // 25% fat
      break;
    case "gain_muscle":
      proteinRatio = 0.30; // 30% protein
      fatRatio = 0.25; // 25% fat
      break;
    case "gain_weight":
      proteinRatio = 0.25; // 25% protein
      fatRatio = 0.30; // 30% fat
      break;
    case "maintain":
    default:
      proteinRatio = 0.30; // 30% protein
      fatRatio = 0.25; // 25% fat
      break;
  }

  const protein = Math.round((calories * proteinRatio) / 4); // 4 cal/g
  const fat = Math.round((calories * fatRatio) / 9); // 9 cal/g
  const carbs = Math.round((calories - protein * 4 - fat * 9) / 4); // Remaining calories

  return { protein, carbs, fat };
}
