import * as dotenv from "dotenv";
import {
  getLocations,
  getPeriods,
  getMenu,
  findPeriodByName,
} from "../lib/scraper/dineoncampus";

// Load environment variables
dotenv.config();

/**
 * Simple test for a single dining hall
 */
async function main() {
  console.log("🔍 Testing Allison Dining Commons\n");

  try {
    // Get all locations
    const locations = await getLocations();
    const allison = locations.find((l) => l.name.includes("Allison"));

    if (!allison) {
      console.log("❌ Allison not found!");
      return;
    }

    console.log(`Found: ${allison.name} (ID: ${allison.id})\n`);

    // Get periods for today
    const today = new Date();
    console.log(`Date: ${today.toDateString()}\n`);

    const periods = await getPeriods(allison.id, today);
    console.log(`Periods available: ${periods.map((p) => p.name).join(", ")}\n`);

    // Get lunch
    const lunchPeriod = findPeriodByName(periods, "lunch");
    if (!lunchPeriod) {
      console.log("❌ No lunch period found!");
      return;
    }

    console.log(`Lunch period ID: ${lunchPeriod.id}\n`);

    // Get menu items
    console.log("Fetching menu items...\n");
    const items = await getMenu(allison.id, lunchPeriod.id, today);

    console.log(`✅ Found ${items.length} items\n`);

    if (items.length > 0) {
      console.log("First 5 items:");
      items.slice(0, 5).forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.name}`);
        if (item.station) console.log(`   Station: ${item.station}`);
        if (item.nutrition?.calories) console.log(`   Calories: ${item.nutrition.calories}`);
        if (item.nutrition?.protein) console.log(`   Protein: ${item.nutrition.protein}g`);
      });
    }
  } catch (error) {
    console.error("\n❌ Error:", error);
  }
}

main();
