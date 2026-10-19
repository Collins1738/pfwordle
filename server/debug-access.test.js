const test = require("node:test");
const assert = require("node:assert/strict");
const { canRevealDebugAnswer } = require("./debug-access");

test("production daily answers are never available through debug", () => {
  assert.equal(canRevealDebugAnswer("daily", "production"), false);
  assert.equal(canRevealDebugAnswer("practice", "production"), true);
});

test("development keeps debug answers for daily and practice", () => {
  assert.equal(canRevealDebugAnswer("daily", "development"), true);
  assert.equal(canRevealDebugAnswer("practice", "development"), true);
});
