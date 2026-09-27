/**
 * sync-rippling.js — upserts the weekly Rippling roster export into `employees`.
 * Rippling owns: rippling_name, title, tenure_months, active.
 *
 * Usage: node scripts/sync-rippling.js path/to/rippling-roster.csv
 */

// dotenv/pg are installed under server/, not the repo root
require("../server/node_modules/dotenv").config({ path: require("path").join(__dirname, "../server/.env") });
const { pool } = require("../server/db");
const { readCSV } = require("./lib/csv");

async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node scripts/sync-rippling.js path/to/rippling-roster.csv");
    process.exit(1);
  }

  const rows = readCSV(csvPath).filter((r) => r["Employee"]);
  if (rows.length === 0) {
    // Guard: an empty/malformed export would otherwise deactivate everyone
    throw new Error(`No employees parsed from ${csvPath} — aborting`);
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const names = [];
    for (const row of rows) {
      const ripplingName = row["Employee"];
      const tenure = parseInt(row["Tenure (Months)"], 10);
      names.push(ripplingName);
      await client.query(
        `INSERT INTO employees (name, rippling_name, title, tenure_months, active)
         VALUES ($1, $1, $2, $3, true)
         ON CONFLICT (rippling_name) DO UPDATE SET
           title = EXCLUDED.title,
           tenure_months = EXCLUDED.tenure_months,
           active = true,
           updated_at = NOW()`,
        [ripplingName, row["Title"] || null, Number.isNaN(tenure) ? null : tenure]
      );
    }

    const deactivated = await client.query(
      `UPDATE employees SET active = false, updated_at = NOW()
       WHERE active = true AND NOT (rippling_name = ANY($1::text[]))
       RETURNING rippling_name`,
      [names]
    );

    await client.query("COMMIT");
    console.log(`${rows.length} upserted, ${deactivated.rowCount} deactivated`);
    if (deactivated.rowCount) {
      console.log("Deactivated:", deactivated.rows.map((r) => r.rippling_name).join(", "));
    }
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }
}

main()
  .catch((e) => { console.error("sync-rippling failed:", e.message); process.exitCode = 1; })
  .finally(() => pool.end());
