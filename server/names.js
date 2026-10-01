/**
 * names.js — builds the answer pool and valid employee guesses from the
 * `employees` table. Both exports are mutated in place so existing references
 * stay valid after a roster refresh.
 */

const EMPLOYEE_MAP = {};
const ACTIVE_EMPLOYEE_FIRST_NAMES = new Set();

async function loadEmployeeMap(pool) {
  let rows = [];
  try {
    ({ rows } = await pool.query(
      "SELECT * FROM employees WHERE active = true ORDER BY name"
    ));
  } catch (e) {
    console.warn("names.js: could not load employees from DB:", e.message);
  }

  for (const key of Object.keys(EMPLOYEE_MAP)) delete EMPLOYEE_MAP[key];
  ACTIVE_EMPLOYEE_FIRST_NAMES.clear();

  for (const row of rows) {
    const name = (row.name || row.rippling_name || "").trim();
    if (!name) continue;
    const firstName = name.split(" ")[0].toUpperCase();
    ACTIVE_EMPLOYEE_FIRST_NAMES.add(firstName);

    // Employees without avatars are valid guesses but cannot be answers.
    if (!row.avatar_url) continue;

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

module.exports = { EMPLOYEE_MAP, ACTIVE_EMPLOYEE_FIRST_NAMES, loadEmployeeMap };
