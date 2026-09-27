# Permitdle — TODO

## Known Issues / Tech Debt

### 🖼️ Avatar URL expiration (Slack CDN)
- Slack CDN avatar URLs (`slack-edge.com`) expire and return 403 after some time
- Currently storing raw Slack URLs in `employees.avatar_url` — these break silently
- **Fix:** Cache avatars to Cloudflare R2 (or S3) on first sync, store stable R2 URL instead
  - Write a migration script: download each avatar, upload to R2, update `employees.avatar_url`
  - On future syncs, only re-download if the Slack URL has changed
  - Gravatar URLs (e.g. Kenta) are stable and don't need caching
- Short-term workaround: re-export roster CSV with fresh URLs and re-run sync-roster

## Next session
- [ ] Push to GitHub repo + deploy (Railway or Vercel)

## Feature ideas

### 📸 Employee photo reveal
- Pull employee photos (from Slack workspace or Google directory)
- Show a blurred photo of today's person as a hint
- Progressively unblur as the player makes more guesses (more guesses = clearer photo)
- Full unblurred photo revealed in the win/loss modal

### 🃏 Multi-person name reveal
- If a first name belongs to multiple employees (e.g. two "Alex"es), show all their employee cards in the result screen
- Cards should animate in with a cool staggered effect (e.g. fan out, cascade, or flip in sequence)
- Already partially supported — `employee` field can be an array; result screen just needs to handle multiple cards

### 🎯 Score cap review
- Currently capped at 1000 via `Math.min(1000, base + timeBonus)` — consider raising or removing the cap so 1-guess + fast completion is meaningfully rewarded above slower 1-guess wins

### Other ideas
- [ ] Share button (copy emoji grid like real Wordle)
- [ ] Stats tracking (streak, win %, guess distribution) — localStorage
- [ ] Hard mode toggle
- [ ] Daily mode as default for prod (same name for everyone, rotates at midnight ET)
- [ ] Hint: show department as a clue after X failed guesses
