const passport = require("passport");
const { Strategy: GoogleStrategy } = require("passport-google-oauth20");
const jwt = require("jsonwebtoken");
const { pool } = require("./db");

const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
const ALLOWED_DOMAIN = process.env.ALLOWED_DOMAIN || "permitflow.com";

function setupAuth(app) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: process.env.GOOGLE_CALLBACK_URL || "/auth/google/callback",
      },
      async (accessToken, refreshToken, profile, done) => {
        const email = profile.emails?.[0]?.value;

        // Restrict to company domain
        if (!email || !email.endsWith(`@${ALLOWED_DOMAIN}`)) {
          return done(null, false, { message: `Only @${ALLOWED_DOMAIN} accounts allowed` });
        }

        try {
          const { rows } = await pool.query(
            `INSERT INTO users (google_id, email, name, avatar_url)
             VALUES ($1, $2, $3, $4)
             ON CONFLICT (google_id) DO UPDATE
               SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
             RETURNING *`,
            [
              profile.id,
              email,
              profile.displayName,
              profile.photos?.[0]?.value || null,
            ]
          );
          return done(null, rows[0]);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Auth routes
  app.get(
    "/auth/google",
    passport.authenticate("google", {
      scope: ["profile", "email"],
      hd: ALLOWED_DOMAIN, // hint Google to show company accounts
      session: false,
    })
  );

  app.get(
    "/auth/google/callback",
    passport.authenticate("google", { session: false, failureRedirect: "/?error=unauthorized" }),
    (req, res) => {
      const token = jwt.sign(
        { id: req.user.id, email: req.user.email, name: req.user.name, avatar: req.user.avatar_url },
        JWT_SECRET,
        { expiresIn: "30d" }
      );
      // Redirect to frontend with token
      const frontendUrl = process.env.FRONTEND_URL || "";
      res.redirect(`${frontendUrl}/?token=${token}`);
    }
  );

  app.get("/auth/me", requireAuth, (req, res) => {
    res.json(req.user);
  });

  app.post("/auth/logout", (req, res) => {
    res.json({ ok: true });
  });
}

function requireAuth(req, res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  try {
    const JWT_SECRET = process.env.JWT_SECRET || "dev-secret-change-me";
    req.user = jwt.verify(header.slice(7), JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

module.exports = { setupAuth, requireAuth };
