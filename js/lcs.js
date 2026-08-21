// Alineación por subsecuencia común más larga (LCS).
// Puntaje = % de palabras del OBJETIVO que aparecen, EN ORDEN, en lo que dijo
// o escribió el usuario. No es comparación exacta de strings: tolera palabras
// de más y capta el orden.

import { normalizeWords } from './normalize.js';

/**
 * Calcula el conjunto de índices de `target` que forman parte de la LCS con
 * `said`. Devuelve un Set con esos índices.
 */
function lcsMatchedTargetIndices(target, said) {
  const n = target.length;
  const m = said.length;
  // dp[i][j] = longitud de la LCS de target[i:] y said[j:]
  const dp = Array.from({ length: n + 1 }, () => new Int32Array(m + 1));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      if (target[i] === said[j]) dp[i][j] = dp[i + 1][j + 1] + 1;
      else dp[i][j] = Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }
  // Reconstruye qué índices del objetivo quedaron dentro de la LCS.
  const matched = new Set();
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (target[i] === said[j]) {
      matched.add(i);
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      i++;
    } else {
      j++;
    }
  }
  return matched;
}

/**
 * Evalúa un intento.
 * @param {string} targetText  frase objetivo (inglés)
 * @param {string} saidText    lo que dijo/escribió el usuario
 * @returns {{ score:number, words:Array<{w:string,ok:boolean}>, missedWords:string[] }}
 *   score en 0..100. words conserva el orden y las palabras del objetivo,
 *   marcando cuáles se captaron. missedWords son las palabras del objetivo
 *   que no aparecieron.
 */
export function scoreAttempt(targetText, saidText) {
  const target = normalizeWords(targetText);
  const said = normalizeWords(saidText);

  if (target.length === 0) {
    return { score: 0, words: [], missedWords: [] };
  }
  if (said.length === 0) {
    return {
      score: 0,
      words: target.map((w) => ({ w, ok: false })),
      missedWords: [...target],
    };
  }

  const matched = lcsMatchedTargetIndices(target, said);
  const words = target.map((w, idx) => ({ w, ok: matched.has(idx) }));
  const missedWords = words.filter((x) => !x.ok).map((x) => x.w);
  const score = Math.round((matched.size / target.length) * 100);

  return { score, words, missedWords };
}
