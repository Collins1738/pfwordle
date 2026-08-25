# Permitdle — TODO

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
