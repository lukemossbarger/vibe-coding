import { auth } from "@/auth";
import { db } from "@/lib/db";
import { foodPreferences } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const prefs = await db
      .select()
      .from(foodPreferences)
      .where(eq(foodPreferences.userId, session.user.id))
      .orderBy(foodPreferences.createdAt);

    const likes = prefs.filter((p) => p.type === "like").map((p) => p.name);
    const dislikes = prefs.filter((p) => p.type === "dislike").map((p) => p.name);

    return NextResponse.json({ likes, dislikes });
  } catch (error) {
    console.error("Failed to fetch food preferences:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, type } = await request.json();

    if (!name || typeof name !== "string" || !["like", "dislike"].includes(type)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const trimmed = name.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Name cannot be empty" }, { status: 400 });
    }

    // Remove any existing opposite preference for the same name
    await db
      .delete(foodPreferences)
      .where(
        and(
          eq(foodPreferences.userId, session.user.id),
          eq(foodPreferences.name, trimmed)
        )
      );

    // Insert new preference
    await db.insert(foodPreferences).values({
      userId: session.user.id,
      name: trimmed,
      type,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to save food preference:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { name, type } = await request.json();

    if (!name || !["like", "dislike"].includes(type)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    await db
      .delete(foodPreferences)
      .where(
        and(
          eq(foodPreferences.userId, session.user.id),
          eq(foodPreferences.name, name),
          eq(foodPreferences.type, type)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete food preference:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
