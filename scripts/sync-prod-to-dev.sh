#!/bin/bash
# sync-prod-to-dev.sh
# Dumps prod Railway DB and restores into local dev DB (pfwordle_dev).
# Usage: bash scripts/sync-prod-to-dev.sh

set -e

DEV_DB="pfwordle_dev"
DUMP_FILE="/tmp/pfwordle_prod_dump.sql"

echo "▶ Linking to Railway Postgres service..."
cd "$(dirname "$0")/.."
railway service Postgres

echo "▶ Dumping prod DB via railway ssh..."
railway ssh -- pg_dump --username postgres --no-password --no-owner --no-acl railway > "$DUMP_FILE"
echo "   Dump: $(wc -l < "$DUMP_FILE") lines"

echo "▶ Stopping local dev server (if running)..."
pkill -f "nodemon.*server/index.js" 2>/dev/null || true
sleep 1

echo "▶ Dropping and recreating local dev DB..."
psql postgres -c "DROP DATABASE IF EXISTS $DEV_DB;"
psql postgres -c "CREATE DATABASE $DEV_DB OWNER collinsc;"

echo "▶ Restoring into $DEV_DB..."
psql "$DEV_DB" < "$DUMP_FILE"

echo "✅ Done — local dev DB is now a copy of prod."
echo "   Run 'npm run dev' to start the dev server."
