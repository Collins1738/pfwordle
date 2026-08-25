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

// Get current date in America/New_York (ET) as YYYY-MM-DD
function getETDate(d = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" }); // en-CA gives YYYY-MM-DD
}

function calcScore(guessCount, maxGuesses, durationSeconds) {
  const perfect = 900;
  const deductPerGuess = Math.floor(perfect / maxGuesses);
  const base = Math.max(50, perfect - (guessCount - 1) * deductPerGuess);
  let timeBonus = 0;
  if (durationSeconds < 60)        timeBonus = 300;
  else if (durationSeconds < 300)  timeBonus = 200;
  else if (durationSeconds < 600)  timeBonus = 75;
  else if (durationSeconds < 1800) timeBonus = 25;
  return Math.min(1000, base + timeBonus);
}

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

// Daily word: deterministic seed from ET date so everyone gets the same name each day
function getDailyName() {
  const et = getETDate(); // YYYY-MM-DD in ET
  const [y, m, d] = et.split("-").map(Number);
  const seed = y * 10000 + m * 100 + d;
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

function getEmployeeInfo(firstName) {
  return EMPLOYEE_MAP[firstName.toUpperCase()] || null;
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

// GET /api/game/resume — restore an in-progress game for logged-in user
app.get("/api/game/resume", async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) return res.status(401).json({ error: "Unauthorized" });

  let userId;
  try {
    const jwt = require("jsonwebtoken");
    const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || "dev-secret-change-me");
    userId = decoded.id;
  } catch { return res.status(401).json({ error: "Invalid token" }); }

  const today = getETDate();
  const { rows } = await pool.query(
    `SELECT g.*, array_agg(
       json_build_object('guess', gu.guess, 'result', gu.result)
       ORDER BY gu.id
     ) FILTER (WHERE gu.id IS NOT NULL) AS guesses
     FROM games g
     LEFT JOIN guesses gu ON gu.game_id = g.id
     WHERE g.user_id = $1 AND g.date = $2 AND g.mode = 'daily'
     GROUP BY g.id`,
    [userId, today]
  );

  if (!rows.length) return res.json({ hasGame: false });

  const game = rows[0];
  const guessHistory = game.guesses || [];
  const word = game.word;
  const maxGuesses = Math.max(6, word.length);

  // Rebuild in-memory session
  const sessionId = generateSessionId();
  sessions.set(sessionId, {
    word,
    wordLength: word.length,
    guesses: guessHistory,
    status: game.status,
    maxGuesses,
    userId,
    gameId: game.id,
    startedAt: new Date(game.started_at).getTime(),
  });

  // Update session_id in DB
  await pool.query("UPDATE games SET session_id = $1 WHERE id = $2", [sessionId, game.id]);

  const empInfoResume = getEmployeeInfo(word);
  const avatarUrlResume = Array.isArray(empInfoResume) ? empInfoResume[0]?.avatarUrl : empInfoResume?.avatarUrl || "";

  res.json({
    hasGame: true,
    sessionId,
    wordLength: word.length,
    maxGuesses,
    status: game.status,
    guesses: guessHistory,
    avatarUrl: avatarUrlResume,
    employee: game.status !== "playing" ? empInfoResume : null,
    answer: game.status !== "playing" ? word : undefined,
  });
});

// GET /api/daily — returns today's name (for display/hint, not the answer directly)
app.get("/api/daily", (req, res) => {
  const name = getDailyName();
  res.json({ wordLength: name.length, date: getETDate() });
});

// POST /api/game/start — start a new game
app.post("/api/game/start", async (req, res) => {
  const sessionId = generateSessionId();
  const today = getETDate();
  const mode = req.body?.mode === "practice" ? "practice" : "daily";
  console.log(`[game/start] mode=${mode} hasAuth=${!!req.headers.authorization}`);
  let word;

  if (mode === "practice") {
    // Random Permitflow name
    const randomFirst = PERMITFLOW_NAMES[Math.floor(Math.random() * PERMITFLOW_NAMES.length)];
    word = getAnswerWord(randomFirst);
  } else {
    word = getAnswerWord(getDailyName());
  }

  // If user is logged in, check if they already played today
  const authHeader = req.headers.authorization;
  let userId = null;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const jwt = require("jsonwebtoken");
      const decoded = jwt.verify(authHeader.slice(7), process.env.JWT_SECRET || "dev-secret-change-me");
      userId = decoded.id;

      // Create/get game record
      let gameRes;
      if (mode === "daily") {
        gameRes = await pool.query(
          `INSERT INTO games (user_id, date, word, status, session_id, mode)
           VALUES ($1, $2, $3, 'playing', $4, 'daily')
           ON CONFLICT (user_id, date) WHERE mode = 'daily' DO UPDATE
             SET session_id = EXCLUDED.session_id, word = EXCLUDED.word
           RETURNING id, status, started_at`,
          [userId, today, word, sessionId]
        );
      } else {
        gameRes = await pool.query(
          `INSERT INTO games (user_id, date, word, status, session_id, mode)
           VALUES ($1, $2, $3, 'playing', $4, 'practice')
           RETURNING id, status, started_at`,
          [userId, today, word, sessionId]
        );
      }
      const gameId = gameRes.rows[0].id;
      sessions.set(sessionId, {
        word,
        wordLength: word.length,
        guesses: [],
        status: "playing",
        maxGuesses: Math.max(6, word.length),
        userId,
        gameId,
        mode,
        startedAt: Date.now(),
      });
      const empInfo = getEmployeeInfo(word);
      const avatarUrl = Array.isArray(empInfo) ? empInfo[0]?.avatarUrl : empInfo?.avatarUrl || "";
      return res.json({ sessionId, wordLength: word.length, maxGuesses: Math.max(6, word.length), mode, avatarUrl });
    } catch (err) { console.error("[game/start] auth/db error:", err.message); /* fall through to anonymous */ }
  }

  const maxGuesses = Math.max(6, word.length);
  // Save anonymous practice games to DB (user_id = NULL, player shown as "Anonymous")
  let anonGameId = null;
  if (mode === "practice") {
    try {
      const anonRes = await pool.query(
        `INSERT INTO games (user_id, date, word, status, session_id, mode)
         VALUES (NULL, $1, $2, 'playing', $3, 'practice')
         RETURNING id`,
        [today, word, sessionId]
      );
      anonGameId = anonRes.rows[0].id;
    } catch (e) { console.error("[game/start] anon practice save error:", e.message); }
  }
  sessions.set(sessionId, { word, wordLength: word.length, guesses: [], status: "playing", maxGuesses, gameId: anonGameId, startedAt: Date.now(), mode });
  const empInfoAnon = getEmployeeInfo(word);
  const avatarUrlAnon = Array.isArray(empInfoAnon) ? empInfoAnon[0]?.avatarUrl : empInfoAnon?.avatarUrl || "";
  res.json({ sessionId, wordLength: word.length, maxGuesses, avatarUrl: avatarUrlAnon });
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
        const score = session.status === "won" ? calcScore(session.guesses.length, session.maxGuesses, durationSeconds) : 0;
        await pool.query(
          `UPDATE games SET status = $1, guess_count = $2, duration_seconds = $3, completed_at = NOW(), score = $5
           WHERE id = $4`,
          [session.status, session.guesses.length, durationSeconds, session.gameId, score]
        );
      }
    } catch (e) { console.error("DB save error:", e.message); }
  }

  const employee = session.status !== "playing" ? getEmployeeInfo(session.word) : null;
  const durationSeconds = session.status !== "playing" && session.startedAt
    ? Math.round((Date.now() - session.startedAt) / 1000)
    : null;

  res.json({
    guess: upperGuess,
    result,
    guessNumber: session.guesses.length,
    status: session.status,
    ...(session.status !== "playing" ? { answer: session.word } : {}),
    ...(employee ? { employee } : {}),
    ...(durationSeconds != null ? { durationSeconds } : {}),
  });
});

// GET /api/game/:sessionId
app.get("/api/game/:sessionId", (req, res) => {
  const session = sessions.get(req.params.sessionId);
  if (!session) return res.status(404).json({ error: "Session not found" });
  const empInfo = getEmployeeInfo(session.word);
  const avatarUrl = Array.isArray(empInfo) ? empInfo[0]?.avatarUrl : empInfo?.avatarUrl || "";
  res.json({
    guesses: session.guesses,
    guessCount: session.guesses.length,
    maxGuesses: session.maxGuesses,
    wordLength: session.wordLength,
    status: session.status,
    avatarUrl,
    ...(session.status !== "playing" ? { answer: session.word, employee: empInfo } : {}),
  });
});

// DELETE /api/dev/reset-daily — dev only, deletes today's daily game for current user
app.delete("/api/dev/reset-daily", requireAuth, async (req, res) => {
  if (process.env.NODE_ENV === "production") return res.status(403).json({ error: "Not allowed in production" });
  const today = getETDate();
  await pool.query("DELETE FROM games WHERE user_id = $1 AND date = $2 AND mode = 'daily'", [req.user.id, today]);
  res.json({ ok: true });
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

// GET /api/admin/games — all games (daily + practice), admin only
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "tobechikeluba@gmail.com,collins.chikeluba@permitflow.com").split(",");
app.get("/api/admin/games", requireAuth, async (req, res) => {
  if (!ADMIN_EMAILS.includes(req.user.email)) {
    return res.status(403).json({ error: "Forbidden" });
  }
  const { mode, date, limit = 200, offset = 0 } = req.query;
  const conditions = [];
  const params = [];
  if (mode) { params.push(mode); conditions.push(`g.mode = $${params.length}`); }
  if (date) { params.push(date); conditions.push(`g.date = $${params.length}`); }
  const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
  params.push(parseInt(limit, 10), parseInt(offset, 10));
  try {
    const { rows } = await pool.query(
      `SELECT
         g.id, g.date, g.mode, g.word, g.status,
         g.guess_count, g.duration_seconds, g.score,
         g.started_at, g.completed_at,
         COALESCE(u.name, 'Anonymous') AS player_name,
         u.email AS player_email, u.avatar_url AS player_avatar,
         COALESCE(
           json_agg(
             json_build_object('guess', gu.guess, 'result', gu.result, 'guessed_at', gu.guessed_at)
             ORDER BY gu.id
           ) FILTER (WHERE gu.id IS NOT NULL),
           '[]'
         ) AS guesses
       FROM games g
       LEFT JOIN users u ON u.id = g.user_id
       LEFT JOIN guesses gu ON gu.game_id = g.id
       ${where}
       GROUP BY g.id, u.name, u.email, u.avatar_url
       ORDER BY g.started_at DESC
       LIMIT $${params.length - 1} OFFSET $${params.length}`,
      params
    );
    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) FROM games g ${where}`,
      params.slice(0, params.length - 2)
    );
    res.json({ games: rows, total: parseInt(countRows[0].count, 10) });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/leaderboard/daily — today's leaderboard
app.get("/api/leaderboard/daily", async (req, res) => {
  const today = getETDate();
  try {
    const { rows } = await pool.query(
      `SELECT u.name, u.avatar_url, g.id AS game_id, g.guess_count, g.duration_seconds, g.status, g.score, g.word,
              COALESCE(json_agg(json_build_object('guess', gu.guess, 'result', gu.result) ORDER BY gu.id) FILTER (WHERE gu.id IS NOT NULL), '[]') AS guesses
       FROM games g
       JOIN users u ON u.id = g.user_id
       LEFT JOIN guesses gu ON gu.game_id = g.id
       WHERE g.date = $1 AND g.mode = 'daily' AND g.status IN ('won', 'lost')
       GROUP BY u.name, u.avatar_url, g.id, g.guess_count, g.duration_seconds, g.status, g.word
       ORDER BY g.score DESC, g.duration_seconds ASC
       LIMIT 50`,
      [today]
    );
    // Enrich each row with the player's own title/department (look up by their first name)
    const enriched = rows.map(row => {
      const firstName = row.name?.split(" ")[0]?.toUpperCase();
      const empInfo = firstName ? getEmployeeInfo(firstName) : null;
      const emp = Array.isArray(empInfo) ? empInfo.find(e => e.fullName === row.name) || empInfo[0] : empInfo;
      return {
        ...row,
        employee_title: emp?.slackTitle || emp?.title || null,
        employee_department: emp?.department || null,
        employee_full_name: emp?.fullName || row.name,
      };
    });
    res.json(enriched);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/leaderboard/hall-of-fame — one winner per week, oldest first (admin only)
app.get("/api/leaderboard/hall-of-fame", async (req, res) => {
  try {
    // For each Mon–Fri week that has completed games, find the top scorer
    // week_start = the Monday of that week (ISO date string)
    const todayET = getETDate();
    const { rows } = await pool.query(
      `WITH week_scores AS (
         SELECT
           u.name,
           u.avatar_url,
           (g.date - ((EXTRACT(DOW FROM g.date)::int + 6) % 7) * INTERVAL '1 day')::date AS week_start,
           COALESCE(SUM(g.score), 0) AS total_score,
           COUNT(*) FILTER (WHERE g.status = 'won') AS wins,
           COUNT(*) AS played
         FROM games g
         JOIN users u ON u.id = g.user_id
         WHERE g.mode = 'daily'
           AND g.status IN ('won', 'lost')
           AND EXTRACT(DOW FROM g.date) BETWEEN 1 AND 5
         GROUP BY u.id, u.name, u.avatar_url, week_start
       ),
       week_meta AS (
         -- count distinct game days per week (to filter stubs)
         SELECT
           (g.date - ((EXTRACT(DOW FROM g.date)::int + 6) % 7) * INTERVAL '1 day')::date AS week_start,
           COUNT(DISTINCT g.date) AS days_in_week
         FROM games g
         WHERE g.mode = 'daily'
           AND g.status IN ('won', 'lost')
           AND EXTRACT(DOW FROM g.date) BETWEEN 1 AND 5
         GROUP BY 1
       ),
       valid_weeks AS (
         -- only weeks where Friday has passed AND at least 2 game days existed
         SELECT wm.week_start FROM week_meta wm
         WHERE wm.days_in_week >= 2
           AND (wm.week_start + INTERVAL '4 days')::date < $1::date
       ),
       ranked AS (
         SELECT ws.*,
           ROW_NUMBER() OVER (PARTITION BY ws.week_start ORDER BY ws.total_score DESC, ws.wins DESC) AS rn
         FROM week_scores ws
         JOIN valid_weeks vw ON ws.week_start = vw.week_start
       )
       SELECT name, avatar_url, week_start, total_score, wins, played
       FROM ranked
       WHERE rn = 1
       ORDER BY week_start ASC`,
      [todayET]
    );
    res.json(rows.map(r => ({
      ...r,
      week_start: r.week_start instanceof Date
        ? r.week_start.toISOString().slice(0, 10)
        : String(r.week_start).slice(0, 10),
    })));
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
       WHERE g.mode = 'daily' AND g.status IN ('won', 'lost')
         AND EXTRACT(DOW FROM g.date) BETWEEN 1 AND 5
       GROUP BY u.id, u.name, u.avatar_url
       ORDER BY wins DESC, avg_guesses ASC
       LIMIT 50`
    );
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/leaderboard/weekly — Mon–Fri current week, ranked by total score
app.get("/api/leaderboard/weekly", async (req, res) => {
  try {
    // Get Monday–Friday of current week in ET
    // All arithmetic done in UTC to avoid timezone shift when converting back via getETDate()
    const todayET = getETDate();
    const [ty, tm, td] = todayET.split("-").map(Number);
    const nowUTC = new Date(Date.UTC(ty, tm - 1, td));
    const day = nowUTC.getUTCDay(); // 0=Sun, 1=Mon...
    const mondayOffset = day === 0 ? -6 : 1 - day;
    const mondayUTC = new Date(Date.UTC(ty, tm - 1, td + mondayOffset));
    const fridayUTC = new Date(Date.UTC(ty, tm - 1, td + mondayOffset + 4));
    const mondayStr = mondayUTC.toISOString().slice(0, 10);
    const fridayStr = fridayUTC.toISOString().slice(0, 10);

    const { rows } = await pool.query(
      `SELECT u.name, u.avatar_url,
              COALESCE(SUM(g.score), 0) AS total_score,
              COUNT(*) FILTER (WHERE g.status = 'won') AS wins,
              COUNT(*) AS played
       FROM games g JOIN users u ON u.id = g.user_id
       WHERE g.mode = 'daily'
         AND g.date >= $1 AND g.date <= $2
         AND g.status IN ('won', 'lost')
       GROUP BY u.id, u.name, u.avatar_url
       ORDER BY total_score DESC, wins DESC
       LIMIT 50`,
      [mondayStr, fridayStr]
    );
    // Enrich with employee info (look up by first name)
    const enrichedWeekly = rows.map(row => {
      const firstName = row.name?.split(" ")[0]?.toUpperCase();
      const empInfo = firstName ? getEmployeeInfo(firstName) : null;
      const emp = Array.isArray(empInfo) ? empInfo.find(e => e.fullName === row.name) || empInfo[0] : empInfo;
      return {
        ...row,
        employee_title: emp?.slackTitle || emp?.title || null,
        employee_department: emp?.department || null,
        employee_full_name: emp?.fullName || row.name,
      };
    });
    res.json(enrichedWeekly);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/stats/weekly-history — user's position in each past completed week
app.get("/api/stats/weekly-history", requireAuth, async (req, res) => {
  try {
    const todayET = getETDate();
    const { rows } = await pool.query(
      `WITH week_scores AS (
         SELECT
           u.id AS user_id,
           u.name,
           u.avatar_url,
           (g.date - ((EXTRACT(DOW FROM g.date)::int + 6) % 7) * INTERVAL '1 day')::date AS week_start,
           COALESCE(SUM(g.score), 0) AS total_score,
           COUNT(*) FILTER (WHERE g.status = 'won') AS wins,
           COUNT(*) AS played
         FROM games g
         JOIN users u ON u.id = g.user_id
         WHERE g.mode = 'daily'
           AND g.status IN ('won', 'lost')
           AND EXTRACT(DOW FROM g.date) BETWEEN 1 AND 5
         GROUP BY u.id, u.name, u.avatar_url, week_start
       ),
       week_meta AS (
         SELECT
           (g.date - ((EXTRACT(DOW FROM g.date)::int + 6) % 7) * INTERVAL '1 day')::date AS week_start,
           COUNT(DISTINCT g.date) AS days_in_week
         FROM games g
         WHERE g.mode = 'daily'
           AND g.status IN ('won', 'lost')
           AND EXTRACT(DOW FROM g.date) BETWEEN 1 AND 5
         GROUP BY 1
       ),
       valid_weeks AS (
         SELECT week_start FROM week_meta
         WHERE days_in_week >= 2
           AND (week_start + INTERVAL '4 days')::date < $2::date
       ),
       ranked AS (
         SELECT ws.*,
           RANK() OVER (PARTITION BY ws.week_start ORDER BY ws.total_score DESC, ws.wins DESC) AS rank,
           COUNT(*) OVER (PARTITION BY ws.week_start) AS total_players
         FROM week_scores ws
         JOIN valid_weeks vw ON ws.week_start = vw.week_start
       )
       SELECT week_start, name, avatar_url, total_score, wins, played, rank, total_players
       FROM ranked
       WHERE user_id = $1
       ORDER BY week_start ASC`,
      [req.user.id, todayET]
    );
    res.json(rows.map(r => ({
      ...r,
      week_start: r.week_start instanceof Date
        ? r.week_start.toISOString().slice(0, 10)
        : String(r.week_start).slice(0, 10),
    })));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/stats — personal stats for logged-in user
app.get("/api/stats", requireAuth, async (req, res) => {
  const mode = req.query.mode === "practice" ? "practice" : "daily";
  try {
    const { rows } = await pool.query(
      `SELECT
         COUNT(*) AS total_games,
         COUNT(*) FILTER (WHERE status = 'won') AS wins,
         COUNT(*) FILTER (WHERE status = 'lost') AS losses,
         ROUND(AVG(guess_count) FILTER (WHERE status = 'won'), 1) AS avg_guesses
       FROM games WHERE user_id = $1 AND mode = $2`,
      [req.user.id, mode]
    );

    // Guess distribution (1–8)
    const { rows: dist } = await pool.query(
      `SELECT guess_count, COUNT(*) AS count
       FROM games WHERE user_id = $1 AND status = 'won' AND mode = $2
       GROUP BY guess_count ORDER BY guess_count`,
      [req.user.id, mode]
    );

    // Streak: only meaningful for daily mode
    const { rows: winDays } = await pool.query(
      `SELECT DISTINCT date FROM games
       WHERE user_id = $1 AND status = 'won' AND mode = $2
       ORDER BY date DESC`,
      [req.user.id, mode]
    );

    let currentStreak = 0, maxStreak = 0, streak = 0;
    const today = getETDate();
    const [ety, etm, etd] = today.split("-").map(Number);
    const yDate = new Date(ety, etm - 1, etd - 1);
    const yesterday = getETDate(yDate);

    if (winDays.length > 0) {
      const dates = winDays.map(r => r.date.toISOString?.().slice(0, 10) ?? r.date);
      // Current streak
      let prev = null;
      for (let i = 0; i < dates.length; i++) {
        const d = dates[i];
        if (i === 0) {
          if (d !== today && d !== yesterday) break; // streak broken
          streak = 1;
        } else {
          const prevDate = new Date(prev);
          const curDate = new Date(d);
          const diffDays = Math.round((prevDate - curDate) / 86400000);
          if (diffDays === 1) { streak++; }
          else break;
        }
        prev = d;
      }
      currentStreak = streak;

      // Max streak
      streak = 1;
      for (let i = 1; i < dates.length; i++) {
        const prevDate = new Date(dates[i - 1]);
        const curDate = new Date(dates[i]);
        const diffDays = Math.round((prevDate - curDate) / 86400000);
        if (diffDays === 1) { streak++; }
        else { maxStreak = Math.max(maxStreak, streak); streak = 1; }
      }
      maxStreak = Math.max(maxStreak, streak);
    }

    const total = parseInt(rows[0].total_games);
    const wins = parseInt(rows[0].wins);
    res.json({
      played: total,
      wins,
      winPct: total > 0 ? Math.round((wins / total) * 100) : 0,
      currentStreak,
      maxStreak,
      avgGuesses: rows[0].avg_guesses,
      distribution: dist,
    });
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
