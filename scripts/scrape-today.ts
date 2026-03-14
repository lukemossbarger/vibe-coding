import * as dotenv from "dotenv";
import { db } from "../lib/db/client";
import { menuItems } from "../lib/db/schema";
import { getLocations, getPeriods, findPeriodByName, scrapeMenuByLocationId } from "../lib/scraper/dineoncampus";
import { saveDiningHallMenu } from "../lib/scraper/save-to-db";
import { lt, gte, or, sql } from "drizzle-orm";

dotenv.config();

// Use today's date dynamically
const now = new Date();
const TARGET_DATE = new Date(now.getFullYear(), now.getMonth(), now.getDate());
const TARGET_DATE_END = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

const DINING_HALLS = ["Allison", "Sargent", "Elder", "Plex East", "Plex West"];

async function main() {
  const dateStr = TARGET_DATE.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" });

  // Step 1: Delete all menu_items NOT from today
  console.log(`🗑️  Clearing menu items not from ${dateStr}...\n`);

  const deleteResult = await db
    .delete(menuItems)
    .where(
      or(
        lt(menuItems.date, TARGET_DATE),
        gte(menuItems.date, TARGET_DATE_END)
      )
    );

  console.log("Deleted old menu items.\n");

  // Step 2: Scrape today's menu
  console.log(`🔍 Scraping Northwestern Dining Halls for ${dateStr}\n`);

  const locations = await getLocations();
  console.log(`Found ${locations.length} locations\n`);

  const mainDiningHalls = locations.filter((loc) =>
    DINING_HALLS.some((name) => loc.name.includes(name))
  );

  if (mainDiningHalls.length < DINING_HALLS.length) {
    console.warn(`⚠️  Expected ${DINING_HALLS.length} dining halls but only found ${mainDiningHalls.length}:`);
    mainDiningHalls.forEach((hall) => console.log(`  - ${hall.name}`));
    console.log("\nMissing halls:");
    DINING_HALLS.filter(
      (name) => !mainDiningHalls.some((hall) => hall.name.includes(name))
    ).forEach((name) => console.log(`  - ${name}`));
    console.log("");
  } else {
    console.log(`Scraping ${mainDiningHalls.length} main dining halls:`);
    mainDiningHalls.forEach((hall) => console.log(`  - ${hall.name}`));
    console.log("");
  }

  const mealPeriods: ("breakfast" | "lunch" | "dinner")[] = ["breakfast", "lunch", "dinner"];
  let totalSaved = 0;
  let apiCallsUsed = 1;

  for (const hall of mainDiningHalls) {
    console.log(`\n📋 ${hall.name}`);

    const periods = await getPeriods(hall.id, TARGET_DATE);
    apiCallsUsed++;
    console.log(`  Periods: ${periods.map((p) => p.name).join(", ")}`);

    for (const mealPeriod of mealPeriods) {
      const period = findPeriodByName(periods, mealPeriod);
      if (!period) {
        console.log(`  ⏭️  ${mealPeriod}: Not available`);
        continue;
      }

      try {
        const menu = await scrapeMenuByLocationId(hall.id, hall.name, mealPeriod, TARGET_DATE);
        apiCallsUsed++;

        if (menu.items.length === 0) {
          console.log(`  ⏭️  ${mealPeriod}: No items`);
          continue;
        }

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
  console.log(`Date: ${dateStr}`);
  console.log(`Dining halls scraped: ${mainDiningHalls.length}/${DINING_HALLS.length}`);
  console.log(`API calls used: ${apiCallsUsed}`);
  console.log(`Total items saved: ${totalSaved}`);

  // Step 3: Verify
  const remaining = await db.select({ count: sql<number>`count(*)` }).from(menuItems);
  console.log(`Total items in database: ${remaining[0].count}`);

  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
