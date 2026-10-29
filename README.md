# Count Drive — hands-free blackjack counting trainer

Play blackjack by voice and practice the Hi-Lo running count without looking at the screen.

**Play:** https://adventrex.github.io/blackjack-voice-trainer/ (iPhone: Safari, with Siri & Dictation turned on)

- Every card is read aloud; you say hit / stand / double / split.
- After each hand: "Running count?" — answer out loud, then hear the real count.
- 80% over your last 20 count checks adds another player (up to 7).
- Voice commands: repeat, score, pause / resume, add a player, remove a player, slower, faster.

Plain HTML + the browser's built-in Web Speech API. No build step, no server.
`node test.js` checks basic strategy and the speech parsing.
