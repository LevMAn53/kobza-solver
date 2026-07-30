// Кобза solver — scoring and filtering.
// Pure functions, no DOM. Loaded by index.html and by test.js.

// Fraction of words containing each letter. A letter is counted once per word
// however many times it appears, so a doubled letter earns no extra credit.
function letterFrequencies(words) {
  const counts = new Map()
  for (const word of words) {
    for (const ch of new Set(word)) {
      counts.set(ch, (counts.get(ch) || 0) + 1)
    }
  }
  const freq = new Map()
  for (const [ch, n] of counts) {
    freq.set(ch, n / words.length)
  }
  return freq
}

function scoreWord(word, freq) {
  let total = 0
  for (const ch of new Set(word)) {
    total += freq.get(ch) || 0
  }
  return total
}

// Highest-scoring word in the candidate list, or null if the list is empty.
function recommend(candidates) {
  if (candidates.length === 0) return null
  const freq = letterFrequencies(candidates)
  let best = null
  let bestScore = -1
  for (const word of candidates) {
    const score = scoreWord(word, freq)
    if (score > bestScore) {
      bestScore = score
      best = word
    }
  }
  return best
}

// colors: array of 5 strings, each 'green' | 'yellow' | 'black'.
function filterCandidates(candidates, guess, colors) {
  const letters = [...guess]

  const greens = []
  const yellows = []
  const seenElsewhere = new Set()

  for (let i = 0; i < letters.length; i++) {
    if (colors[i] === 'green') {
      greens.push([i, letters[i]])
      seenElsewhere.add(letters[i])
    } else if (colors[i] === 'yellow') {
      yellows.push([i, letters[i]])
      seenElsewhere.add(letters[i])
    }
  }

  // A black letter that also came back green or yellow in this same guess tells
  // us only that there are no *further* copies. We drop that constraint rather
  // than risk excluding the answer.
  const blacks = new Set()
  for (let i = 0; i < letters.length; i++) {
    if (colors[i] === 'black' && !seenElsewhere.has(letters[i])) {
      blacks.add(letters[i])
    }
  }

  return candidates.filter(word => {
    const chars = [...word]
    for (const [pos, ch] of greens) {
      if (chars[pos] !== ch) return false
    }
    // Yellow says the letter is in the word AND not in this slot.
    for (const [pos, ch] of yellows) {
      if (!chars.includes(ch)) return false
      if (chars[pos] === ch) return false
    }
    for (const ch of blacks) {
      if (chars.includes(ch)) return false
    }
    return true
  })
}

// How Кобза colors a guess. Used by the tests; the app gets colors from the user.
function scoreGuess(guess, answer) {
  const g = [...guess]
  const a = [...answer]
  const colors = new Array(g.length).fill('black')
  const pool = []

  for (let i = 0; i < g.length; i++) {
    if (g[i] === a[i]) colors[i] = 'green'
    else pool.push(a[i])
  }
  for (let i = 0; i < g.length; i++) {
    if (colors[i] === 'green') continue
    const at = pool.indexOf(g[i])
    if (at >= 0) {
      colors[i] = 'yellow'
      pool.splice(at, 1)
    }
  }
  return colors
}

if (typeof module !== 'undefined') {
  module.exports = { letterFrequencies, scoreWord, recommend, filterCandidates, scoreGuess }
}
