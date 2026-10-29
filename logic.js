// Pure game logic: cards, Hi-Lo, basic strategy, and speech-to-answer parsing.
// Loaded by index.html in the browser and by test.js under Node.

const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];
const SUITS = ['♠', '♥', '♦', '♣'];
const RANK_WORD = { A: 'Ace', J: 'Jack', Q: 'Queen', K: 'King' };

const hiLo = r => ('23456'.includes(r) && r.length === 1 ? 1 : '789'.includes(r) && r.length === 1 ? 0 : -1);
const cardVal = r => (r === 'A' ? 1 : ['10', 'J', 'Q', 'K'].includes(r) ? 10 : +r);
const rankWord = r => RANK_WORD[r] || r;

function handValue(cards) {
  let total = 0, ace = false;
  for (const c of cards) { total += cardVal(c.r); if (c.r === 'A') ace = true; }
  const soft = ace && total + 10 <= 21;
  return { total: soft ? total + 10 : total, soft };
}

function makeShoe(decks, rand = Math.random) {
  const shoe = [];
  for (let d = 0; d < decks; d++) for (const s of SUITS) for (const r of RANKS) shoe.push({ r, s });
  for (let i = shoe.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [shoe[i], shoe[j]] = [shoe[j], shoe[i]];
  }
  return shoe;
}

// Multi-deck, dealer stands soft 17, double after split, no surrender.
// Returns 'H' hit, 'S' stand, 'D' double, 'P' split.
function basicStrategy(cards, up, canDouble, canSplit) {
  const u = up.r === 'A' ? 11 : cardVal(up.r);
  const dbl = alt => (canDouble ? 'D' : alt);
  if (canSplit && cards.length === 2 && cardVal(cards[0].r) === cardVal(cards[1].r)) {
    const p = cardVal(cards[0].r);
    if (p === 1 || p === 8) return 'P';
    if (p === 9 && u !== 7 && u !== 10 && u !== 11) return 'P';
    if (p === 7 && u <= 7) return 'P';
    if (p === 6 && u <= 6) return 'P';
    if (p === 4 && (u === 5 || u === 6)) return 'P';
    if ((p === 2 || p === 3) && u <= 7) return 'P';
  }
  const { total, soft } = handValue(cards);
  if (soft) {
    if (total >= 19) return 'S';
    if (total === 18) return u >= 3 && u <= 6 ? dbl('S') : u <= 8 ? 'S' : 'H';
    if (total === 17) return u >= 3 && u <= 6 ? dbl('H') : 'H';
    if (total >= 15) return u >= 4 && u <= 6 ? dbl('H') : 'H';
    if (total >= 13) return u >= 5 && u <= 6 ? dbl('H') : 'H';
    return 'H';
  }
  if (total >= 17) return 'S';
  if (total >= 13) return u <= 6 ? 'S' : 'H';
  if (total === 12) return u >= 4 && u <= 6 ? 'S' : 'H';
  if (total === 11) return u <= 10 ? dbl('H') : 'H';
  if (total === 10) return u <= 9 ? dbl('H') : 'H';
  if (total === 9) return u >= 3 && u <= 6 ? dbl('H') : 'H';
  return 'H';
}

const ACTION_WORD = { H: 'hit', S: 'stand', D: 'double', P: 'split' };

// ---- Speech parsing ----

const NUM = {
  zero: 0, oh: 0, even: 0, neutral: 0, nothing: 0, none: 0,
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16,
  seventeen: 17, eighteen: 18, nineteen: 19, twenty: 20, thirty: 30,
};
// Words recognition often hears instead of a number. Only used if nothing better is found.
const SOUNDS_LIKE = { won: 1, to: 2, too: 2, tree: 3, free: 3, for: 4, fore: 4, ate: 8 };
const MINUS = new Set(['minus', 'negative', 'neg', 'mine', 'mines', 'minors', 'mynas', '-']);
const PLUS = new Set(['plus', 'positive', 'pos', 'plush', '+']);

function parseCount(text) {
  const tokens = String(text).toLowerCase()
    .replace(/[−–—]/g, '-')
    .replace(/([+-])(\d)/g, '$1 $2')
    .replace(/[,.!?"]/g, ' ')
    .split(/\s+/).filter(Boolean);
  for (const dict of [NUM, SOUNDS_LIKE]) {
    let sign = 1;
    for (let i = 0; i < tokens.length; i++) {
      const tok = tokens[i];
      if (MINUS.has(tok)) { sign = -1; continue; }
      if (PLUS.has(tok)) { sign = 1; continue; }
      let n = /^\d+$/.test(tok) ? +tok : dict[tok];
      if (n === undefined) continue;
      if ((n === 20 || n === 30) && NUM[tokens[i + 1]] > 0 && NUM[tokens[i + 1]] < 10) n += NUM[tokens[i + 1]];
      return n === 0 ? 0 : sign * n;
    }
  }
  return null;
}

function parseAction(text) {
  const t = ' ' + String(text).toLowerCase().replace(/[,.!?]/g, ' ') + ' ';
  if (/\b(double|doubles|doubled|doubling|dub)\b/.test(t)) return 'D';
  if (/\b(split|splits|splitting|spit)\b/.test(t)) return 'P';
  if (/\b(stand|stands|standing|stay|stays|stan|stan's)\b/.test(t)) return 'S';
  if (/\b(hit|hits|hitting|hip|hid|hint|card)\b/.test(t) || t.trim() === 'it') return 'H';
  return null;
}

function parseCommand(text) {
  const t = String(text).toLowerCase();
  if (/\b(add|another|more) (a |another )?(player|seat)s?\b/.test(t) || /\bmore players\b/.test(t)) return 'addPlayer';
  if (/\b(remove|drop|fewer|less|minus) (a |one )?(player|seat)s?\b/.test(t)) return 'removePlayer';
  if (/\b(repeat|say (that |it )?again|what was that)\b/.test(t)) return 'repeat';
  if (/\b(score|stats|status|how am i doing|accuracy)\b/.test(t)) return 'score';
  if (/\b(slower|slow down)\b/.test(t)) return 'slower';
  if (/\b(faster|speed up)\b/.test(t)) return 'faster';
  if (/\b(pause|hold on|wait|stop)\b/.test(t)) return 'pause';
  return null;
}

const isResume = text => /\b(resume|go|continue|start|ready|play|unpause|deal|okay|ok)\b/.test(String(text).toLowerCase());

const countWords = n => (n > 0 ? `plus ${n}` : n < 0 ? `minus ${-n}` : 'zero');

if (typeof module !== 'undefined') {
  module.exports = { hiLo, cardVal, rankWord, handValue, makeShoe, basicStrategy, ACTION_WORD,
    parseCount, parseAction, parseCommand, isResume, countWords };
}
