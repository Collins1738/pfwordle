/**
 * sync-roster.js — merges server/roster.csv into `employees`.
 * roster.csv owns: name (preferred display name), email, department, manager,
 * slack_display_name, slack_title, avatar_url. Never touches title/tenure/active.
 *
 * Usage: node scripts/sync-roster.js
 */

// dotenv/pg are installed under server/, not the repo root
require("../server/node_modules/dotenv").config({ path: require("path").join(__dirname, "../server/.env") });
const path = require("path");
const { pool } = require("../server/db");
const { readCSV } = require("./lib/csv");

const ROSTER_PATH = path.join(__dirname, "../server/roster.csv");

const escapeLike = (s) => s.replace(/[\\%_]/g, (c) => "\\" + c);

// Nickname → Rippling name overrides.
// When roster.csv uses a nickname, this maps it to the canonical Rippling name
// so the Rippling sync can match and update the same row correctly.
const RIPPLING_NAME_OVERRIDES = {
  "Sam Lam":    "Samuel Lam",
  "Bill Finn":  "William Finn",
  "Jake Mendys": "Jacob Mendys",
  "Matt Diesner": "Matthew Diesner",
  "Katie Weinmann": "Katherine Weinmann",
  "Angie Mora": "Angie Resendiz Mora",
  "Ejaz Farook": "Ahmed Ejaz Hussain Farook",
  "Alex Fabian": "Fabian Fabian",
  "Megan Park": "Megan Park Jayanti",
};

async function findMatch(client, name, email) {
  if (email) {
    const r = await client.query("SELECT id FROM employees WHERE email = $1", [email]);
    if (r.rows[0]) return { id: r.rows[0].id, by: "email" };
  }
  let r = await client.query("SELECT id FROM employees WHERE rippling_name = $1", [name]);
  if (r.rows[0]) return { id: r.rows[0].id, by: "name" };
  r = await client.query("SELECT id FROM employees WHERE name ILIKE $1 ORDER BY active DESC, id LIMIT 1", [escapeLike(name)]);
  if (r.rows[0]) return { id: r.rows[0].id, by: "name" };
  return null;
}

async function main() {
  const rows = readCSV(ROSTER_PATH).filter((r) => r.name);
  const counts = { email: 0, name: 0, inserted: 0, skipped: 0 };
  const inserted = [];
  const seenEmails = new Set();

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const row of rows) {
      const email = row.email || null;
      if (email && seenEmails.has(email)) { counts.skipped++; continue; }
      if (email) seenEmails.add(email);

      const fields = [
        row.name,
        email,
        row.department || null,
        row.manager || null,
        row.slack_display_name || null,
        row.slack_title || null,
        row.avatar_url || null,
      ];

      const match = await findMatch(client, row.name, email);
      if (match) {
        // Also apply rippling_name override if one exists for this roster name
        const ripplingName = RIPPLING_NAME_OVERRIDES[row.name] || null;
        await client.query(
          `UPDATE employees SET
             name = $1, email = $2, department = $3, manager = $4,
             slack_display_name = $5, slack_title = $6, avatar_url = $7,
             ${ripplingName ? "rippling_name = $9," : ""}
             updated_at = NOW()
           WHERE id = $8`,
          ripplingName ? [...fields, match.id, ripplingName] : [...fields, match.id]
        );
        counts[match.by]++;
      } else {
        const ripplingName = RIPPLING_NAME_OVERRIDES[row.name] || row.name;
        await client.query(
          `INSERT INTO employees
             (name, email, department, manager, slack_display_name, slack_title, avatar_url, rippling_name)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (rippling_name) DO UPDATE SET
             name = EXCLUDED.name, email = EXCLUDED.email, department = EXCLUDED.department,
             manager = EXCLUDED.manager, slack_display_name = EXCLUDED.slack_display_name,
             slack_title = EXCLUDED.slack_title, avatar_url = EXCLUDED.avatar_url,
             updated_at = NOW()`,
          [...fields, ripplingName]
        );
        counts.inserted++;
        inserted.push(row.name);
      }
    }

    await client.query("COMMIT");
  } catch (e) {
    await client.query("ROLLBACK");
    throw e;
  } finally {
    client.release();
  }

  console.log(`${counts.email} matched by email, ${counts.name} matched by name, ${counts.inserted} new inserts`);
  if (counts.skipped) console.log(`${counts.skipped} duplicate-email rows skipped`);
  if (inserted.length) console.log("New (no Rippling match):", inserted.join(", "));
}

main()
  .catch((e) => { console.error("sync-roster failed:", e.message); process.exitCode = 1; })
  .finally(() => pool.end());
