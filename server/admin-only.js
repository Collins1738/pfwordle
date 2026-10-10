const jwt = require("jsonwebtoken");

const DEFAULT_ADMIN_EMAILS = [
  "tobechikeluba@gmail.com",
  "collins.chikeluba@permitflow.com",
];

function getAdminEmails() {
  return (process.env.ADMIN_EMAILS || DEFAULT_ADMIN_EMAILS.join(","))
    .split(",")
    .map(email => email.trim().toLowerCase())
    .filter(Boolean);
}

function isAdminEmail(email) {
  return typeof email === "string" && getAdminEmails().includes(email.toLowerCase());
}

// Hide restricted routes completely from anyone outside the admin/dev list.
function requireAdminOrNotFound(req, res, next) {
  const header = req.headers.authorization || "";
  try {
    if (!header.startsWith("Bearer ")) throw new Error("Missing bearer token");
    const decoded = jwt.verify(
      header.slice(7),
      process.env.JWT_SECRET || "dev-secret-change-me"
    );
    if (!isAdminEmail(decoded.email)) throw new Error("Not an admin");
    req.user = decoded;
    return next();
  } catch {
    return res.status(404).json({ error: "Not found" });
  }
}

module.exports = { getAdminEmails, isAdminEmail, requireAdminOrNotFound };
