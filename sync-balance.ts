import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { sql } from "drizzle-orm";

async function main() {
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool);

  console.log("Recalculating company balance...");

  // Get sum of all company_expenses
  const cmpexpRes = await db.execute(
    sql`SELECT sum(amount) as s, organization_id FROM company_expenses GROUP BY organization_id;`,
  );

  // Get sum of all project expenses
  const prjexpRes = await db.execute(
    sql`SELECT sum(amount) as s, organization_id FROM expenses GROUP BY organization_id;`,
  );

  // Get sum of all top-ups
  const topupsRes = await db.execute(
    sql`SELECT sum(amount) as s, organization_id FROM balance_transactions WHERE transaction_type = 'top-up' GROUP BY organization_id;`,
  );

  const balances: Record<string, number> = {};

  for (const r of topupsRes.rows) {
    if (!balances[r.organization_id as string])
      balances[r.organization_id as string] = 0;
    balances[r.organization_id as string] += Number(r.s || 0);
  }

  for (const r of cmpexpRes.rows) {
    if (!balances[r.organization_id as string])
      balances[r.organization_id as string] = 0;
    balances[r.organization_id as string] -= Number(r.s || 0);
  }

  for (const r of prjexpRes.rows) {
    if (!balances[r.organization_id as string])
      balances[r.organization_id as string] = 0;
    balances[r.organization_id as string] -= Number(r.s || 0);
  }

  console.log("Calculated correct balances:", balances);

  for (const [orgId, bal] of Object.entries(balances)) {
    console.log(`Updating org ${orgId} to balance ${bal}`);

    // Check if balance record exists
    const existing = await db.execute(
      sql`SELECT id FROM company_balance WHERE organization_id = ${orgId} LIMIT 1`,
    );

    if (existing.rows.length > 0) {
      await db.execute(
        sql`UPDATE company_balance SET balance = ${bal} WHERE organization_id = ${orgId}`,
      );
    } else {
      await db.execute(
        sql`INSERT INTO company_balance (balance, organization_id, currency) VALUES (${bal}, ${orgId}, 'NGN')`,
      );
    }
  }

  console.log("Done.");
  process.exit(0);
}

main().catch(console.error);
