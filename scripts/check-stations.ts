import { db } from "../lib/db/client";
import { menuItems } from "../lib/db/schema";
import { isNotNull, sql } from "drizzle-orm";

async function checkStations() {
  const itemsWithStation = await db
    .select()
    .from(menuItems)
    .where(isNotNull(menuItems.station))
    .limit(5);

  console.log("Sample items with station data:");
  itemsWithStation.forEach((item) => {
    console.log(`- ${item.name} at ${item.diningHall} (${item.station})`);
  });

  const totalResult = await db.select({ count: sql`count(*)` }).from(menuItems);
  const withStationResult = await db
    .select({ count: sql`count(*)` })
    .from(menuItems)
    .where(isNotNull(menuItems.station));

  console.log(`\nTotal items: ${totalResult[0].count}`);
  console.log(`Items with station: ${withStationResult[0].count}`);

  process.exit(0);
}

checkStations();
