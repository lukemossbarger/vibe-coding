import * as dotenv from "dotenv";
import { scrapeMenuByLocationId, getLocations, getPeriods, findPeriodByName } from "../lib/scraper/dineoncampus";
import { saveDiningHallMenu } from "../lib/scraper/save-to-db";

dotenv.config();

/**
 * Scrapes and saves menu data for specific dining halls
 * This conserves API calls by only scraping what you need
 */
async function main() {
  console.log("🔍 Scraping Northwestern Dining Halls (Smart Mode)\n");

  // Get all locations (1 API call)
  const locations = await getLocations();
  console.log(`Found ${locations.length} locations\n`);

  // Filter to main dining halls only (save API calls)
  const mainDiningHalls = locations.filter((loc) =>
    ["Allison", "Sargent", "Elder", "Plex East", "Plex West"].some((name) =>
      loc.name.includes(name)
    )
  );

  console.log(`Scraping ${mainDiningHalls.length} main dining halls:\n`);
  mainDiningHalls.forEach((hall) => console.log(`  - ${hall.name}`));
  console.log("");

  const today = new Date();
  const mealPeriods: ("breakfast" | "lunch" | "dinner")[] = ["breakfast", "lunch", "dinner"];

  let totalSaved = 0;
  let apiCallsUsed = 1; // Already used 1 for getLocations

  for (const hall of mainDiningHalls) {
    console.log(`\n📋 ${hall.name}`);

    // Get periods for this location (1 API call per location)
    const periods = await getPeriods(hall.id, today);
    apiCallsUsed++;
    console.log(`  Periods: ${periods.map((p) => p.name).join(", ")}`);

    for (const mealPeriod of mealPeriods) {
      const period = findPeriodByName(periods, mealPeriod);
      if (!period) {
        console.log(`  ⏭️  ${mealPeriod}: Not available`);
        continue;
      }

      try {
        // Scrape menu (1 API call per meal period)
        const menu = await scrapeMenuByLocationId(hall.id, hall.name, mealPeriod, today);
        apiCallsUsed++;

        if (menu.items.length === 0) {
          console.log(`  ⏭️  ${mealPeriod}: No items`);
          continue;
        }

        // Save to database
        const saved = await saveDiningHallMenu(menu);
        totalSaved += saved;

        console.log(`  ✅ ${mealPeriod}: Saved ${saved}/${menu.items.length} new items`);
      } catch (error) {
        console.log(`  ❌ ${mealPeriod}: Error - ${error instanceof Error ? error.message : "Unknown"}`);
      }
    }
  }

  console.log("\n" + "=".repeat(60));
  console.log("Summary");
  console.log("=".repeat(60));
  console.log(`API calls used: ${apiCallsUsed}`);
  console.log(`Total items saved: ${totalSaved}`);
  console.log(`Remaining ZenRows requests: ${1000 - 52 - apiCallsUsed}`);
}

main().catch(console.error);
