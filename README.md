# Count Drive — hands-free blackjack counting trainer

Play blackjack by voice ($5 units, $500 starting bankroll) and practice the Hi-Lo running count without looking at the screen.

**Play:** https://adventrex.github.io/blackjack-voice-trainer/ (iPhone: Safari, with Siri & Dictation turned on)

- Every card is read aloud; you say hit / stand / double / split.
- Quiet table: only cards are read, unless you make a mistake.
- After each hand: "Count?" — answer out loud, then hear the real count.
- 80% over your last 20 count checks adds another player (up to 7).
- Voice commands: repeat, score, pause / resume, add a player, remove a player, slower, faster.

Plain HTML + the browser's built-in Web Speech API. No build step, no server.
`node test.js` checks basic strategy and the speech parsing.
