const test = require("node:test");
const assert = require("node:assert/strict");
const { requireDev } = require("./dev-only");

function responseStub() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(body) {
      this.body = body;
      return this;
    },
  };
}

test("requireDev blocks production requests", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  const res = responseStub();
  let calledNext = false;

  try {
    requireDev({}, res, () => { calledNext = true; });
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }

  assert.equal(calledNext, false);
  assert.equal(res.statusCode, 403);
  assert.deepEqual(res.body, { error: "Not allowed in production" });
});

test("requireDev allows non-production requests", () => {
  const originalNodeEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = "development";
  const res = responseStub();
  let calledNext = false;

  try {
    requireDev({}, res, () => { calledNext = true; });
  } finally {
    if (originalNodeEnv === undefined) delete process.env.NODE_ENV;
    else process.env.NODE_ENV = originalNodeEnv;
  }

  assert.equal(calledNext, true);
  assert.equal(res.statusCode, null);
  assert.equal(res.body, null);
});
