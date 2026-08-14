require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const passport = require("passport");
const { getRandomWordOfLength, isValidWord, VALID_BY_LENGTH } = require("./words");
const { EMPLOYEE_MAP } = require("./names");
const { migrate, pool } = require("./db");
const { setupAuth, requireAuth } = require("./auth");

// Feature flag: "first" = first names only, "full" = full names (first + last)
const NAME_MODE = "first";

// All Permitflow names — no dictionary filter needed, we inject them into valid words
const PERMITFLOW_NAMES = Object.keys(EMPLOYEE_MAP).filter(firstName => {
  const word = NAME_MODE === "full"
    ? EMPLOYEE_MAP[firstName].fullName.replace(/\s+/g, "").replace(/[^a-zA-Z]/g, "").toUpperCase()
    : firstName;
  return word.length >= 3 && word.length <= 8;
});



// Inject all names into valid word sets so players can type any name as a guess
for (const firstName of PERMITFLOW_NAMES) {
  const word = getAnswerWord(firstName);
  if (VALID_BY_LENGTH[word.length]) VALID_BY_LENGTH[word.length].add(word);
}

console.log(`Loaded ${PERMITFLOW_NAMES.length} Permitflow names (all injected as valid guesses)`);

function getAnswerWord(firstName) {
  if (NAME_MODE === "full") {
    const entry = EMPLOYEE_MAP[firstName];
    return entry.fullName.replace(/\s+/g, "").replace(/[^a-zA-Z]/g, "").toUpperCase();
  }
  return firstName;
}

// Daily word: deterministic seed from date so everyone gets the same name each day
function getDailyName() {
  const today = new Date();
  const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  return PERMITFLOW_NAMES[seed % PERMITFLOW_NAMES.length];
}

// Parse a CSV line respecting quoted fields
function parseCSVLine(line) {
  const result = [];
  let cur = "", inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') { inQuote = !inQuote; continue; }
    if (ch === "," && !inQuote) { result.push(cur); cur = ""; continue; }
    cur += ch;
  }
  result.push(cur);
  return result;
}

// Build a lookup map from first name → roster row (avatar, department, slackTitle)
const rosterByFirst = {};
try {
  const rosterRaw = fs.readFileSync(path.join(__dirname, "roster.csv"), "utf8").replace(/\r/g, "");
  const rosterLines = rosterRaw.trim().split("\n");
  const rHeaders = parseCSVLine(rosterLines[0]);
  const ri = (h) => rHeaders.indexOf(h);
  for (let i = 1; i < rosterLines.length; i++) {
    const parts = parseCSVLine(rosterLines[i]);
    const name = parts[ri("name")]?.trim();
    if (!name) continue;
    const firstName = name.split(" ")[0].toUpperCase();
    if (!rosterByFirst[firstName]) rosterByFirst[firstName] = [];
    rosterByFirst[firstName].push({
      fullName: name,
      title: parts[ri("title")]?.trim() || "",
      department: parts[ri("department")]?.trim() || "",
      slackTitle: parts[ri("slack_title")]?.trim() || "",
      avatarUrl: parts[ri("avatar_url")]?.trim() || "",
    });
  }
} catch (e) { console.warn("Could not load roster.csv for enrichment:", e.message); }

function getEmployeeInfo(firstName) {
  const key = firstName.toUpperCase();
  // Prefer roster data (has avatar/department); fall back to EMPLOYEE_MAP
  if (rosterByFirst[key]) return rosterByFirst[key];
  return EMPLOYEE_MAP[key] || null;
}

const app = express();
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(passport.initialize());
setupAuth(app);

// Run DB migrations on startup
migrate().catch(console.error);

// In-memory game sessions: sessionId -> { word, guesses, status, wordLength }
const sessions = new Map();

function generateSessionId() {
  return Math.random().toString(36).slice(2, 10);
}

// GET /api/daily — returns today's name (for display/hint, not the answer directly)
app.get("/api/daily", (req, res) => {
  const name = getDailyName();
  res.json({ wordLength: name.length, date: new Date().toISOString().slice(0, 10) });
});

// POST /api/game/start — start a new game (daily mode always used for logged-in users)
app.post("/api/game/start", async (req, res) => {
  const sessionId = generateSessionId();
  const today = new Date().toISOString().slice(0, 10);
  let word;

  // always daily mode
  word = getAnswerWord(getDailyName());

  // If user is logged in, check if they already played today
  const authHeader = req.headers.authorization;
  let userId = null;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || "dev-secret-change-me");
      userId = decoded.id;

      // Check for existing game today
      const { rows } = await pool.query(
        "SELECT * FROM games WHERE user_id = $1 AND date = $2",
        [userId, today]
      );
      if (rows.length > 0 && rows[0].status !== "playing") {
        return res.status(400).json({ error: "You already played today!", alreadyPlayed: true, status: rows[0].status });
      }

      // Create/get game record
      const gameRes = await pool.query(
        `INSERT INTO games (user_id, date, word, status)
         VALUES ($1, $2, $3, 'playing')
         ON CONFLICT (user_id, date) DO UPDATE SET word = EXCLUDED.word
         RETURNING id`,
        [userId, today, word]
      );
      sessions.set(sessionId, {
        word,
        wordLength: word.length,
        guesses: [],
        status: "playing",
        maxGuesses: Math.max(6, word.length),
        userId,
        gameId: gameRes.rows[0].id,
        startedAt: Date.now(),
      });
      return res.json({ sessionId, wordLength: word.length, maxGuesses: Math.max(6, word.length) });
    } catch { /* fall through to anonymous */ }
  }

  const maxGuesses = Math.max(6, word.length);
  sessions.set(sessionId, { word, wordLength: word.length, guesses: [], status: "playing", maxGuesses });
  res.json({ sessionId, wordLength: word.length, maxGuesses });
});

// POST /api/game/:sessionId/guess
app.post("/api/game/:sessionId/guess", async (req, res) => {
  const { sessionId } = req.params;
  const { guess } = req.body;

  if (!guess || typeof guess !== "string") {
    return res.status(400).json({ error: "guess is required" });
  }

  const upperGuess = guess.toUpperCase().trim();
  const session = sessions.get(sessionId);

  if (!session) return res.status(404).json({ error: "Game session not found" });
  if (session.status !== "playing") return res.status(400).json({ error: "Game is already over" });
  if (upperGuess.length !== session.wordLength) {
    return res.status(400).json({ error: `Guess must be ${session.wordLength} letters` });
  }
  if (!isValidWord(upperGuess)) {
    return res.status(400).json({ error: "Not a valid word" });
  }
  if (session.guesses.length >= session.maxGuesses) {
    return res.status(400).json({ error: "No more guesses allowed" });
  }

  const result = evaluateGuess(upperGuess, session.word);
  session.guesses.push({ guess: upperGuess, result });

  const won = upperGuess === session.word;
  const lost = !won && session.guesses.length >= session.maxGuesses;

  if (won) session.status = "won";
  if (lost) session.status = "lost";

  // Persist to DB if logged-in game
  if (session.gameId) {
    try {
      await pool.query(
        "INSERT INTO guesses (game_id, guess, result) VALUES ($1, $2, $3)",
        [session.gameId, upperGuess, JSON.stringify(result)]
      );
      if (session.status !== "playing") {
        const durationSeconds = Math.round((Date.now() - session.startedAt) / 1000);
        await pool.query(
          `UPDATE games SET status = $1, guess_count = $2, duration_seconds = $3, completed_at = NOW()
           WHERE id = $4`,
          [session.status, session.guesses.length, durationSeconds, session.gameId]
        );
      }
    } catch (e) { console.error("DB save error:", e.message); }
  }

  const employee = session.status !== "playing" ? getEmployeeInfo(session.word) : null;

  res.json({
    guess: upperGuess,
    result,
    guessNumber: session.guesses.length,
    status: session.status,
    ...(session.status !== "playing" ? { answer: session.word } : {}),
    ...(employee ? { employee } : {}),
  });
});

// GET /api/game/:sessionId
app.get("/api/game/:sessionId", (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json({
    guesses: session.guesses,
    guessCount: session.guesses.length,
    maxGuesses: session.maxGuesses,
    wordLength: session.wordLength,
    status: session.status,
    ...(session.status !== "playing" ? { answer: session.word } : {}),
  });
});

// GET /api/game/:sessionId/debug — dev only
app.get("/api/game/:sessionId/debug", (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  res.json({ answer: session.word, wordLength: session.wordLength });
});

// GET /api/avatar?url=... — proxy Slack avatars (CDN requires auth)
const https = require("https");
const http = require("http"); // eslint-disable-line no-redeclare
app.get("/api/avatar", (req, res) => {
  const url = req.query.url;
  if (!url || !url.startsWith("http")) return res.status(400).end();
  const lib = url.startsWith("https") ? https : http;
  lib.get(url, (upstream) => {
    res.set("Content-Type", upstream.headers["content-type"] || "image/jpeg");
    res.set("Cache-Control", "public, max-age=86400");
    upstream.pipe(res);
  }).on("error", () => res.status(502).end());
});

// GET /api/employees — full roster from CSV
app.get("/api/employees", (req, res) => {
  try {
    const raw = fs.readFileSync(path.join(__dirname, "roster.csv"), "utf8");
    const lines = raw.trim().replace(/\r/g, "").split("\n");
    const headers = parseCSVLine(lines[0]);
    const idx = (h) => headers.indexOf(h);
    const employees = [];
    const seen = new Set();
    for (let i = 1; i < lines.length; i++) {
      const parts = parseCSVLine(lines[i]);
      const name = parts[idx("name")]?.trim();
      const email = parts[idx("email")]?.trim();
      if (!name || seen.has(email)) continue;
      seen.add(email);
      employees.push({
        name,
        email,
        title: parts[idx("title")]?.trim() || "",
        department: parts[idx("department")]?.trim() || "",
        slackTitle: parts[idx("slack_title")]?.trim() || "",
        avatarUrl: parts[idx("avatar_url")]?.trim() || "",
      });
    }
    employees.sort((a, b) => a.name.localeCompare(b.name));
    res.json(employees);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

function evaluateGuess(guess, target) {
  const result = Array(target.length).fill(null).map((_, i) => ({
    letter: guess[i],
    status: "absent",
  }));

  const targetLetters = target.split("");
  const guessLetters = guess.split("");

  guessLetters.forEach((letter, i) => {
    if (letter === targetLetters[i]) {
      result[i].status = "correct";
      targetLetters[i] = null;
    }
  });

  guessLetters.forEach((letter, i) => {
    if (result[i].status === "correct") return;
    const idx = targetLetters.indexOf(letter);
    if (idx !== -1) {
      result[i].status = "present";
      targetLetters[idx] = null;
    }
  });

  return result;
}

// GET /api/leaderboard/daily — today's leaderboard
app.get("/api/leaderboard/daily", async (req, res) => {
  const today = new Date().toISOString().slice(0, 10);
  try {
    const { rows } = await pool.query(
      `SELECT u.name, u.avatar_url, g.guess_count, g.duration_seconds, g.status
       FROM games g JOIN users u ON u.id = g.user_id
       WHERE g.date = $1 AND g.status IN ('won', 'lost')
       ORDER BY g.status DESC, g.guess_count ASC, g.duration_seconds ASC
       LIMIT 50`,
      [today]
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/leaderboard/alltime — all-time leaderboard
app.get("/api/leaderboard/alltime", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.name, u.avatar_url,
              COUNT(*) FILTER (WHERE g.status = 'won') AS wins,
              COUNT(*) FILTER (WHERE g.status = 'lost') AS losses,
              ROUND(AVG(g.guess_count) FILTER (WHERE g.status = 'won'), 1) AS avg_guesses,
              COUNT(*) AS total_games
       FROM games g JOIN users u ON u.id = g.user_id
       WHERE g.status IN ('won', 'lost')
       GROUP BY u.id, u.name, u.avatar_url
       ORDER BY wins DESC, avg_guesses ASC
       LIMIT 50`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/stats — personal stats for logged-in user
app.get("/api/stats", requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE status = 'won') AS wins,
         COUNT(*) FILTER (WHERE status = 'lost') AS losses,
         ROUND(AVG(guess_count) FILTER (WHERE status = 'won'), 1) AS avg_guesses,
         COUNT(*) AS total_games
       FROM games WHERE user_id = $1`,
      [req.user.id]
    );
    // Guess distribution
    const { rows: dist } = await pool.query(
      `SELECT guess_count, COUNT(*) AS count
       FROM games WHERE user_id = $1 AND status = 'won'
       GROUP BY guess_count ORDER BY guess_count`,
      [req.user.id]
    );
    res.json({ ...rows[0], distribution: dist });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Serve built React client in production
const clientBuild = path.join(__dirname, "../client/dist");
if (fs.existsSync(clientBuild)) {
  app.use(express.static(clientBuild));
  app.get("/*splat", (req, res) => {
    res.sendFile(path.join(clientBuild, "index.html"));
  });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Wordle server running on port ${PORT}`));
