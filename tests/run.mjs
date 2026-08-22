// Pruebas de las dos funciones críticas: alineación LCS y motor Leitner.
// Correr con:  node tests/run.mjs   (o: npm test)

import assert from 'node:assert/strict';
import { scoreAttempt } from '../js/lcs.js';
import { updateCard, BOX_INTERVAL_DAYS, DAY, buildSession } from '../js/leitner.js';
import { PHRASES } from '../js/content.js';
import { detectWeakSpots } from '../js/weakspots.js';
import { encodeWAV, bytesToBase64 } from '../js/audio.js';
import { onRequestPost as transcribePost } from '../functions/api/transcribe.js';
import { onRequestPost as chatPost } from '../functions/api/chat.js';

let pass = 0;
let fail = 0;
function test(name, fn) {
  try { fn(); pass++; console.log('  ✓ ' + name); }
  catch (e) { fail++; console.log('  ✗ ' + name + '\n      ' + e.message); }
}
async function testA(name, fn) {
  try { await fn(); pass++; console.log('  ✓ ' + name); }
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

console.log('\nGrabación de voz (WAV -> base64 -> transcripción):');

function readStr(view, off, len) {
  let s = '';
  for (let i = 0; i < len; i++) s += String.fromCharCode(view.getUint8(off + i));
  return s;
}

test('encodeWAV produce una cabecera WAV válida (16 kHz, mono, 16-bit)', () => {
  const inRate = 44100;
  const samples = new Float32Array(inRate); // 1 s
  for (let i = 0; i < samples.length; i++) samples[i] = Math.sin((2 * Math.PI * 220 * i) / inRate) * 0.5;
  const wav = encodeWAV(samples, inRate, 16000);
  const view = new DataView(wav.buffer);
  assert.equal(readStr(view, 0, 4), 'RIFF');
  assert.equal(readStr(view, 8, 4), 'WAVE');
  assert.equal(view.getUint16(20, true), 1);      // PCM
  assert.equal(view.getUint16(22, true), 1);      // mono
  assert.equal(view.getUint32(24, true), 16000);  // sample rate de salida
  assert.equal(view.getUint16(34, true), 16);     // bits por muestra
  assert.equal(readStr(view, 36, 4), 'data');
  // ~16000 muestras * 2 bytes + 44 de cabecera
  assert.ok(Math.abs(wav.length - (44 + 16000 * 2)) < 200, 'longitud aproximada correcta');
});

test('encodeWAV es determinístico en 3 corridas seguidas', () => {
  const inRate = 48000;
  const samples = new Float32Array(inRate / 2);
  for (let i = 0; i < samples.length; i++) samples[i] = Math.sin(i / 7) * 0.4;
  const a = bytesToBase64(encodeWAV(samples, inRate, 16000));
  const b = bytesToBase64(encodeWAV(samples, inRate, 16000));
  const c = bytesToBase64(encodeWAV(samples, inRate, 16000));
  assert.equal(a, b);
  assert.equal(b, c);
  assert.ok(a.length > 100);
});

test('bytesToBase64 hace round-trip correcto', () => {
  const bytes = new Uint8Array([0, 1, 2, 250, 251, 255, 42, 100]);
  const b64 = bytesToBase64(bytes);
  const back = new Uint8Array(Buffer.from(b64, 'base64'));
  assert.deepEqual([...back], [...bytes]);
});

// Prueba end-to-end del proxy de transcripción con un fetch simulado.
async function transcribeWithMock(geminiText, { status = 200 } = {}) {
  const orig = globalThis.fetch;
  let captured = null;
  globalThis.fetch = async (url, opts) => {
    captured = { url, opts };
    return {
      status,
      ok: status >= 200 && status < 300,
      async text() {
        return JSON.stringify({ candidates: [{ content: { parts: [{ text: geminiText }] } }] });
      },
    };
  };
  try {
    const req = { json: async () => ({ audio: 'QUJD', mime: 'audio/wav' }) };
    const res = await transcribePost({ request: req, env: { GEMINI_API_KEY: 'test-key' } });
    const body = await res.json();
    return { res, body, captured };
  } finally {
    globalThis.fetch = orig;
  }
}

await testA('transcribe: devuelve el texto reconocido y NO expone la llave', async () => {
  const { res, body, captured } = await transcribeWithMock('  Here is my passport.  ');
  assert.equal(res.status, 200);
  assert.equal(body.transcript, 'Here is my passport.'); // recortado (la comparación LCS ya normaliza mayúsculas)
  // La llave viaja en la URL del upstream, nunca en la respuesta al navegador.
  assert.ok(captured.url.includes('test-key'));
  assert.ok(!JSON.stringify(body).includes('test-key'));
});

await testA('transcribe: 401 claro si falta la llave', async () => {
  const req = { json: async () => ({ audio: 'QUJD', mime: 'audio/wav' }) };
  const res = await transcribePost({ request: req, env: {} });
  assert.equal(res.status, 401);
  const body = await res.json();
  assert.ok(/GEMINI_API_KEY/.test(body.error));
});

await testA('transcribe: 400 si no llega audio', async () => {
  const req = { json: async () => ({ mime: 'audio/wav' }) };
  const res = await transcribePost({ request: req, env: { GEMINI_API_KEY: 'k' } });
  assert.equal(res.status, 400);
});

// Ejecuta la comprobación de la ruta completa 3 veces (iPhone/Android usan el
// mismo proxy; aquí validamos que sea estable en repeticiones).
await testA('transcribe: estable en 3 corridas', async () => {
  for (let i = 0; i < 3; i++) {
    const { res, body } = await transcribeWithMock('Can I have the check please');
    assert.equal(res.status, 200);
    assert.equal(body.transcript, 'Can I have the check please');
  }
});

console.log('\nCharla (proxy Gemini, fetch simulado):');

async function chatWithMock(geminiText, { status = 200 } = {}) {
  const orig = globalThis.fetch;
  let sentBody = null;
  globalThis.fetch = async (url, opts) => {
    sentBody = JSON.parse(opts.body);
    return {
      status, ok: status >= 200 && status < 300,
      async text() { return JSON.stringify({ candidates: [{ content: { parts: [{ text: geminiText }] } }] }); },
    };
  };
  try {
    const req = { json: async () => ({ persona: 'You are a server.', messages: [{ role: 'user', text: 'hi' }] }) };
    const res = await chatPost({ request: req, env: { GEMINI_API_KEY: 'k' } });
    return { res, body: await res.json(), sentBody };
  } finally { globalThis.fetch = orig; }
}

await testA('chat: NO envía responseSchema (evita el rechazo de Gemini)', async () => {
  const { sentBody } = await chatWithMock('{"reply":"Hi!","reply_es":"¡Hola!","correction":null,"options":["a","b","c"]}');
  assert.equal(sentBody.generationConfig.responseMimeType, 'application/json');
  assert.equal(sentBody.generationConfig.responseSchema, undefined);
  assert.ok(sentBody.systemInstruction.parts[0].text.length > 0);
});

await testA('chat: parsea JSON válido del modelo', async () => {
  const { res, body } = await chatWithMock('{"reply":"Table for three?","reply_es":"¿Mesa para tres?","correction":{"better":"a table for three","why":"falta el articulo"},"options":["yes","no","thanks"]}');
  assert.equal(res.status, 200);
  assert.equal(body.reply, 'Table for three?');
  assert.equal(body.reply_es, '¿Mesa para tres?');
  assert.equal(body.correction.better, 'a table for three');
  assert.equal(body.options.length, 3);
});

await testA('chat: tolera JSON envuelto en ```json ... ```', async () => {
  const fenced = '```json\n{"reply":"Ok","reply_es":"Bien","correction":null,"options":["x","y","z"]}\n```';
  const { body } = await chatWithMock(fenced);
  assert.equal(body.reply, 'Ok');
  assert.equal(body.correction, null);
  assert.equal(body.options.length, 3);
});

await testA('chat: si el modelo manda texto plano, no truena (fallback)', async () => {
  const { res, body } = await chatWithMock('Hello there!');
  assert.equal(res.status, 200);
  assert.equal(body.reply, 'Hello there!');
  assert.deepEqual(body.options, []);
});

await testA('chat: 429 devuelve el mensaje de cuota agotada', async () => {
  const { res, body } = await chatWithMock('x', { status: 429 });
  assert.equal(res.status, 429);
  assert.ok(/cuota/i.test(body.error));
});

// Diagnóstico de errores reales de Gemini (mensaje accionable, sin filtrar llave).
async function chatWithError(status, errorObj) {
  const orig = globalThis.fetch;
  globalThis.fetch = async () => ({
    status, ok: false,
    async text() { return JSON.stringify({ error: errorObj }); },
  });
  try {
    const req = { json: async () => ({ persona: 'x', messages: [] }) };
    const res = await chatPost({ request: req, env: { GEMINI_API_KEY: 'super-secret-key' } });
    return { res, body: await res.json() };
  } finally { globalThis.fetch = orig; }
}

await testA('chat: llave inválida -> mensaje claro y NO filtra la llave', async () => {
  const { body } = await chatWithError(400, { code: 400, status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.' });
  assert.ok(/GEMINI_API_KEY/.test(body.error));
  assert.ok(!body.error.includes('super-secret-key'));
});

await testA('chat: API no habilitada (403) -> instrucción de activarla', async () => {
  const { res, body } = await chatWithError(403, { code: 403, status: 'PERMISSION_DENIED', message: 'Generative Language API has not been used in project ... is disabled.' });
  assert.equal(res.status, 403);
  assert.ok(/habilitar|activ/i.test(body.error));
});

await testA('chat: modelo inexistente (404) -> sugiere cambiar MODEL', async () => {
  const { body } = await chatWithError(404, { code: 404, status: 'NOT_FOUND', message: 'models/foo is not found' });
  assert.ok(/MODEL/.test(body.error));
});

await testA('chat: si un modelo da 404, prueba el siguiente automáticamente', async () => {
  const orig = globalThis.fetch;
  let calls = 0;
  globalThis.fetch = async () => {
    calls++;
    if (calls === 1) {
      return { status: 404, ok: false, async text() { return JSON.stringify({ error: { status: 'NOT_FOUND', message: 'model not found' } }); } };
    }
    return { status: 200, ok: true, async text() { return JSON.stringify({ candidates: [{ content: { parts: [{ text: '{"reply":"Hi","reply_es":"Hola","correction":null,"options":["a","b","c"]}' }] } }] }); } };
  };
  try {
    const req = { json: async () => ({ persona: 'x', messages: [] }) };
    const res = await chatPost({ request: req, env: { GEMINI_API_KEY: 'k' } });
    const body = await res.json();
    assert.equal(res.status, 200);
    assert.equal(body.reply, 'Hi');
    assert.ok(calls >= 2, 'debió intentar un segundo modelo');
  } finally { globalThis.fetch = orig; }
});

console.log(`\nResultado: ${pass} pasaron, ${fail} fallaron.\n`);
process.exit(fail ? 1 : 0);
