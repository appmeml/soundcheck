// Motor de repetición espaciada — Leitner de 5 cajas.
// Determinístico, gratis, ilimitado y funciona offline. No usa IA.

export const DAY = 24 * 60 * 60 * 1000;

// Días hasta la próxima revisión según la caja.
export const BOX_INTERVAL_DAYS = { 1: 0, 2: 1, 3: 3, 4: 7, 5: 16 };

export const MASTERED_BOX = 4; // "dominada" = caja 4 o 5
export const SESSION_SIZE = 12;
export const SESSION_LISTEN = 4; // 4 de comprensión (Oído)
export const SESSION_SPEAK = SESSION_SIZE - SESSION_LISTEN; // 8 de pronunciación (Kit)

/** Estado inicial de una tarjeta nueva. */
export function newCard(phraseId, now = Date.now()) {
  return {
    box: 1,
    dueAt: now, // vence hoy
    bestScore: 0,
    lastScore: 0,
    attempts: 0,
    missedWords: [],
  };
}

export function isMastered(box) {
  return box >= MASTERED_BOX;
}

/**
 * Aplica el resultado de un intento a una tarjeta y devuelve la tarjeta
 * actualizada. Puro: no muta el argumento.
 *
 * Reglas:
 *   score >= 80  -> sube una caja (tope 5); dueAt = ahora + intervalo(nuevaCaja)
 *   50 <= score < 80 -> misma caja; dueAt = mañana
 *   score < 50  -> vuelve a la caja 1; dueAt = hoy
 */
export function updateCard(card, score, missedWords = [], now = Date.now()) {
  const prevBox = card.box || 1;
  let box;
  let dueAt;

  if (score >= 80) {
    box = Math.min(prevBox + 1, 5);
    dueAt = now + BOX_INTERVAL_DAYS[box] * DAY;
  } else if (score >= 50) {
    box = prevBox;
    dueAt = now + DAY; // mañana
  } else {
    box = 1;
    dueAt = now; // hoy, mismo día
  }

  return {
    ...card,
    box,
    dueAt,
    lastScore: score,
    bestScore: Math.max(card.bestScore || 0, score),
    attempts: (card.attempts || 0) + 1,
    missedWords: Array.isArray(missedWords) ? missedWords : [],
  };
}

/**
 * Arma la sesión diaria.
 * @param {Array} phrases  catálogo completo (cada uno con .id)
 * @param {Object} cardsById  { phraseId: {box, dueAt, ...} }
 * @param {number} now
 * @param {Object} [opts]  { size, listen }
 * @returns {Array<{phraseId:string, mode:'speak'|'listen'}>}
 */
export function buildSession(phrases, cardsById = {}, now = Date.now(), opts = {}) {
  const size = opts.size || SESSION_SIZE;
  const listenCount = opts.listen == null ? SESSION_LISTEN : opts.listen;

  // 1. Vencidas (dueAt <= ahora), las más atrasadas primero.
  const due = phrases
    .filter((p) => cardsById[p.id] && cardsById[p.id].dueAt <= now)
    .sort((a, b) => cardsById[a.id].dueAt - cardsById[b.id].dueAt);

  // 2. Rellena con frases nuevas (sin tarjeta todavía).
  const fresh = phrases.filter((p) => !cardsById[p.id]);

  const picked = [];
  const seen = new Set();
  for (const p of [...due, ...fresh]) {
    if (seen.has(p.id)) continue;
    seen.add(p.id);
    picked.push(p);
    if (picked.length >= size) break;
  }

  // Si aún faltan (pocas frases en total), rellena con las menos recientes.
  if (picked.length < size) {
    const rest = phrases
      .filter((p) => !seen.has(p.id))
      .sort((a, b) => (cardsById[a.id]?.dueAt || 0) - (cardsById[b.id]?.dueAt || 0));
    for (const p of rest) {
      picked.push(p);
      seen.add(p.id);
      if (picked.length >= size) break;
    }
  }

  // 3. Mezcla: reparte las de comprensión (listen) espaciadas entre las de
  //    pronunciación (speak), de forma determinística.
  const total = picked.length;
  const listenTarget = Math.min(listenCount, total);
  const listenIdx = new Set();
  if (listenTarget > 0) {
    const step = total / listenTarget;
    for (let k = 0; k < listenTarget; k++) {
      listenIdx.add(Math.floor(k * step + step / 2));
    }
  }

  return picked.map((p, i) => ({
    phraseId: p.id,
    mode: listenIdx.has(i) ? 'listen' : 'speak',
  }));
}
