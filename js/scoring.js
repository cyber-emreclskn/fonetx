/**
 * Phonetic scoring engine — no DOM, no side effects.
 * Safe to reuse on the server side (Node.js) without modification.
 *
 * Pipeline:
 *   1. Turkish source word  → phoneme array  via trToPhonemes()
 *   2. Player’s typed input  → phoneme array  via enToPhonemes()
 *   3. Arrays compared with weighted Levenshtein where
 *      acoustically similar phonemes cost less than dissimilar ones.
 *
 * This means scoring reflects HOW SIMILAR THE SOUNDS ARE,
 * not how similar the spellings are.
 *
 * Example:
 *   “bahçe”  → TR phonemes → [b, a, h, tʃ, e]
 *   “bahche” → EN phonemes → [b, a, h, tʃ, e]  → score 100
 *   “bahjeh” → EN phonemes → [b, a, h, dʒ, e, h] → score ~85
 *            (dʒ vs tʃ: only voicing diff → cost 0.25, extra h → cost 0.75)
 */

/* ─────────────────────────────────────────
 * 1. PHONEME SYMBOLS (readable string tokens)           *
 * ───────────────────────────────────────── */
//   Affricates  : 'tS' = /tʃ/ (ç)   'dZ' = /dʒ/ (c)
//   Fricatives  : 'S'  = /ʃ/ (ş)    'Z'  = /ʒ/ (j)
//   Turkish ı    : 'W'  = /ɯ/
//   Turkish ö    : 'O2' = /ø/
//   Turkish ü    : 'U2' = /y/
//   Glide y     : 'J'  = /j/

/* ─────────────────────────────────────────
 * 2. TURKISH → PHONEME                                  *
 * One-to-one; Turkish spelling is fully phonetic.        *
 * ───────────────────────────────────────── */
const TR_MAP = {
  a:'a', e:'e', i:'i', ı:'W', o:'o', ö:'O2', u:'u', ü:'U2',
  b:'b', c:'dZ', ç:'tS', d:'d', f:'f',  g:'g', ğ:null,
  h:'h', j:'Z',  k:'k',  l:'l', m:'m',  n:'n', p:'p',
  r:'r', s:'s',  ş:'S',  t:'t', v:'v',  y:'J', z:'z',
};

/**
 * Convert a Turkish word to a phoneme array.
 * @param {string} word
 * @returns {string[]}
 */
export function trToPhonemes(word) {
  return word.toLowerCase().split('').reduce((arr, ch) => {
    const p = TR_MAP[ch];
    if (p !== undefined && p !== null) arr.push(p);
    return arr;
  }, []);
}

/* ─────────────────────────────────────────
 * 3. ENGLISH (player input) → PHONEME                   *
 * Player types phonetically, not real English words.     *
 * Multi-char clusters checked BEFORE single chars.       *
 * ───────────────────────────────────────── */
const EN_CLUSTERS = {
  // 3-char
  'tch': 'tS',
  // 2-char
  'ch':  'tS',   // bahche  → same as Turkish ç
  'sh':  'S',    // sheker  → same as Turkish ş
  'ph':  'f',
  'ck':  'k',
  'qu':  'k',
  'zh':  'Z',    // measure → same as Turkish j
  'dj':  'dZ',   // same as Turkish c
  'gh':  '',     // silent in rough/though (drop)
  'wh':  'w',
  'th':  't',    // simplified
  'oo':  'u',    // moon
  'ee':  'i',    // see
  'oe':  'O2',   // ö alternative
  'ue':  'U2',   // ü alternative
};

const EN_SINGLE = {
  a:'a', b:'b', c:'k', d:'d', e:'e', f:'f', g:'g', h:'h',
  i:'i', j:'dZ', k:'k', l:'l', m:'m', n:'n', o:'o', p:'p',
  q:'k', r:'r', s:'s', t:'t', u:'u', v:'v', w:'w', x:'ks',
  y:'J', z:'z',
};

/**
 * Convert a player’s English-typed text to a phoneme array.
 * @param {string} text
 * @returns {string[]}
 */
export function enToPhonemes(text) {
  const s = text.toLowerCase().replace(/[^a-z]/g, '');
  const phonemes = [];
  let i = 0;
  while (i < s.length) {
    const t3 = s.slice(i, i + 3);
    const t2 = s.slice(i, i + 2);
    const t1 = s[i];
    if (t3.length === 3 && EN_CLUSTERS[t3] !== undefined) {
      if (EN_CLUSTERS[t3]) phonemes.push(EN_CLUSTERS[t3]);
      i += 3;
    } else if (EN_CLUSTERS[t2] !== undefined) {
      if (EN_CLUSTERS[t2]) phonemes.push(EN_CLUSTERS[t2]);
      i += 2;
    } else if (EN_SINGLE[t1]) {
      // 'x' produces two phonemes 'k','s'
      EN_SINGLE[t1].split('').forEach(p => phonemes.push(p));
      i += 1;
    } else {
      i += 1;
    }
  }
  return phonemes;
}

/* ─────────────────────────────────────────
 * 4. PHONEME DISTANCE (0 = identical, 1 = fully diff)   *
 * Based on articulatory phonetics:                       *
 *   0.25 → voiced/unvoiced pair (b/p, d/t, tS/dZ ...)   *
 *   0.40 → same place, different manner (tS/S, dZ/Z)    *
 *   0.30 → adjacent vowels (i/e, o/u ...)               *
 *   1.00 → unrelated sounds                             *
 * ───────────────────────────────────────── */
const PHONEME_DIST = {
  // Voiced / unvoiced pairs
  b: {p: .25}, p: {b: .25},
  d: {t: .25}, t: {d: .25},
  g: {k: .25}, k: {g: .25},
  v: {f: .25}, f: {v: .25},
  z: {s: .25}, s: {z: .25},
  Z: {S: .25}, S: {Z: .25, tS: .40},
  dZ:{tS:.25, Z: .40},
  tS:{dZ:.25, S: .40},
  // Vowel proximity
  i: {e: .30, W: .30, U2: .40},
  e: {i: .30, a: .35},
  a: {e: .35, o: .50},
  o: {u: .30, O2:.30, a: .50},
  u: {o: .30, U2:.30, W: .30},
  W: {i: .30, u: .30},    // Turkish ı
  O2:{o: .30, U2:.35},    // Turkish ö
  U2:{u: .30, O2:.35, i: .40}, // Turkish ü
  // Nasal / liquid (very similar)
  m: {n: .40},
  n: {m: .40},
  l: {r: .50},
  r: {l: .50},
};

/**
 * Acoustic distance between two phoneme tokens.
 * @param {string} p1
 * @param {string} p2
 * @returns {number} 0–1
 */
export function phonemeDistance(p1, p2) {
  if (p1 === p2) return 0;
  return PHONEME_DIST[p1]?.[p2] ?? 1.0;
}

/* ─────────────────────────────────────────
 * 5. WEIGHTED LEVENSHTEIN on phoneme arrays              *
 * Substitution cost  = phonemeDistance(p1, p2)           *
 * Insertion/deletion = 0.75 (missing a sound is bad but  *
 *                      not as bad as a wrong sound)       *
 * ───────────────────────────────────────── */
const INDEL_COST = 0.75;

/**
 * Weighted edit distance between two phoneme arrays.
 * @param {string[]} a
 * @param {string[]} b
 * @returns {number}
 */
export function phoneticDistance(a, b) {
  const m = a.length;
  const n = b.length;

  const dp = Array.from({ length: m + 1 }, (_, i) =>
    Array.from({ length: n + 1 }, (_, j) =>
      i === 0 ? j * INDEL_COST : j === 0 ? i * INDEL_COST : 0
    )
  );

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const sub = dp[i - 1][j - 1] + phonemeDistance(a[i - 1], b[j - 1]);
      const del = dp[i - 1][j]     + INDEL_COST;
      const ins = dp[i][j - 1]     + INDEL_COST;
      dp[i][j] = Math.min(sub, del, ins);
    }
  }

  return dp[m][n];
}

/* ─────────────────────────────────────────
 * 6. DISPLAY TRANSLITERATION (unchanged)                *
 * Only used to show the expected spelling — not scoring. *
 * ───────────────────────────────────────── */
const CHAR_MAP = [
  [/ç/g, 'ch'], [/ş/g, 'sh'], [/ğ/g, ''],
  [/ı/g, 'i' ], [/ö/g, 'o' ], [/ü/g, 'u'],
  [/c(?=[aouıeiöü])/g, 'j'],
];
export function transliterate(word) {
  return CHAR_MAP.reduce(
    (acc, [pat, rep]) => acc.replace(pat, rep),
    word.toLowerCase()
  );
}

/* ─────────────────────────────────────────
 * 7. MAIN SCORE FUNCTION                                 *
 * ───────────────────────────────────────── */

/**
 * Score a player’s English-typed answer against the original Turkish word
 * using full phonetic comparison.
 *
 * @param {string} input       Player’s typed answer (English letters)
 * @param {string} sourceWord  Original Turkish word
 * @returns {number} Integer in [0, 100]
 */
export function calcScore(input, sourceWord) {
  if (!input || !input.trim()) return 0;

  const playerPhonemes = enToPhonemes(input.trim());
  const targetPhonemes = trToPhonemes(sourceWord);

  if (targetPhonemes.length === 0) return 0;

  // Maximum possible distance = all target phonemes inserted at full cost
  const maxDist = targetPhonemes.length * INDEL_COST;
  const dist    = phoneticDistance(playerPhonemes, targetPhonemes);

  return Math.max(0, Math.round((1 - dist / maxDist) * 100));
}
