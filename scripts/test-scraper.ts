import * as dotenv from "dotenv";
import {
  getLocations,
  scrapeAllDiningHalls,
  scrapeMenuByLocationId,
} from "../lib/scraper/dineoncampus";

// Load environment variables
dotenv.config();

/**
 * Test script for the dining hall scraper
 * Run with: npx tsx scripts/test-scraper.ts
 */
async function main() {
  console.log("🔍 Testing Northwestern Dining Hall API Scraper\n");

  try {
    // First, fetch all available locations
    console.log("Fetching all dining hall locations...");
    const locations = await getLocations();
    console.log("Raw response:", JSON.stringify(locations, null, 2));
    console.log("Type:", typeof locations);
    console.log("Is Array:", Array.isArray(locations));
    console.log(`✅ Found ${locations?.length || 0} dining locations:\n`);

    locations.forEach((location, i) => {
      console.log(`${i + 1}. ${location.name} (ID: ${location.id})`);
    });

    if (locations.length === 0) {
      console.log("⚠️  No locations found!");
      return;
    }

    // Test scraping a single dining hall
    console.log("\n\nTesting single dining hall scrape (First location, Lunch)...");
    const firstLocation = locations[0];
    const singleMenu = await scrapeMenuByLocationId(
      firstLocation.id,
      firstLocation.name,
      "lunch"
    );

    console.log(`\n📋 ${singleMenu.diningHall} - ${singleMenu.mealPeriod}`);
    console.log(`Date: ${singleMenu.date.toDateString()}`);
    console.log(`Items found: ${singleMenu.items.length}\n`);

    if (singleMenu.items.length > 0) {
      console.log("Sample items (first 5):");
      singleMenu.items.slice(0, 5).forEach((item, i) => {
        console.log(`\n${i + 1}. ${item.name}`);
        if (item.station) {
          console.log(`   Station: ${item.station}`);
        }
        if (item.nutrition?.calories) {
          console.log(`   Calories: ${item.nutrition.calories}`);
        }
        if (item.nutrition?.protein) {
          console.log(`   Protein: ${item.nutrition.protein}g`);
        }
        if (item.nutrition?.carbs) {
          console.log(`   Carbs: ${item.nutrition.carbs}g`);
        }
        if (item.nutrition?.fat) {
          console.log(`   Fat: ${item.nutrition.fat}g`);
        }
        if (item.dietaryTags) {
          const tags = [];
          if (item.dietaryTags.isVegetarian) tags.push("Vegetarian");
          if (item.dietaryTags.isVegan) tags.push("Vegan");
          if (item.dietaryTags.isGlutenFree) tags.push("Gluten-Free");
          if (item.dietaryTags.isKosher) tags.push("Kosher");
          if (tags.length > 0) {
            console.log(`   Tags: ${tags.join(", ")}`);
          }
        }
      });
    } else {
      console.log("⚠️  No items found for this meal period.");
    }

    // Test scraping all dining halls
    console.log("\n\n" + "=".repeat(60));
    console.log("Testing all dining halls scrape (Lunch)...");
    console.log("=".repeat(60) + "\n");
    const allMenus = await scrapeAllDiningHalls("lunch");

    console.log(`\n✅ Successfully scraped ${allMenus.length}/${locations.length} dining halls\n`);

    allMenus.forEach((menu) => {
      console.log(`- ${menu.diningHall}: ${menu.items.length} items`);
    });

    // Summary statistics
    console.log("\n" + "=".repeat(60));
    console.log("Summary Statistics");
    console.log("=".repeat(60));
    const totalItems = allMenus.reduce((sum, menu) => sum + menu.items.length, 0);
    console.log(`Total menu items: ${totalItems}`);
    console.log(`Average items per dining hall: ${(totalItems / allMenus.length).toFixed(1)}`);
  } catch (error) {
    console.error("\n❌ Error testing scraper:", error);
    if (error instanceof Error) {
      console.error("Error message:", error.message);
    }
  }
}

main();
