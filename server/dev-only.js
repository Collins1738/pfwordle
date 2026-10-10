function requireDev(req, res, next) {
  if (process.env.NODE_ENV === "production") {
    return res.status(403).json({ error: "Not allowed in production" });
  }
  return next();
}

module.exports = { requireDev };
