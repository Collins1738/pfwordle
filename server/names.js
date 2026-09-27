/**
 * names.js — builds EMPLOYEE_MAP from the `employees` table.
 * Populated by `await loadEmployeeMap(pool)` at startup; the object is mutated
 * in place so existing references to EMPLOYEE_MAP stay valid.
 */

const EMPLOYEE_MAP = {};

async function loadEmployeeMap(pool) {
  let rows = [];
  try {
    ({ rows } = await pool.query("SELECT * FROM employees WHERE active = true ORDER BY name"));
  } catch (e) {
    console.warn("names.js: could not load employees from DB:", e.message);
  }

  for (const key of Object.keys(EMPLOYEE_MAP)) delete EMPLOYEE_MAP[key];

  for (const row of rows) {
    const name = (row.name || row.rippling_name || "").trim();
    if (!name) continue;
    const firstName = name.split(" ")[0].toUpperCase();
    if (!EMPLOYEE_MAP[firstName]) EMPLOYEE_MAP[firstName] = [];
    EMPLOYEE_MAP[firstName].push({
      fullName: name,
      title: row.title || "",
      department: row.department || "",
      slackTitle: row.slack_title || "",
      avatarUrl: row.avatar_url || "",
      email: row.email || "",
      tenureMonths: row.tenure_months ?? null,
    });
  }

  return EMPLOYEE_MAP;
}

module.exports = { EMPLOYEE_MAP, loadEmployeeMap };
