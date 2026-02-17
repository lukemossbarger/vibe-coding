import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trackedMeals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const date = searchParams.get("date") || new Date().toISOString().split("T")[0];

  try {
    const meals = await db
      .select()
      .from(trackedMeals)
      .where(and(eq(trackedMeals.userId, session.user.id), eq(trackedMeals.date, date)));

    // Parse menuItemData from JSONB
    const parsedMeals = meals.map((meal) => ({
      id: meal.id,
      userId: meal.userId,
      menuItem: meal.menuItemData as any, // MenuItem object
      timestamp: meal.timestamp.getTime(),
      date: meal.date,
      source: meal.source,
    }));

    return NextResponse.json({ meals: parsedMeals });
  } catch (error) {
    console.error("Failed to fetch meals:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { menuItem, source, timestamp, date } = body;

    const [meal] = await db
      .insert(trackedMeals)
      .values({
        userId: session.user.id,
        menuItemId: menuItem.id,
        menuItemName: menuItem.name,
        menuItemData: menuItem, // Store full object as JSONB
        timestamp: new Date(timestamp),
        date,
        source: source || "manual",
      })
      .returning();

    return NextResponse.json({
      meal: {
        id: meal.id,
        userId: meal.userId,
        menuItem: meal.menuItemData,
        timestamp: meal.timestamp.getTime(),
        date: meal.date,
        source: meal.source,
      },
    });
  } catch (error) {
    console.error("Failed to add meal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
