import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userProfiles } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

// Only allow fields that exist in the userProfiles schema
const ALLOWED_PROFILE_FIELDS = [
  "height", "weight", "age", "gender", "activityLevel",
  "fitnessGoal", "targetCalories", "targetProtein", "targetCarbs", "targetFat", "targetSugar",
  "isVegetarian", "isVegan", "isGlutenFree", "isKosher", "isDairyFree", "isNutFree",
] as const;

function sanitizeProfileInput(raw: Record<string, unknown>) {
  const sanitized: Record<string, unknown> = {};
  for (const key of ALLOWED_PROFILE_FIELDS) {
    if (key in raw) {
      sanitized[key] = raw[key];
    }
  }
  return sanitized;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    return NextResponse.json({ profile: profile || null });
  } catch (error) {
    console.error("Failed to fetch profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const raw = await request.json();
    const body = sanitizeProfileInput(raw);

    // Check if profile exists
    const [existing] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, session.user.id))
      .limit(1);

    let profile;
    if (existing) {
      // Update
      [profile] = await db
        .update(userProfiles)
        .set({ ...body, updatedAt: new Date() })
        .where(eq(userProfiles.userId, session.user.id))
        .returning();
    } else {
      // Insert
      [profile] = await db
        .insert(userProfiles)
        .values({ userId: session.user.id, ...body })
        .returning();
    }

    return NextResponse.json({ profile });
  } catch (error) {
    console.error("Failed to save profile:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
