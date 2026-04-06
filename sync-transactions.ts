import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log(
    "Syncing missing balance transactions for historical project expenses...",
  );

  const res = await db.execute(sql`
    SELECT id, title, amount, spent_at, created_at, organization_id
    FROM expenses
    WHERE amount > 0
  `);

  for (const r of res.rows) {
    const desc = `%Project Expense: ${r.title}%`;
    const exists = await db.execute(sql`
      SELECT id FROM balance_transactions 
      WHERE description ILIKE ${desc} AND amount = CAST(${r.amount} AS NUMERIC)
    `);

    if (exists.rows.length === 0) {
      const userRes = await db.execute(sql`SELECT id FROM "user" LIMIT 1`);
      const userId = userRes.rows[0]?.id;

      if (userId) {
        const entryDate = r.spent_at || r.created_at;
        await db.execute(sql`
           INSERT INTO balance_transactions (
             user_id, organization_id, amount, transaction_type, description, 
             balance_before, balance_after, created_at
           ) VALUES (
             ${userId}, ${r.organization_id}, ${r.amount}, 'expense', 
             ${`Project Expense: ${r.title}`}, 0, 0, ${entryDate}
           )
         `);
        console.log(`Inserted transaction for project expense: ${r.title}`);
      }
    }
  }

  console.log("Done syncing transactions.");
  process.exit(0);
}

main().catch(console.error);
