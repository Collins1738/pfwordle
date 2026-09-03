// seed-daily.js — inserts dummy daily leaderboard entries for today
// Usage: node seed-daily.js
// Safe to re-run: skips users/games that already exist

require("dotenv").config();
const { pool } = require("./db");
const { getRandomWordOfLength } = require("./words");

function getETDate(d = new Date()) {
  return d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });
}

const TODAY = getETDate();

// Fake players with plausible Permitflow-ish details
const FAKE_PLAYERS = [
  { name: "Aisha Patel",     email: "aisha.patel@fake.permitflow.com",     avatar: "https://i.pravatar.cc/80?img=47", guesses: 2, duration: 42,   score: 1100 },
  { name: "Marcus Chen",    email: "marcus.chen@fake.permitflow.com",     avatar: "https://i.pravatar.cc/80?img=12", guesses: 3, duration: 118,  score: 900  },
  { name: "Zoe Williams",   email: "zoe.williams@fake.permitflow.com",    avatar: "https://i.pravatar.cc/80?img=32", guesses: 4, duration: 340,  score: 750  },
  { name: "Raj Mehta",      email: "raj.mehta@fake.permitflow.com",       avatar: "https://i.pravatar.cc/80?img=60", guesses: 4, duration: 650,  score: 680  },
  { name: "Priya Sharma",   email: "priya.sharma@fake.permitflow.com",    avatar: "https://i.pravatar.cc/80?img=44", guesses: 5, duration: 810,  score: 600  },
  { name: "Tyler Brooks",   email: "tyler.brooks@fake.permitflow.com",    avatar: "https://i.pravatar.cc/80?img=15", guesses: 5, duration: 1200, score: 550  },
  { name: "Mei Lin",        email: "mei.lin@fake.permitflow.com",         avatar: "https://i.pravatar.cc/80?img=56", guesses: 6, duration: 1800, score: 500  },
  { name: "Jordan Taylor",  email: "jordan.taylor@fake.permitflow.com",   avatar: "https://i.pravatar.cc/80?img=22", guesses: 6, duration: 2400, score: 470  },
  { name: "Nina Rossi",     email: "nina.rossi@fake.permitflow.com",      avatar: "https://i.pravatar.cc/80?img=49", guesses: 3, duration: 200,  score: 820  },
  { name: "Kwame Asante",   email: "kwame.asante@fake.permitflow.com",    avatar: "https://i.pravatar.cc/80?img=68", guesses: 2, duration: 55,   score: 1050 },
  { name: "Sofia Cruz",     email: "sofia.cruz@fake.permitflow.com",      avatar: "https://i.pravatar.cc/80?img=41", guesses: 6, duration: 3600, score: 440  },
  { name: "Ben Larsen",     email: "ben.larsen@fake.permitflow.com",      avatar: "https://i.pravatar.cc/80?img=8",  guesses: 4, duration: 480,  score: 710  },
  { name: "Divya Nair",     email: "divya.nair@fake.permitflow.com",      avatar: "https://i.pravatar.cc/80?img=36", guesses: 5, duration: 900,  score: 580  },
  { name: "Carlos Reyes",   email: "carlos.reyes@fake.permitflow.com",    avatar: "https://i.pravatar.cc/80?img=18", status: "lost", guesses: 6, duration: 4200, score: 0 },
  { name: "Amara Osei",     email: "amara.osei@fake.permitflow.com",      avatar: "https://i.pravatar.cc/80?img=53", guesses: 3, duration: 160,  score: 860  },
];

// Minimal plausible guess data (5-letter word, all "absent" except last = correct answer)
function makeGuesses(count, word = "GRANT") {
  const fillers = ["CRANE", "BLAST", "FLOUT", "MIXED", "VAPOR", "WINDY"];
  const result = [];
  for (let i = 0; i < count - 1; i++) {
    const g = fillers[i % fillers.length];
    result.push({
      guess: g,
      result: g.split("").map((l, j) => ({
        letter: l,
        status: l === word[j] ? "correct" : word.includes(l) ? "present" : "absent",
      })),
    });
  }
  // Final guess = correct answer (or a wrong last guess if lost)
  const last = word;
  result.push({
    guess: last,
    result: last.split("").map((l, j) => ({ letter: l, status: "correct" })),
  });
  return result;
}

async function seed() {
  const WORD = "GRANT"; // today's dummy answer word

  for (const p of FAKE_PLAYERS) {
    const status = p.status || "won";
    const guessRows = makeGuesses(p.guesses, WORD);

    // Upsert user
    const { rows: [user] } = await pool.query(
      `INSERT INTO users (google_id, email, name, avatar_url)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name, avatar_url = EXCLUDED.avatar_url
       RETURNING id`,
      [`fake-${p.email}`, p.email, p.name, p.avatar]
    );

    // Insert game (skip if already exists for today)
    const { rows: [game] } = await pool.query(
      `INSERT INTO games (user_id, date, word, status, guess_count, duration_seconds, score, mode, session_id, completed_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'daily', gen_random_uuid()::text, NOW())
       ON CONFLICT DO NOTHING
       RETURNING id`,
      [user.id, TODAY, WORD, status, p.guesses, p.duration, p.score]
    );

    if (!game) {
      console.log(`⏭  skipped ${p.name} (already has a game today)`);
      continue;
    }

    // Insert guesses
    for (const g of guessRows) {
      await pool.query(
        `INSERT INTO guesses (game_id, guess, result) VALUES ($1, $2, $3)`,
        [game.id, g.guess, JSON.stringify(g.result)]
      );
    }

    console.log(`✅ seeded ${p.name} (${status}, ${p.guesses} guesses, score: ${p.score})`);
  }

  console.log("\nDone! Check /leaderboard/daily in the app.");
  await pool.end();
}

seed().catch(e => { console.error(e); process.exit(1); });
