import { config } from "dotenv";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import postgres from "postgres";

config({
  path: ".env.local",
});

// Ensure database connection exists
if (!process.env.POSTGRES_URL) {
  throw new Error("❌ POSTGRES_URL is not defined");
}

// Create database connection
const connection = postgres(process.env.POSTGRES_URL, { max: 1 });
export const db = drizzle(connection); // ✅ Export db instance

// Function to run migrations
const runMigrate = async () => {
  console.log("⏳ Running migrations...");

  const start = Date.now();
  await migrate(db, { migrationsFolder: "./lib/db/migrations" });
  const end = Date.now();

  console.log("✅ Migrations completed in", end - start, "ms");
  process.exit(0);
};

// Run migration script
if (require.main === module) {
  runMigrate().catch((err) => {
    console.error("❌ Migration failed", err);
    process.exit(1);
  });
}
