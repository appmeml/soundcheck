// Pruebas de las dos funciones críticas: alineación LCS y motor Leitner.
// Correr con:  node tests/run.mjs   (o: npm test)

import assert from 'node:assert/strict';
import { scoreAttempt } from '../js/lcs.js';
import { updateCard, BOX_INTERVAL_DAYS, DAY, buildSession } from '../js/leitner.js';
import { PHRASES } from '../js/content.js';
import { detectWeakSpots } from '../js/weakspots.js';

let pass = 0;
let fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}

console.log('\nAlineación LCS (normalización + subsecuencia común):');

test("\"I'm here on vacation.\" vs \"I am here on vacation\" -> 100%", () => {
  const r = scoreAttempt("I'm here on vacation.", 'I am here on vacation');
  assert.equal(r.score, 100);
  assert.deepEqual(r.missedWords, []);
});

test('"What\'s the Wi-Fi password?" vs "what is the wifi password" -> 100%', () => {
  const r = scoreAttempt("What's the Wi-Fi password?", 'what is the wifi password');
  assert.equal(r.score, 100);
});

test('"I\'ll have the chicken." vs "I will have the chicken" -> 100%', () => {
  const r = scoreAttempt("I'll have the chicken.", 'I will have the chicken');
  assert.equal(r.score, 100);
});

test('"I organize concerts and events." vs "I organize concerts" -> parcial, con and y events falladas', () => {
  const r = scoreAttempt('I organize concerts and events.', 'I organize concerts');
  assert.ok(r.score > 0 && r.score < 100, 'score debe ser parcial, fue ' + r.score);
  assert.deepEqual(r.missedWords, ['and', 'events']);
  // "I organize concerts" (3 de 5 palabras del objetivo) -> 60%
  assert.equal(r.score, 60);
});

test('Entrada vacía -> 0%, sin excepción', () => {
  const r = scoreAttempt('Where is baggage claim?', '');
  assert.equal(r.score, 0);
  const r2 = scoreAttempt('', 'anything at all');
  assert.equal(r2.score, 0);
});

test('El orden importa: LCS no premia palabras fuera de secuencia', () => {
  const r = scoreAttempt('the cat sat', 'sat cat');
  // solo una subsecuencia en orden ("cat" o "sat"), no ambas -> 1/3
  assert.equal(r.score, 33);
});

console.log('\nMotor Leitner (5 cajas):');

test('Caja 2 con puntaje 85 -> caja 3, dueAt a 3 días', () => {
  const now = 1_000_000_000_000;
  const c = updateCard({ box: 2, dueAt: now, bestScore: 0, attempts: 0 }, 85, [], now);
  assert.equal(c.box, 3);
  assert.equal(c.dueAt, now + BOX_INTERVAL_DAYS[3] * DAY);
  assert.equal(c.dueAt, now + 3 * DAY);
});

test('Caja 4 con puntaje 30 -> caja 1, dueAt hoy', () => {
  const now = 1_000_000_000_000;
  const c = updateCard({ box: 4, dueAt: now, attempts: 3 }, 30, [], now);
  assert.equal(c.box, 1);
  assert.equal(c.dueAt, now); // mismo día
});

test('Caja 3 con puntaje 65 -> sigue en caja 3, dueAt mañana', () => {
  const now = 1_000_000_000_000;
  const c = updateCard({ box: 3, dueAt: now }, 65, [], now);
  assert.equal(c.box, 3);
  assert.equal(c.dueAt, now + DAY);
});

test('Caja 5 con puntaje 90 -> se mantiene en 5, no desborda', () => {
  const now = 1_000_000_000_000;
  const c = updateCard({ box: 5, dueAt: now }, 90, [], now);
  assert.equal(c.box, 5);
  assert.equal(c.dueAt, now + BOX_INTERVAL_DAYS[5] * DAY);
});

test('bestScore y attempts se acumulan correctamente', () => {
  let c = { box: 1, dueAt: 0, bestScore: 40, attempts: 2 };
  c = updateCard(c, 88, ['and'], 1000);
  assert.equal(c.bestScore, 88);
  assert.equal(c.attempts, 3);
  assert.deepEqual(c.missedWords, ['and']);
});

console.log('\nSesión y contenido:');

test('Hay exactamente 46 frases', () => {
  assert.equal(PHRASES.length, 46);
});

test('buildSession arma 12 tarjetas con 8 speak + 4 listen', () => {
  const plan = buildSession(PHRASES, {}, Date.now());
  assert.equal(plan.length, 12);
  const listen = plan.filter((x) => x.mode === 'listen').length;
  const speak = plan.filter((x) => x.mode === 'speak').length;
  assert.equal(listen, 4);
  assert.equal(speak, 8);
});

test('buildSession prioriza vencidas (más atrasadas primero)', () => {
  const now = 2_000_000_000_000;
  const cards = {
    'air-01': { box: 1, dueAt: now - 10 * DAY },
    'air-02': { box: 1, dueAt: now - 2 * DAY },
    'air-03': { box: 5, dueAt: now + 5 * DAY }, // no vencida
  };
  const plan = buildSession(PHRASES, cards, now);
  assert.equal(plan[0].phraseId, 'air-01'); // la más atrasada primero
  assert.ok(!plan.some((x) => x.phraseId === 'air-03')); // la futura no entra por vencida
});

console.log('\nDetección de puntos débiles:');

test('Un patrón con 3+ palabras distintas se reporta', () => {
  const w = detectWeakSpots(['think', 'the', 'that', 'water']);
  const th = w.find((x) => x.key === 'th');
  assert.ok(th, 'debe detectar th');
  assert.equal(th.count, 3);
});

console.log(`\nResultado: ${pass} pasaron, ${fail} fallaron.\n`);
process.exit(fail ? 1 : 0);
