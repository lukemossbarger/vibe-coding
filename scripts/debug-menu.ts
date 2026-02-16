import * as dotenv from "dotenv";
import { ZenRows } from "zenrows";

// Load environment variables
dotenv.config();

const client = new ZenRows(process.env.ZENROWS_API_KEY!);

async function main() {
  // Test the exact URL from your Python example
  const url =
    "https://apiv4.dineoncampus.com/locations/5b33ae291178e909d807593d/menu?date=2026-02-15&period=699231cf54c66406ba4b66a2";

  console.log("Fetching menu from:", url);
  console.log("");

  const response = await client.get(url, {
    mode: "auto",
    autoparse: true,
  });

  const text = await response.text();
  const data = JSON.parse(text);

  console.log("Menu response:", JSON.stringify(data, null, 2));
}

main();
