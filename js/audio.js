// Voz nativa (Web Speech API) + medidor VU en vivo (Web Audio API).
// Todo gratis e ilimitado. Limpieza de recursos estricta: si no se cierran
// el stream y el AudioContext, el indicador de micrófono se queda prendido
// y drena la batería.

// ---------- SpeechSynthesis (escuchar) ----------

let cachedVoice = null;
const VOICE_PREF_KEY = 'sc_voice_uri';

// Nombres de voces en-US que suenan MÁS NATURALES (según plataforma). Se usan
// para elegir por defecto la mejor disponible en vez de la robótica genérica.
const NATURAL_HINTS = [
  'samantha', 'ava', 'allison', 'susan', 'nicky', 'aaron', 'zoe', 'evan', 'nathan', // Apple (mejores si están instaladas)
  'google us english', 'google',              // Chrome/Android
  'microsoft aria', 'microsoft jenny', 'microsoft guy', 'microsoft', // Edge/Windows
  'natural', 'enhanced', 'premium', 'siri',   // marcadores de alta calidad
];

export function englishVoices() {
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  return voices.filter((v) => /^en(\b|[-_])/i.test(v.lang));
}

function scoreVoice(v) {
  const n = (v.name || '').toLowerCase();
  let s = 0;
  if (/^en[-_]us/i.test(v.lang) || v.lang === 'en-US') s += 3;
  else if (/^en/i.test(v.lang)) s += 1;
  NATURAL_HINTS.forEach((h, i) => { if (n.includes(h)) s += (NATURAL_HINTS.length - i) + 5; });
  if (/compact|eloquence|fred|albert|zarvox|robot/.test(n)) s -= 5; // voces viejas/robóticas
  return s;
}

function pickEnglishVoice() {
  const voices = englishVoices();
  if (!voices.length) return null;
  // 1) La que el usuario eligió, si sigue disponible.
  try {
    const pref = localStorage.getItem(VOICE_PREF_KEY);
    if (pref) {
      const chosen = voices.find((v) => v.voiceURI === pref || v.name === pref);
      if (chosen) return chosen;
    }
  } catch (_) {}
  // 2) La mejor por puntaje (más natural).
  return voices.slice().sort((a, b) => scoreVoice(b) - scoreVoice(a))[0] || null;
}

export function setPreferredVoice(uri) {
  try { if (uri) localStorage.setItem(VOICE_PREF_KEY, uri); else localStorage.removeItem(VOICE_PREF_KEY); } catch (_) {}
  cachedVoice = pickEnglishVoice();
}
export function getPreferredVoice() {
  try { return localStorage.getItem(VOICE_PREF_KEY) || ''; } catch (_) { return ''; }
}

export function primeVoices() {
  if (!window.speechSynthesis) return;
  cachedVoice = pickEnglishVoice();
  window.speechSynthesis.onvoiceschanged = () => { cachedVoice = pickEnglishVoice(); };
}

export function speak(text, rate = 1.0) {
  return new Promise((resolve) => {
    if (!window.speechSynthesis || !window.SpeechSynthesisUtterance) {
      resolve(false);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const v = cachedVoice || pickEnglishVoice();
    if (v) { u.voice = v; u.lang = v.lang; } else { u.lang = 'en-US'; }
    u.rate = rate;
    u.pitch = 1.0;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
}

// ---------- Melodías (Web Audio) ----------
// Reproduce la tonada real (de dominio público) con tonos sintetizados.
// Gratis, offline y sin infringir derechos de autor.
const NOTE_FREQ = {
  G3: 196.00, A3: 220.00, B3: 246.94,
  C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.00, A4: 440.00, B4: 493.88,
  C5: 523.25, D5: 587.33, E5: 659.25, F5: 698.46, G5: 783.99,
};
let melodyCtx = null;
let melodyTimer = 0;

export function stopMelody() {
  if (melodyTimer) { clearTimeout(melodyTimer); melodyTimer = 0; }
  if (melodyCtx && melodyCtx.state !== 'closed') { melodyCtx.close().catch(() => {}); }
  melodyCtx = null;
}

export function playMelody(melody, onDone) {
  stopMelody();
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC || !melody || !Array.isArray(melody.notes)) { if (onDone) onDone(); return { stop() {} }; }
  const ctx = new AC();
  melodyCtx = ctx;
  const beat = 60 / (melody.bpm || 110);
  let t = ctx.currentTime + 0.06;
  for (const [name, beats] of melody.notes) {
    const dur = beats * beat;
    if (name !== 'R' && NOTE_FREQ[name]) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'triangle';
      o.frequency.value = NOTE_FREQ[name];
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.28, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + Math.max(0.08, dur * 0.9));
      o.connect(g); g.connect(ctx.destination);
      o.start(t); o.stop(t + dur);
    }
    t += dur;
  }
  const ms = (t - ctx.currentTime) * 1000 + 120;
  melodyTimer = setTimeout(() => { stopMelody(); if (onDone) onDone(); }, ms);
  return { stop: () => { stopMelody(); if (onDone) onDone(); } };
}

// ---------- SpeechRecognition (hablar) ----------

export function recognitionSupported() {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
}

// Mensajes de error accionables, en español, sin disculpas.
export function speechErrorMessage(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'El micrófono está bloqueado. Actívalo en el candado 🔒 de la barra de direcciones.';
    case 'no-speech':
      return 'No se escuchó nada. Habla más cerca y más fuerte.';
    case 'audio-capture':
      return 'No se encontró micrófono. Conecta uno o usa el cuadro de texto de abajo.';
    case 'network':
      return 'Sin conexión para el reconocimiento de voz. Usa el cuadro de texto de abajo.';
    default:
      return 'No se pudo usar el micrófono. Usa el cuadro de texto de abajo.';
  }
}

/**
 * Reconoce una frase. Devuelve { start(), abort() }.
 * onResult recibe el mejor transcript; onError recibe un código.
 */
export function createRecognizer({ onResult, onError, onEnd }) {
  const Ctor = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Ctor) return null;
  const rec = new Ctor();
  rec.lang = 'en-US';
  rec.maxAlternatives = 3;
  rec.interimResults = false;
  rec.continuous = false;

  rec.onresult = (ev) => {
    let best = '';
    const res = ev.results[0];
    if (res) {
      // Toma la alternativa con mayor confianza.
      let top = res[0];
      for (let i = 1; i < res.length; i++) {
        if ((res[i].confidence || 0) > (top.confidence || 0)) top = res[i];
      }
      best = top.transcript || '';
    }
    if (onResult) onResult(best.trim());
  };
  rec.onerror = (ev) => { if (onError) onError(ev.error); };
  rec.onend = () => { if (onEnd) onEnd(); };

  return {
    start() { try { rec.start(); } catch (_) { /* ya iniciado */ } },
    stop() { try { rec.stop(); } catch (_) {} },  // finaliza y entrega el resultado
    abort() { try { rec.abort(); } catch (_) {} }, // cancela sin resultado
  };
}

// ---------- Medidor VU en vivo (AnalyserNode) ----------

export class MicMeter {
  constructor(onLevel) {
    this.onLevel = onLevel;
    this.stream = null;
    this.ctx = null;
    this.analyser = null;
    this.raf = 0;
    this.running = false;
  }

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    const src = this.ctx.createMediaStreamSource(this.stream);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    src.connect(this.analyser);
    const data = new Uint8Array(this.analyser.fftSize);
    this.running = true;

    const tick = () => {
      if (!this.running) return;
      this.analyser.getByteTimeDomainData(data);
      let sum = 0;
      for (let i = 0; i < data.length; i++) {
        const v = (data[i] - 128) / 128;
        sum += v * v;
      }
      const rms = Math.sqrt(sum / data.length); // 0..1
      const level = Math.min(1, rms * 3.2); // ganancia para que se vea vivo
      if (this.onLevel) this.onLevel(level);
      this.raf = requestAnimationFrame(tick);
    };
    this.raf = requestAnimationFrame(tick);
  }

  stop() {
    this.running = false;
    if (this.raf) cancelAnimationFrame(this.raf);
    this.raf = 0;
    if (this.stream) {
      this.stream.getTracks().forEach((t) => t.stop());
      this.stream = null;
    }
    if (this.ctx && this.ctx.state !== 'closed') {
      this.ctx.close().catch(() => {});
    }
    this.ctx = null;
    this.analyser = null;
  }
}

// ---------- Grabadora universal (Web Audio -> WAV) ----------
// Funciona donde SpeechRecognition NO es fiable (Safari/iOS): captura PCM con
// un ScriptProcessorNode, entrega niveles en vivo para el medidor VU y, al
// detener, produce un WAV 16 kHz mono listo para transcribir con Gemini.

const OUT_RATE = 16000;

export class AudioRecorder {
  constructor(onLevel) {
    this.onLevel = onLevel;
    this.stream = null;
    this.ctx = null;
    this.source = null;
    this.processor = null;
    this.chunks = [];
    this.inRate = 44100;
    this.recording = false;
  }

  async start() {
    // Crea el AudioContext DENTRO del gesto del usuario (antes de cualquier
    // await); Safari/iOS exige eso para permitir audio.
    const AC = window.AudioContext || window.webkitAudioContext;
    this.ctx = new AC();
    if (this.ctx.state === 'suspended') { try { await this.ctx.resume(); } catch (_) {} }
    this.inRate = this.ctx.sampleRate || 44100;

    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
    });
    this.source = this.ctx.createMediaStreamSource(this.stream);

    const bufSize = 4096;
    this.processor = this.ctx.createScriptProcessor(bufSize, 1, 1);
    this.chunks = [];
    this.recording = true;

    this.processor.onaudioprocess = (e) => {
      if (!this.recording) return;
      const input = e.inputBuffer.getChannelData(0);
      this.chunks.push(new Float32Array(input));
      if (this.onLevel) {
        let sum = 0;
        for (let i = 0; i < input.length; i++) sum += input[i] * input[i];
        const rms = Math.sqrt(sum / input.length);
        this.onLevel(Math.min(1, rms * 3.4));
      }
    };

    // El ScriptProcessor solo "corre" si su cadena llega al destino. Lo
    // conectamos DIRECTO al destino: como nunca escribimos el buffer de salida,
    // no hay eco (sale silencio), pero iOS sí procesa la entrada del micrófono.
    // (El truco anterior con una ganancia en 0 hacía que iOS apagara el grafo
    //  y se grabara silencio.)
    this.source.connect(this.processor);
    this.processor.connect(this.ctx.destination);
  }

  /** Detiene, libera recursos y devuelve { base64, mime, empty }. */
  stop() {
    this.recording = false;
    const inRate = this.inRate;
    const chunks = this.chunks;
    this.chunks = [];

    if (this.processor) { this.processor.onaudioprocess = null; try { this.processor.disconnect(); } catch (_) {} }
    if (this.source) { try { this.source.disconnect(); } catch (_) {} }
    if (this.stream) { this.stream.getTracks().forEach((t) => t.stop()); this.stream = null; }
    if (this.ctx && this.ctx.state !== 'closed') { this.ctx.close().catch(() => {}); }
    this.ctx = null; this.source = null; this.processor = null;

    // Une los trozos.
    let total = 0;
    for (const c of chunks) total += c.length;
    const flat = new Float32Array(total);
    let off = 0;
    for (const c of chunks) { flat.set(c, off); off += c.length; }

    // Detecta silencio real (por duración Y por volumen) y sube el volumen de
    // grabaciones bajas antes de enviar (clave en iPhone, donde sale flojito).
    const level = rmsPeak(flat);
    const tooShort = total < inRate * 0.3;      // < ~0.3 s
    const tooQuiet = level.rms < 0.006;         // prácticamente silencio
    const empty = tooShort || tooQuiet;
    const norm = normalizeSamples(flat, level.peak);

    const wav = encodeWAV(norm, inRate, OUT_RATE);
    return {
      base64: bytesToBase64(wav), mime: 'audio/wav', empty,
      peak: level.peak, rms: level.rms, seconds: total / inRate,
    };
  }
}

// Nivel de una señal (RMS + pico). Puro (testeable en Node).
export function rmsPeak(flat) {
  let peak = 0, sumSq = 0;
  for (let i = 0; i < flat.length; i++) {
    const a = flat[i] < 0 ? -flat[i] : flat[i];
    if (a > peak) peak = a;
    sumSq += flat[i] * flat[i];
  }
  return { peak, rms: flat.length ? Math.sqrt(sumSq / flat.length) : 0 };
}

// Sube el volumen a un pico objetivo (~0.97), con ganancia máxima acotada para
// no amplificar ruido de fondo. No modifica el arreglo original.
export function normalizeSamples(flat, peak) {
  const p = peak == null ? rmsPeak(flat).peak : peak;
  if (!p || p >= 0.97) return flat;
  const gain = Math.min(0.97 / p, 12);
  if (gain <= 1.05) return flat;
  const out = new Float32Array(flat.length);
  for (let i = 0; i < flat.length; i++) {
    let v = flat[i] * gain;
    out[i] = v > 1 ? 1 : (v < -1 ? -1 : v);
  }
  return out;
}

// Downsample lineal + PCM 16-bit + cabecera WAV. Puro (testeable en Node).
export function encodeWAV(float32, inRate, outRate = OUT_RATE) {
  const data = inRate === outRate ? float32 : downsample(float32, inRate, outRate);
  const buffer = new ArrayBuffer(44 + data.length * 2);
  const view = new DataView(buffer);
  const writeStr = (o, s) => { for (let i = 0; i < s.length; i++) view.setUint8(o + i, s.charCodeAt(i)); };

  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + data.length * 2, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true);        // tamaño del subchunk fmt
  view.setUint16(20, 1, true);         // PCM
  view.setUint16(22, 1, true);         // mono
  view.setUint32(24, outRate, true);
  view.setUint32(28, outRate * 2, true); // byte rate
  view.setUint16(32, 2, true);         // block align
  view.setUint16(34, 16, true);        // bits por muestra
  writeStr(36, 'data');
  view.setUint32(40, data.length * 2, true);

  let off = 44;
  for (let i = 0; i < data.length; i++) {
    let s = Math.max(-1, Math.min(1, data[i]));
    view.setInt16(off, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    off += 2;
  }
  return new Uint8Array(buffer);
}

function downsample(float32, inRate, outRate) {
  if (outRate >= inRate) return float32;
  const ratio = inRate / outRate;
  const outLen = Math.floor(float32.length / ratio);
  const out = new Float32Array(outLen);
  for (let i = 0; i < outLen; i++) {
    const start = Math.floor(i * ratio);
    const end = Math.min(float32.length, Math.floor((i + 1) * ratio));
    let sum = 0;
    for (let j = start; j < end; j++) sum += float32[j];
    out[i] = end > start ? sum / (end - start) : 0;
  }
  return out;
}

export function bytesToBase64(bytes) {
  if (typeof btoa === 'function') {
    let bin = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(bin);
  }
  // Node (para pruebas)
  return Buffer.from(bytes).toString('base64');
}

/** Envía el audio al proxy /api/transcribe y devuelve el texto reconocido.
 *  Con timeout: si la red se cuelga, aborta y avisa en vez de quedarse pegado. */
export async function transcribeAudio(base64, mime, timeoutMs = 25000) {
  const ctrl = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = ctrl ? setTimeout(() => ctrl.abort(), timeoutMs) : 0;
  let res;
  try {
    res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audio: base64, mime }),
      signal: ctrl ? ctrl.signal : undefined,
    });
  } catch (e) {
    if (e && e.name === 'AbortError') {
      throw new Error('La transcripción tardó demasiado. Revisa tu conexión o escribe la frase.');
    }
    throw new Error('No se pudo enviar el audio. Revisa tu conexión o escribe la frase.');
  } finally {
    if (timer) clearTimeout(timer);
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data && data.error ? data.error : 'No se pudo transcribir el audio.');
  return (data && typeof data.transcript === 'string') ? data.transcript : '';
}

// ¿Debemos usar la ruta de grabación+Gemini en vez de Web Speech?
// En iOS (Safari y Chrome, ambos WebKit) SpeechRecognition no es fiable.
export function isAppleWebKit() {
  const ua = navigator.userAgent || '';
  const iOS = /iP(hone|ad|od)/.test(ua)
    || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  return iOS;
}

export function preferServerSpeech() {
  return isAppleWebKit() || !recognitionSupported();
}
