import { db } from "../lib/db/client";
import { menuItems } from "../lib/db/schema";
import { sql, or, isNull, not, eq } from "drizzle-orm";

async function cleanupDatabase() {
  console.log("🧹 Cleaning up database...\n");

  // Count items before cleanup
  const beforeCount = await db.select({ count: sql`count(*)` }).from(menuItems);
  console.log(`Items before cleanup: ${beforeCount[0].count}`);

  // Delete items that are not from 02/16/2026 OR don't have station info
  // Delete items where date != 2026-02-16 OR station IS NULL
  const deleted = await db
    .delete(menuItems)
    .where(
      or(
        not(
          sql`DATE(${menuItems.date}) = '2026-02-16'`
        ),
        isNull(menuItems.station)
      )
    );

  // Count items after cleanup
  const afterCount = await db.select({ count: sql`count(*)` }).from(menuItems);
  console.log(`Items after cleanup: ${afterCount[0].count}`);
  console.log(`Items deleted: ${Number(beforeCount[0].count) - Number(afterCount[0].count)}`);

  // Show sample of remaining items
  const sample = await db.select().from(menuItems).limit(5);
  console.log("\nSample of remaining items:");
  sample.forEach((item) => {
    const date = new Date(item.date);
    console.log(
      `- ${item.name} at ${item.diningHall} (${item.station}) - ${date.toLocaleDateString()}`
    );
  });

  console.log("\n✅ Database cleanup complete!");
  process.exit(0);
}

cleanupDatabase();
