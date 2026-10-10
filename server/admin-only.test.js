const test = require("node:test");
const assert = require("node:assert/strict");
const jwt = require("jsonwebtoken");
const { isAdminEmail, requireAdminOrNotFound } = require("./admin-only");

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

function runMiddleware(authorization) {
  const req = { headers: authorization ? { authorization } : {} };
  const res = responseStub();
  let calledNext = false;
  requireAdminOrNotFound(req, res, () => { calledNext = true; });
  return { req, res, calledNext };
}

test("recognizes configured admin emails case-insensitively", () => {
  assert.equal(isAdminEmail("Collins.Chikeluba@permitflow.com"), true);
  assert.equal(isAdminEmail("employee@permitflow.com"), false);
});

test("allows an authenticated admin", () => {
  const token = jwt.sign(
    { id: 1, email: "collins.chikeluba@permitflow.com" },
    "dev-secret-change-me"
  );
  const { req, res, calledNext } = runMiddleware(`Bearer ${token}`);

  assert.equal(calledNext, true);
  assert.equal(req.user.email, "collins.chikeluba@permitflow.com");
  assert.equal(res.statusCode, null);
});

test("returns 404 for an authenticated non-admin", () => {
  const token = jwt.sign(
    { id: 2, email: "employee@permitflow.com" },
    "dev-secret-change-me"
  );
  const { res, calledNext } = runMiddleware(`Bearer ${token}`);

  assert.equal(calledNext, false);
  assert.equal(res.statusCode, 404);
  assert.deepEqual(res.body, { error: "Not found" });
});

test("returns the same 404 for missing or invalid credentials", () => {
  for (const authorization of [undefined, "Bearer invalid-token"]) {
    const { res, calledNext } = runMiddleware(authorization);
    assert.equal(calledNext, false);
    assert.equal(res.statusCode, 404);
    assert.deepEqual(res.body, { error: "Not found" });
  }
});
