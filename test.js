// node test.js — checks the two edge cases by hand, then simulates full games.

const fs = require('fs')
const { recommend, filterCandidates, scoreGuess } = require('./solver.js')

const window = {}
eval(fs.readFileSync(__dirname + '/words.js', 'utf8'))
const WORDS = window.VALID_WORDS

function assert(label, cond) {
  console.log(`${cond ? 'ok  ' : 'FAIL'}  ${label}`)
  if (!cond) process.exitCode = 1
}

// --- the колір / кубок case -------------------------------------------------
const colors = scoreGuess('кубок', 'колір')
assert(`кубок vs колір scores к,у,б,о,к -> ${colors.join(',')}`,
  colors.join(',') === 'green,black,black,yellow,black')

const survivors = filterCandidates(WORDS, 'кубок', colors)
assert('колір survives its own feedback', survivors.includes('колір'))

// --- repeated letters score once --------------------------------------------
const { letterFrequencies, scoreWord } = require('./solver.js')
const freq = letterFrequencies(WORDS)
const doubled = [...WORDS].find(w => new Set(w).size === 4)
assert(`repeated letter counted once (${doubled})`,
  Math.abs(scoreWord(doubled, freq) -
    [...new Set(doubled)].reduce((s, c) => s + freq.get(c), 0)) < 1e-12)

// --- full-game simulation ----------------------------------------------------
function solve(answer, maxTurns = 6) {
  let candidates = WORDS
  for (let turn = 1; turn <= maxTurns; turn++) {
    const guess = recommend(candidates)
    if (guess === null) return { solved: false, turns: turn, dead: true }
    const c = scoreGuess(guess, answer)
    if (c.every(x => x === 'green')) return { solved: true, turns: turn }
    candidates = filterCandidates(candidates, guess, c)
  }
  return { solved: false, turns: maxTurns }
}

// Deterministic spread across the dictionary rather than a random sample.
const step = Math.floor(WORDS.length / 300)
const sample = WORDS.filter((_, i) => i % step === 0)

let solved = 0
const dist = {}
let worst = []
for (const answer of sample) {
  const r = solve(answer)
  if (r.solved) {
    solved++
    dist[r.turns] = (dist[r.turns] || 0) + 1
  } else {
    worst.push(answer)
  }
}

console.log(`\ndictionary: ${WORDS.length} words`)
console.log(`sample:     ${sample.length} answers`)
console.log(`solved:     ${solved}/${sample.length} (${(100 * solved / sample.length).toFixed(1)}%)`)
console.log(`avg turns:  ${(Object.entries(dist).reduce((s, [t, n]) => s + t * n, 0) / solved).toFixed(2)}`)
console.log('turns:     ', Object.keys(dist).sort().map(t => `${t}:${dist[t]}`).join('  '))
if (worst.length) console.log(`failed:     ${worst.slice(0, 15).join(' ')}${worst.length > 15 ? ' …' : ''}`)
