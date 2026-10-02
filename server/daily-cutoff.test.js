const test = require("node:test");
const assert = require("node:assert/strict");
const { getDailyAvailability } = require("./daily-cutoff");

test("Friday daily remains open immediately before 4 PM ET", () => {
  const result = getDailyAvailability(new Date("2026-10-02T19:59:59Z"));
  assert.equal(result.isFriday, true);
  assert.equal(result.isOpen, true);
  assert.equal(result.secondsRemaining, 1);
  assert.equal(result.cutoffLabel, "4:00 PM ET");
});

test("Friday daily closes at exactly 4 PM ET", () => {
  const result = getDailyAvailability(new Date("2026-10-02T20:00:00Z"));
  assert.equal(result.isFriday, true);
  assert.equal(result.isOpen, false);
  assert.equal(result.secondsRemaining, 0);
});

test("non-Friday daily remains open after 4 PM ET", () => {
  const result = getDailyAvailability(new Date("2026-10-01T20:00:00Z"));
  assert.equal(result.isFriday, false);
  assert.equal(result.isOpen, true);
  assert.equal(result.cutoffLabel, "11:59 PM ET");
});
