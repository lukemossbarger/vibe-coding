import { db } from "@/lib/db/client";
import { menuItems } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { MenuExplorer } from "./menu-explorer";

export const dynamic = "force-dynamic";

async function getMenuData() {
  // Get all menu items with the most recent first
  const items = await db
    .select()
    .from(menuItems)
    .orderBy(desc(menuItems.date), menuItems.diningHall, menuItems.mealPeriod);

  // Get unique dining halls
  const diningHalls = await db
    .selectDistinct({ diningHall: menuItems.diningHall })
    .from(menuItems);

  // Get date range
  const dateRange = await db
    .select({
      minDate: sql`MIN(${menuItems.date})`,
      maxDate: sql`MAX(${menuItems.date})`,
    })
    .from(menuItems);

  return {
    items,
    diningHalls: diningHalls.map((d) => d.diningHall),
    dateRange: dateRange[0],
  };
}

export default async function MenuPage() {
  const data = await getMenuData();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Menu Explorer
          </h1>
          <p className="text-gray-600">
            Browse {data.items.length} menu items across {data.diningHalls.length} dining halls
          </p>
        </div>

        <MenuExplorer
          items={data.items}
          diningHalls={data.diningHalls}
        />
      </div>
    </div>
  );
}
