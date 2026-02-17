import { auth } from "@/auth";
import { db } from "@/lib/db";
import { trackedMeals } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    // Verify ownership before deleting
    const result = await db
      .delete(trackedMeals)
      .where(
        and(eq(trackedMeals.id, id), eq(trackedMeals.userId, session.user.id))
      )
      .returning();

    if (result.length === 0) {
      return NextResponse.json({ error: "Meal not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Failed to delete meal:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
