// Voz nativa (Web Speech API) + medidor VU en vivo (Web Audio API).
// Todo gratis e ilimitado. Limpieza de recursos estricta: si no se cierran
// el stream y el AudioContext, el indicador de micrófono se queda prendido
// y drena la batería.

// ---------- SpeechSynthesis (escuchar) ----------

let cachedVoice = null;

function pickEnglishVoice() {
  const voices = window.speechSynthesis ? window.speechSynthesis.getVoices() : [];
  if (!voices.length) return null;
  // Preferimos una voz en-US.
  return (
    voices.find((v) => v.lang === 'en-US') ||
    voices.find((v) => /^en[-_]US/i.test(v.lang)) ||
    voices.find((v) => /^en/i.test(v.lang)) ||
    null
  );
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
    u.lang = 'en-US';
    u.rate = rate;
    const v = cachedVoice || pickEnglishVoice();
    if (v) u.voice = v;
    u.onend = () => resolve(true);
    u.onerror = () => resolve(false);
    window.speechSynthesis.speak(u);
  });
}

export function stopSpeaking() {
  if (window.speechSynthesis) window.speechSynthesis.cancel();
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
    abort() { try { rec.abort(); } catch (_) {} },
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
