import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import OpenAI from "openai";
import { UserProfile } from "@/lib/types/user-profile";

interface MenuItem {
  name: string;
  diningHall: string;
  mealPeriod: string;
  calories: number | null;
  protein: number | null;
  carbs: number | null;
  fat: number | null;
  isVegetarian: boolean;
  isVegan: boolean;
  isGlutenFree: boolean;
  isKosher: boolean;
  isDairyFree: boolean;
  isNutFree: boolean;
  ingredients: string | null;
}

interface RecommendationRequest {
  userProfile: UserProfile;
  availableItems: MenuItem[];
  diningHall?: string;
  mealPeriod?: string;
}

async function getRecommendationFromClaude(
  userProfile: UserProfile,
  items: MenuItem[],
  diningHall?: string,
  mealPeriod?: string
): Promise<string> {
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  const prompt = buildPrompt(userProfile, items, diningHall, mealPeriod);

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
  mealPeriod?: string
): Promise<string> {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = buildPrompt(userProfile, items, diningHall, mealPeriod);

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

function buildPrompt(
  userProfile: UserProfile,
  items: MenuItem[],
  diningHall?: string,
  mealPeriod?: string
): string {
  // Build user context
  let userContext = "User Profile:\n";

  if (userProfile.height && userProfile.weight && userProfile.age && userProfile.gender) {
    userContext += `- ${userProfile.age} year old ${userProfile.gender}, ${userProfile.height}" tall, ${userProfile.weight} lbs\n`;
  }

  if (userProfile.fitnessGoal) {
    const goalDescriptions = {
      lose_weight: "Lose Weight",
      maintain: "Maintain Weight",
      gain_muscle: "Gain Muscle",
      gain_weight: "Gain Weight",
    };
    userContext += `- Goal: ${goalDescriptions[userProfile.fitnessGoal]}\n`;
  }

  if (userProfile.targetCalories) {
    userContext += `- Daily Calorie Target: ${userProfile.targetCalories} calories\n`;
  }

  if (userProfile.targetProtein || userProfile.targetCarbs || userProfile.targetFat) {
    userContext += `- Macro Targets: `;
    const macros = [];
    if (userProfile.targetProtein) macros.push(`${userProfile.targetProtein}g protein`);
    if (userProfile.targetCarbs) macros.push(`${userProfile.targetCarbs}g carbs`);
    if (userProfile.targetFat) macros.push(`${userProfile.targetFat}g fat`);
    userContext += macros.join(", ") + "\n";
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
    userContext += `- Dietary Restrictions: ${restrictions.join(", ")}\n`;
  }

  if (userProfile.dislikedIngredients && userProfile.dislikedIngredients.length > 0) {
    userContext += `- Dislikes: ${userProfile.dislikedIngredients.join(", ")}\n`;
  }

  // Build menu context
  let menuContext = `\nAvailable Menu Items`;
  if (diningHall) menuContext += ` at ${diningHall}`;
  if (mealPeriod) menuContext += ` for ${mealPeriod}`;
  menuContext += `:\n\n`;

  items.forEach((item, index) => {
    menuContext += `${index + 1}. ${item.name}`;
    if (item.station) {
      menuContext += ` [Station: ${item.station}]`;
    }
    menuContext += ` (${item.diningHall} - ${item.mealPeriod})\n`;

    if (item.calories || item.protein || item.carbs || item.fat) {
      menuContext += `   Nutrition: `;
      const nutrition = [];
      if (item.calories) nutrition.push(`${item.calories} cal`);
      if (item.protein) nutrition.push(`${item.protein}g protein`);
      if (item.carbs) nutrition.push(`${item.carbs}g carbs`);
      if (item.fat) nutrition.push(`${item.fat}g fat`);
      menuContext += nutrition.join(", ") + "\n";
    }

    const tags = [];
    if (item.isVegetarian) tags.push("Vegetarian");
    if (item.isVegan) tags.push("Vegan");
    if (item.isGlutenFree) tags.push("Gluten-Free");
    if (item.isKosher) tags.push("Kosher");
    if (tags.length > 0) {
      menuContext += `   Tags: ${tags.join(", ")}\n`;
    }

    if (item.ingredients) {
      menuContext += `   Ingredients: ${item.ingredients}\n`;
    }

    menuContext += "\n";
  });

  const prompt = `${userContext}\n${menuContext}

Based on the user's profile and goals, recommend 3-5 specific meals from the available menu that would best support their nutrition goals. For each recommendation:

1. **Specify the exact station/area** to get each item from (shown in [Station: ...])
2. Explain why it's a good choice for their goals
3. Highlight the key nutritional benefits
4. Suggest portion sizes or combinations if appropriate
5. Note any considerations (e.g., "pairs well with...", "good pre/post workout option")

Be specific about which menu items to choose, **where to find them in the dining hall**, and provide practical, actionable advice. Focus on meals that align with their calorie and macro targets while respecting dietary restrictions.`;

  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const body: RecommendationRequest = await request.json();
    const { userProfile, availableItems, diningHall, mealPeriod } = body;

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
          mealPeriod
        );
      } catch (error) {
        console.error("Claude API error:", error);
        // Fall back to OpenAI
        if (process.env.OPENAI_API_KEY) {
          recommendation = await getRecommendationFromOpenAI(
            userProfile,
            availableItems,
            diningHall,
            mealPeriod
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
        mealPeriod
      );
    } else {
      return NextResponse.json(
        { error: "No LLM API configured" },
        { status: 500 }
      );
    }

    return NextResponse.json({ recommendation });
  } catch (error) {
    console.error("Recommendation error:", error);
    return NextResponse.json(
      { error: "Failed to generate recommendation" },
      { status: 500 }
    );
  }
}
