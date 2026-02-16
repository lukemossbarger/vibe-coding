import { db } from "../db/client";
import { menuItems } from "../db/schema";
import { NewMenuItem } from "../db/types";
import { DiningHallMenu, ScrapedMenuItem } from "./dineoncampus";
import { eq, and } from "drizzle-orm";

/**
 * Converts a scraped menu item to a database menu item
 */
function convertToDbMenuItem(
  scrapedItem: ScrapedMenuItem,
  diningHall: string,
  mealPeriod: "breakfast" | "lunch" | "dinner",
  date: Date
): NewMenuItem {
  return {
    name: scrapedItem.name,
    diningHall,
    mealPeriod,
    date,
    station: scrapedItem.station ?? null,

    // Nutrition
    calories: scrapedItem.nutrition?.calories ?? null,
    protein: scrapedItem.nutrition?.protein ?? null,
    carbs: scrapedItem.nutrition?.carbs ?? null,
    fat: scrapedItem.nutrition?.fat ?? null,
    fiber: scrapedItem.nutrition?.fiber ?? null,
    sugar: scrapedItem.nutrition?.sugar ?? null,
    sodium: scrapedItem.nutrition?.sodium ?? null,

    // Dietary tags
    isVegetarian: scrapedItem.dietaryTags?.isVegetarian ?? false,
    isVegan: scrapedItem.dietaryTags?.isVegan ?? false,
    isGlutenFree: scrapedItem.dietaryTags?.isGlutenFree ?? false,
    isKosher: scrapedItem.dietaryTags?.isKosher ?? false,
    isDairyFree: scrapedItem.dietaryTags?.isDairyFree ?? false,
    isNutFree: scrapedItem.dietaryTags?.isNutFree ?? false,

    // Additional info
    servingSize: scrapedItem.servingSize ?? null,
    ingredients: scrapedItem.ingredients ?? null,
    allergens: scrapedItem.allergens?.join(", ") ?? null,
  };
}

/**
 * Saves a dining hall menu to the database
 * Checks for duplicates before inserting
 */
export async function saveDiningHallMenu(menu: DiningHallMenu): Promise<number> {
  let savedCount = 0;

  for (const item of menu.items) {
    const dbItem = convertToDbMenuItem(item, menu.diningHall, menu.mealPeriod, menu.date);

    // Check if item already exists for this date/hall/meal
    const existing = await db.query.menuItems.findFirst({
      where: and(
        eq(menuItems.name, dbItem.name),
        eq(menuItems.diningHall, dbItem.diningHall),
        eq(menuItems.mealPeriod, dbItem.mealPeriod),
        eq(menuItems.date, dbItem.date)
      ),
    });

    if (!existing) {
      await db.insert(menuItems).values(dbItem);
      savedCount++;
    } else {
      console.log(`Item already exists: ${dbItem.name} at ${dbItem.diningHall}`);
    }
  }

  return savedCount;
}

/**
 * Saves multiple dining hall menus to the database
 */
export async function saveMultipleMenus(menus: DiningHallMenu[]): Promise<number> {
  let totalSaved = 0;

  for (const menu of menus) {
    const count = await saveDiningHallMenu(menu);
    totalSaved += count;
    console.log(`Saved ${count} items from ${menu.diningHall} (${menu.mealPeriod})`);
  }

  return totalSaved;
}
