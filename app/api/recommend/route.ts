import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { UserProfile } from "@/lib/types/user-profile";

interface MenuItem {
  name: string;
  diningHall: string;
  mealPeriod: string;
  station: string | null;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  sugar: number | null;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isKosher: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  ingredients: string | null;
}

interface ConsumedTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  sugar: number;
}

interface RecommendationRequest {
  userProfile: UserProfile;
  availableItems: MenuItem[];
  diningHall?: string;
  mealPeriod?: string;
  consumedTotals?: ConsumedTotals;
}

async function getRecommendationFromClaude(
  userProfile: UserProfile,
  items: MenuItem[],
  diningHall?: string,
  mealPeriod?: string,
  consumedTotals?: ConsumedTotals
): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = buildPrompt(userProfile, items, diningHall, mealPeriod, consumedTotals);

  const message = await anthropic.messages.create({
    model: "claude-sonnet-4-5-20250929",
    max_tokens: 2000,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = message.content[0];
  if (content.type === "text") {
    return content.text;
  }

  throw new Error("Unexpected response format from Claude");
}

async function getRecommendationFromOpenAI(
  userProfile: UserProfile,
  items: MenuItem[],
  diningHall?: string,
  mealPeriod?: string,
  consumedTotals?: ConsumedTotals
): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = buildPrompt(userProfile, items, diningHall, mealPeriod, consumedTotals);

  const completion = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful nutrition assistant that recommends meals based on user goals and preferences.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    max_tokens: 2000,
  });

  return completion.choices[0].message.content || "No recommendation available.";
}

function formatItemCompact(item: MenuItem): string {
  const parts = [item.name];
  const nutrition: string[] = [];
  if (item.calories) nutrition.push(`${item.calories}cal`);
  if (item.protein) nutrition.push(`${item.protein}gP`);
  if (item.carbs) nutrition.push(`${item.carbs}gC`);
  if (item.fat) nutrition.push(`${item.fat}gF`);
  if (item.sugar) nutrition.push(`${item.sugar}gS`);
  if (nutrition.length > 0) parts.push(`(${nutrition.join("/")})`);

  const tags: string[] = [];
  if (item.isVegetarian) tags.push("V");
  if (item.isVegan) tags.push("VG");
  if (item.isGlutenFree) tags.push("GF");
  if (tags.length > 0) parts.push(`[${tags.join(",")}]`);

  return parts.join(" ");
}

function buildPrompt(
  userProfile: UserProfile,
  items: MenuItem[],
  diningHall?: string,
  mealPeriod?: string,
  consumedTotals?: ConsumedTotals
): string {
  // Calculate per-meal targets (assume 3 meals per day)
  const mealCalTarget = userProfile.targetCalories ? Math.round(userProfile.targetCalories / 3) : null;
  const mealProteinTarget = userProfile.targetProtein ? Math.round(userProfile.targetProtein / 3) : null;
  const mealCarbsTarget = userProfile.targetCarbs ? Math.round(userProfile.targetCarbs / 3) : null;
  const mealFatTarget = userProfile.targetFat ? Math.round(userProfile.targetFat / 3) : null;

  // Build user context
  let userContext = "USER PROFILE:\n";

  if (userProfile.height && userProfile.weight && userProfile.age && userProfile.gender) {
    userContext += `${userProfile.age}yo ${userProfile.gender}, ${userProfile.height}" tall, ${userProfile.weight} lbs\n`;
  }

  if (userProfile.fitnessGoal) {
    const goalDescriptions = {
      lose_weight: "Lose Weight",
      maintain: "Maintain Weight",
      gain_muscle: "Gain Muscle",
      gain_weight: "Gain Weight",
    };
    userContext += `Goal: ${goalDescriptions[userProfile.fitnessGoal]}\n`;
  }

  if (mealCalTarget) {
    userContext += `\nPER-MEAL TARGETS (1/3 of daily):\n`;
    userContext += `~${mealCalTarget} calories`;
    if (mealProteinTarget) userContext += `, ~${mealProteinTarget}g protein`;
    if (mealCarbsTarget) userContext += `, ~${mealCarbsTarget}g carbs`;
    if (mealFatTarget) userContext += `, ~${mealFatTarget}g fat`;
    userContext += `\n`;
  }

  // Dietary restrictions
  const restrictions = [];
  if (userProfile.isVegetarian) restrictions.push("Vegetarian");
  if (userProfile.isVegan) restrictions.push("Vegan");
  if (userProfile.isGlutenFree) restrictions.push("Gluten-Free");
  if (userProfile.isKosher) restrictions.push("Kosher");
  if (userProfile.isDairyFree) restrictions.push("Dairy-Free");
  if (userProfile.isNutFree) restrictions.push("Nut-Free");

  if (restrictions.length > 0) {
    userContext += `Dietary Restrictions: ${restrictions.join(", ")}\n`;
  }

  // Add consumed totals context
  if (consumedTotals && (consumedTotals.calories > 0 || consumedTotals.protein > 0)) {
    userContext += `\nALREADY EATEN TODAY: ${consumedTotals.calories}cal, ${consumedTotals.protein}gP, ${consumedTotals.carbs}gC, ${consumedTotals.fat}gF, ${consumedTotals.sugar}gS\n`;

    if (userProfile.targetCalories) {
      const remainingCal = userProfile.targetCalories - consumedTotals.calories;
      const remainingProtein = (userProfile.targetProtein || 0) - consumedTotals.protein;
      const remainingCarbs = (userProfile.targetCarbs || 0) - consumedTotals.carbs;
      const remainingFat = (userProfile.targetFat || 0) - consumedTotals.fat;
      userContext += `REMAINING TODAY: ${remainingCal}cal, ${remainingProtein}gP, ${remainingCarbs}gC, ${remainingFat}gF\n`;
      userContext += `Adjust this meal's targets to help hit remaining goals.\n`;
    }
  }

  // Group items by station for better organization
  const byStation = new Map<string, MenuItem[]>();
  for (const item of items) {
    const station = item.station || "Other";
    if (!byStation.has(station)) byStation.set(station, []);
    byStation.get(station)!.push(item);
  }

  let menuContext = `\nMENU`;
  if (diningHall) menuContext += ` at ${diningHall}`;
  if (mealPeriod) menuContext += ` (${mealPeriod})`;
  menuContext += `:\n`;

  for (const [station, stationItems] of byStation) {
    menuContext += `\n[${station}]\n`;
    for (const item of stationItems) {
      menuContext += `- ${formatItemCompact(item)}\n`;
    }
  }

  const prompt = `${userContext}
${menuContext}

TASK: Create 4 DIVERSE meal combinations from the menu above. Each meal should be a complete, balanced plate that gets the user roughly 1/3 of their daily macro targets.

CRITICAL DIVERSITY RULES:
- Each meal MUST be built around a DIFFERENT centerpiece protein or main dish (e.g. one with chicken/meat, one with fish, one with a grain bowl, one with eggs/tofu)
- Each meal should feel like a different style of eating (e.g. a hearty protein plate, a lighter grain bowl, a salad-based meal, a comfort food option)
- Do NOT repeat the same side items across all meals. Mix up your sides and accompaniments
- Include vegetables/greens in every meal
- Each meal should combine 3-6 items into a cohesive plate that someone would actually eat together

MACRO RULES:
- Each meal should aim for roughly the per-meal targets listed above
- Prioritize protein-rich centerpieces (chicken, fish, beef, tofu, eggs)
- Balance with carb sources (rice, pasta, bread, grains) and vegetables
- Add a fat source if needed (nuts, avocado, dressing, cheese)

You MUST respond using EXACTLY this format. No other text:

RECOMMENDATION: <creative 3-5 word meal name>
ITEMS: <comma-separated EXACT menu item names copied from the list>
WHY: <2-3 sentences on macros and why this combination works>

RECOMMENDATION: <different style meal name>
ITEMS: <different set of exact menu item names>
WHY: <explanation>

Rules:
- Copy item names EXACTLY as they appear in the menu (spelling, capitalization, everything)
- No markdown (no **, ##, or bullets)
- Start immediately with the first RECOMMENDATION: line
- No introductions, conclusions, or extra commentary`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json();
    const { userProfile, availableItems, diningHall, mealPeriod, consumedTotals } = body;

    if (!availableItems || availableItems.length === 0) {
      return NextResponse.json(
        { error: "No menu items available" },
        { status: 400 }
      );
    }

    let recommendation: string;

    // Try Claude first
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        recommendation = await getRecommendationFromClaude(
          userProfile,
          availableItems,
          diningHall,
          mealPeriod,
          consumedTotals
        );
      } catch (error) {
        console.error("Claude API error:", error);
        // Fall back to OpenAI
        if (process.env.OPENAI_API_KEY) {
          recommendation = await getRecommendationFromOpenAI(
            userProfile,
            availableItems,
            diningHall,
            mealPeriod,
            consumedTotals
          );
        } else {
          throw new Error("No LLM API keys available");
        }
      }
    } else if (process.env.OPENAI_API_KEY) {
      recommendation = await getRecommendationFromOpenAI(
        userProfile,
        availableItems,
        diningHall,
        mealPeriod,
        consumedTotals
      );
    } else {
      return NextResponse.json(
        { error: "No LLM API configured" },
        { status: 500 }
      );
    }

    // Parse structured RECOMMENDATION: / ITEMS: / WHY: format
    const lines = recommendation.split('\n');
    const textRecommendations: { title: string; description: string; items: string[] }[] = [];
    let currentTitle = '';
    let currentItems: string[] = [];
    let currentWhy = '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const recMatch = trimmed.match(/^RECOMMENDATION:\s*(.+)$/i);
      const itemsMatch = trimmed.match(/^ITEMS:\s*(.+)$/i);
      const whyMatch = trimmed.match(/^WHY:\s*(.+)$/i);

      if (recMatch) {
        // Save previous recommendation if exists
        if (currentTitle) {
          textRecommendations.push({
            title: currentTitle,
            description: currentWhy,
            items: currentItems,
          });
        }
        currentTitle = recMatch[1].replace(/\*\*/g, '').trim();
        currentItems = [];
        currentWhy = '';
      } else if (itemsMatch) {
        currentItems = itemsMatch[1]
          .split(',')
          .map((s) => s.replace(/\*\*/g, '').trim())
          .filter((s) => s.length > 0);
      } else if (whyMatch) {
        currentWhy = whyMatch[1].replace(/\*\*/g, '').trim();
      } else if (currentTitle && currentWhy) {
        // Continuation of WHY line
        currentWhy += ' ' + trimmed.replace(/\*\*/g, '');
      }
    }

    // Add last recommendation
    if (currentTitle) {
      textRecommendations.push({
        title: currentTitle,
        description: currentWhy,
        items: currentItems,
      });
    }

    if (textRecommendations.length > 0) {
      return NextResponse.json({
        recommendations: textRecommendations,
        fullText: recommendation
      });
    }

    // Fallback: return full text
    return NextResponse.json({
      fullText: recommendation
    });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}
