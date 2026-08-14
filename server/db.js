const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === "production" ? { rejectUnauthorized: false } : false,
});

async function migrate() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      google_id TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      avatar_url TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS games (
      id SERIAL PRIMARY KEY,
      user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
      date DATE NOT NULL,
      word TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'playing', -- playing | won | lost
      guess_count INTEGER,
      duration_seconds INTEGER,
      started_at TIMESTAMPTZ DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      UNIQUE(user_id, date)
    );

    -- Add session_id column if it doesn't exist (idempotent)
    ALTER TABLE games ADD COLUMN IF NOT EXISTS session_id TEXT;

    -- Add mode column (daily | practice)
    ALTER TABLE games ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'daily';

    CREATE TABLE IF NOT EXISTS guesses (
      id SERIAL PRIMARY KEY,
      game_id INTEGER REFERENCES games(id) ON DELETE CASCADE,
      guess TEXT NOT NULL,
      result JSONB NOT NULL,
      guessed_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log("DB migrated ✓");
}

module.exports = { pool, migrate };
