import { db } from "../lib/db/client";
import { menuItems } from "../lib/db/schema";
import { sql } from "drizzle-orm";

async function checkCount() {
  const result = await db.select({ count: sql`count(*)` }).from(menuItems);
  console.log("Total items in database:", result[0].count);
  process.exit(0);
}

checkCount();
