import { db } from "@/lib/db/client";
import { menuItems } from "@/lib/db/schema";
import { desc, sql } from "drizzle-orm";
import { MenuExplorer } from "./menu-explorer";
import { UserMenu } from "./components/user-menu";

export const dynamic = "force-dynamic";

async function getMenuData() {
  // Get all menu items with the most recent first
  const rawItems = await db
    .select()
    .from(menuItems)
    .orderBy(desc(menuItems.date), menuItems.diningHall, menuItems.mealPeriod);

  // Convert null dietary flags to false
  const items = rawItems.map((item) => ({
    ...item,
    isVegetarian: item.isVegetarian ?? false,
    isVegan: item.isVegan ?? false,
    isGlutenFree: item.isGlutenFree ?? false,
    isKosher: item.isKosher ?? false,
    isDairyFree: item.isDairyFree ?? false,
    isNutFree: item.isNutFree ?? false,
  }));

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
    <div className="min-h-screen bg-slate-50 dark:bg-black">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-5xl font-bold text-purple-600 dark:bg-gradient-to-r dark:from-[#C9A530] dark:via-[#EDD96A] dark:to-[#B8943A] dark:bg-clip-text dark:text-transparent mb-3">
                Menu Explorer
              </h1>
              <p className="text-lg text-gray-600 dark:text-gray-400 font-medium">
                {data.items.length} items • {data.diningHalls.length} dining halls
              </p>
            </div>
            <UserMenu />
          </div>
        </div>

        <MenuExplorer
          items={data.items}
          diningHalls={data.diningHalls}
        />
      </div>
    </div>
  );
}
