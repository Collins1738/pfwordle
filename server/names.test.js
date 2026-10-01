const test = require("node:test");
const assert = require("node:assert/strict");
const {
  EMPLOYEE_MAP,
  ACTIVE_EMPLOYEE_FIRST_NAMES,
  loadEmployeeMap,
} = require("./names");

test("all active employees are valid guesses, but only employees with avatars are answers", async () => {
  let queryText;
  const pool = {
    async query(sql) {
      queryText = sql;
      return {
        rows: [
          { name: "McGowan Day", avatar_url: "", title: "Customer Success Manager" },
          { name: "Ada Lovelace", avatar_url: "https://example.com/ada.jpg", title: "Engineer" },
        ],
      };
    },
  };

  await loadEmployeeMap(pool);

  assert.match(queryText, /WHERE active = true/);
  assert.doesNotMatch(queryText, /avatar_url/);
  assert.equal(ACTIVE_EMPLOYEE_FIRST_NAMES.has("MCGOWAN"), true);
  assert.equal(ACTIVE_EMPLOYEE_FIRST_NAMES.has("ADA"), true);
  assert.equal(EMPLOYEE_MAP.MCGOWAN, undefined);
  assert.equal(EMPLOYEE_MAP.ADA[0].fullName, "Ada Lovelace");
});
