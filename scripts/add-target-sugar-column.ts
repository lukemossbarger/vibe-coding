import postgres from "postgres";

async function main() {
  const sql = postgres(process.env.DATABASE_URL!);
  await sql`ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS target_sugar INTEGER`;
  console.log("Added target_sugar column to user_profiles");
  await sql.end();
}

main().catch(console.error);
