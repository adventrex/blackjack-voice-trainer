// Run: node test.js
const L = require('./logic.js');
const assert = require('assert');
const C = rs => rs.map(r => ({ r, s: '♠' }));
const bs = (h, up, d = true, p = true) => L.basicStrategy(C(h), { r: up, s: '♠' }, d, p);

// Hi-Lo
assert.deepStrictEqual(['2','6','7','9','10','J','A'].map(L.hiLo), [1,1,0,0,-1,-1,-1]);
assert.strictEqual(L.makeShoe(6).reduce((n, c) => n + L.hiLo(c.r), 0), 0); // balanced count
assert.strictEqual(L.makeShoe(6).length, 312);
// Hand values
assert.deepStrictEqual(L.handValue(C(['A','6'])), { total: 17, soft: true });
assert.deepStrictEqual(L.handValue(C(['A','6','10'])), { total: 17, soft: false });
assert.deepStrictEqual(L.handValue(C(['A','A','9'])), { total: 21, soft: true });
// Basic strategy spot checks (6D S17 DAS)
const cases = [
  [['10','6'],'9','H'], [['10','6'],'6','S'], [['10','2'],'3','H'], [['10','2'],'4','S'],
  [['6','5'],'10','D'], [['6','5'],'A','H'], [['6','4'],'10','H'], [['5','4'],'3','D'], [['5','4'],'2','H'],
  [['A','7'],'2','S'], [['A','7'],'6','D'], [['A','7'],'9','H'], [['A','6'],'3','D'], [['A','2'],'4','H'],
  [['A','A'],'A','P'], [['8','8'],'10','P'], [['9','9'],'7','S'], [['9','9'],'8','P'], [['10','K'],'6','S'],
  [['5','5'],'9','D'], [['4','4'],'5','P'], [['7','7'],'8','H'], [['2','2'],'7','P'],
];
for (const [h, up, want] of cases) assert.strictEqual(bs(h, up), want, `${h} vs ${up}`);
assert.strictEqual(bs(['A','7'],'6',false), 'S'); // can't double soft 18 -> stand
assert.strictEqual(bs(['6','5'],'6',false), 'H');
assert.strictEqual(bs(['8','8'],'10',true,false), 'H'); // can't split 16 -> hit
// Count parsing
const counts = {
  'plus three': 3, 'Plus 3': 3, '+3': 3, '-2': -2, '−4': -4, 'minus two': -2, 'negative five': -5,
  'zero': 0, '0': 0, 'even': 0, 'three': 3, 'minus to': -2, 'minus for': -4, 'plus twenty one': 21,
  'I think minus 7': -7, 'Minus 12': -12, 'banana': null, 'mine is 3': -3,
};
for (const [t, want] of Object.entries(counts)) assert.strictEqual(L.parseCount(t), want, t);
// Actions & commands
const acts = { 'hit': 'H', 'Hit me': 'H', 'it': 'H', 'stand': 'S', 'stay': 'S', 'double down': 'D', 'split': 'P', 'banana': null };
for (const [t, want] of Object.entries(acts)) assert.strictEqual(L.parseAction(t), want, t);
const cmds = { 'add a player': 'addPlayer', 'remove a player': 'removePlayer', 'repeat that': 'repeat', 'pause': 'pause', "how am I doing": 'score', 'hit': null, 'minus three': null };
for (const [t, want] of Object.entries(cmds)) assert.strictEqual(L.parseCommand(t), want, t);
console.log('all logic tests passed');
// Every strategy spot has a non-empty explanation for every wrong choice
for (const h of [['10','6'],['A','7'],['8','8'],['10','10'],['5','5'],['6','5'],['9','9'],['10','2'],['A','A']])
  for (const up of ['2','5','7','10','A']) {
    const rec = bs(h, up);
    for (const ch of ['H','S','D','P']) if (ch !== rec) {
      const e = L.explainPlay(C(h), { r: up, s: '♠' }, rec, ch);
      assert.ok(e && e.length > 20 && !/undefined|NaN/.test(e), `${h} vs ${up} ${ch}: ${e}`);
    }
  }
console.log('explanations ok');
// Betting
assert.strictEqual(L.trueCount(6, 156), 2);           // +6 with 3 decks left
assert.strictEqual(L.edgePct(1), 0);
assert.deepStrictEqual([-3, 0, 1.9, 2, 2.9, 3.5, 4.1, 5, 9].map(L.correctBet), [1, 1, 1, 2, 2, 4, 6, 8, 8]);
const bets = { 'two': 2, 'two units': 2, '4': 4, 'thirty dollars': 3, '$40': 4, 'minimum': 1, 'one': 1, 'max': 8, 'banana': null };
for (const [t, want] of Object.entries(bets)) assert.strictEqual(L.parseBet(t, 10), want, t);
console.log('betting ok');
