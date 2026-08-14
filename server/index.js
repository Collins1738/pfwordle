const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { getRandomWordOfLength, isValidWord, VALID_BY_LENGTH } = require("./words");
const { EMPLOYEE_MAP } = require("./names");

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

// Build a lookup map from first name → roster row (avatar, department, slackTitle)
const rosterByFirst = {};
try {
  const rosterRaw = fs.readFileSync(path.join(__dirname, "roster.csv"), "utf8").replace(/\r/g, "");
  const rosterLines = rosterRaw.trim().split("\n");
  const rHeaders = rosterLines[0].split(",");
  const ri = (h) => rHeaders.indexOf(h);
  for (let i = 1; i < rosterLines.length; i++) {
    const parts = rosterLines[i].split(",");
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
app.use(cors());
app.use(express.json());

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

// POST /api/game/start — start a new game
// Body: { word?: string }  — if provided, use that word (company name mode)
//       { length?: number } — if provided, pick random word of that length (default 5)
app.post("/api/game/start", (req, res) => {
  const sessionId = generateSessionId();
  let word;

  // daily mode: use today's Permitflow name
  if (req.body && req.body.daily) {
    word = getAnswerWord(getDailyName());
  } else if (req.body && req.body.word) {
    word = req.body.word.toUpperCase().trim();
    if (!/^[A-Z]{3,8}$/.test(word)) {
      return res.status(400).json({ error: "Word must be 3–8 letters" });
    }
  } else if (!word) {
    // Random Permitflow name
    const randomFirst = PERMITFLOW_NAMES[Math.floor(Math.random() * PERMITFLOW_NAMES.length)];
    word = getAnswerWord(randomFirst);
  }

  const maxGuesses = Math.max(6, word.length); // more guesses for longer words

  sessions.set(sessionId, {
    word,
    wordLength: word.length,
    guesses: [],
    status: "playing",
    maxGuesses,
  });

  res.json({ sessionId, wordLength: word.length, maxGuesses });
});

// POST /api/game/:sessionId/guess
app.post("/api/game/:sessionId/guess", (req, res) => {
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
    const headers = lines[0].split(",");
    const idx = (h) => headers.indexOf(h);
    const employees = [];
    const seen = new Set();
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(",");
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
