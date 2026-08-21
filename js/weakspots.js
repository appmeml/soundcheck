// Detección de puntos débiles, específica para hispanohablantes.
// Acumula las palabras falladas y las clasifica contra la tabla de sonidos
// difíciles. Cuando un patrón aparece en 3+ palabras distintas, se muestra
// como "tu punto débil" con un mini-ejercicio.

export const PATTERNS = {
  th:       { label: 'la th', problem: 'El sonido th (/θ/, /ð/) no existe en español.',      example: 'think, three, the, this, that, thank' },
  vb:       { label: 'la v y la b', problem: 'La v y la b se pronuncian igual en español.',   example: 'vacation, very, travel, have' },
  scluster: { label: 's + consonante', problem: 'Antepones una "e": "estop" en vez de "stop".', example: 'speak, stop, staying, spicy, size' },
  h:        { label: 'la h aspirada', problem: 'La h es muda en español; en inglés se sopla.', example: 'here, hotel, have, help, how' },
  shch:     { label: 'sh vs ch', problem: 'Se confunden los sonidos sh y ch.',                example: 'she, shop, check, chicken' },
  ivowel:   { label: 'la i corta', problem: 'El inglés tiene dos "i": /ɪ/ corta y /iː/ larga.', example: 'this/these, is/ease, six/seeks' },
  final:    { label: 'la consonante final', problem: 'Se tiende a omitir la consonante final.', example: 'want, need, help, ask, lost' },
  w:        { label: 'el sonido w', problem: 'La w no existe como tal en español.',           example: 'water, wait, where, work, winter' },
};

// Palabras con /ɪ/ corta presentes en el contenido (difícil de inferir del
// deletreo, así que se listan).
const SHORT_I = new Set([
  'this', 'is', 'six', 'spicy', 'chicken', 'it', 'in', 'big', 'bigger',
  'included', 'taxi', 'winter', 'isn', 'sit', 'in', 'his', 'kid',
]);

// Palabras que terminan en consonante/clúster que suele omitirse.
const FINAL_SET = new Set([
  'want', 'need', 'help', 'ask', 'lost', 'card', 'passport', 'breakfast',
  'understand', 'don', 'exit', 'wait', 'extra', 'photo', 'trunk', 'nearest',
]);

function endsInConsonantCluster(w) {
  return /[bcdfghjklmnpqrstvwxz]{2}$/.test(w);
}

/** Devuelve las claves de patrón que contiene una palabra. */
export function classifyWord(raw) {
  const w = String(raw || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!w) return [];
  const hits = [];

  if (w.includes('th')) hits.push('th');
  if (w.includes('v')) hits.push('vb');
  if (/^s[bcdfghjklmnpqrstvwxz]/.test(w)) hits.push('scluster');
  if (/^h[aeiou]/.test(w)) hits.push('h');
  if (w.includes('sh') || w.includes('ch')) hits.push('shch');
  if (SHORT_I.has(w)) hits.push('ivowel');
  if (w.startsWith('w')) hits.push('w');
  if (FINAL_SET.has(w) || endsInConsonantCluster(w)) hits.push('final');

  return hits;
}

/**
 * @param {string[]} missedWords  todas las palabras falladas acumuladas
 * @param {number} [threshold]    mínimo de palabras distintas para reportar
 * @returns {Array<{key,label,problem,example,count,words:string[]}>}
 *   ordenado de mayor a menor conteo.
 */
export function detectWeakSpots(missedWords, threshold = 3) {
  const byPattern = {}; // key -> Set de palabras distintas
  for (const raw of missedWords || []) {
    const w = String(raw || '').toLowerCase().replace(/[^a-z]/g, '');
    if (!w) continue;
    for (const key of classifyWord(w)) {
      (byPattern[key] = byPattern[key] || new Set()).add(w);
    }
  }

  return Object.entries(byPattern)
    .map(([key, set]) => ({
      key,
      ...PATTERNS[key],
      count: set.size,
      words: [...set],
    }))
    .filter((p) => p.count >= threshold)
    .sort((a, b) => b.count - a.count);
}

/** Frases del catálogo que contienen el patrón dado (para el mini-ejercicio). */
export function phrasesForPattern(phrases, key) {
  return phrases.filter((p) => (p.tags || []).includes(key));
}
