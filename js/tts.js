/**
 * Browser Text-to-Speech abstraction.
 *
 * Turkish  : prefers tr-TR voice, falls back to browser default.
 * English  : uses en-US voice for post-game answer playback.
 *
 * Voices are loaded asynchronously; we cache them after the first
 * `voiceschanged` event so subsequent calls never block.
 */

let _cachedVoices = [];

function _loadVoices() {
  if (_cachedVoices.length) return Promise.resolve(_cachedVoices);
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const attempt = () => {
      const voices = synth.getVoices();
      if (voices.length) { _cachedVoices = voices; resolve(voices); }
    };
    synth.onvoiceschanged = () => {
      _cachedVoices = synth.getVoices();
      resolve(_cachedVoices);
    };
    attempt(); // Chrome may already have voices synchronously
  });
}

function _pickVoice(voices, langPrefix) {
  return voices.find(v => v.lang.startsWith(langPrefix)) ?? null;
}

function _createUtterance(text, { lang, rate, pitch, volume, voice }) {
  const utt   = new SpeechSynthesisUtterance(text);
  utt.lang    = lang;
  utt.rate    = rate;
  utt.pitch   = pitch;
  utt.volume  = volume;
  if (voice) utt.voice = voice;
  return utt;
}

/**
 * Speak text with the given language config.
 * @param {string} text
 * @param {{ lang?: string, rate?: number, pitch?: number, volume?: number, onStart?: Function, onEnd?: Function }} options
 */
async function _speak(text, { lang = 'tr-TR', rate = 0.78, pitch = 1.0, volume = 1.0, onStart, onEnd } = {}) {
  if (!window.speechSynthesis) return;

  window.speechSynthesis.cancel();

  const voices  = await _loadVoices();
  const langPrefix = lang.split('-')[0]; // 'tr' or 'en'
  const voice   = _pickVoice(voices, langPrefix);

  const utt     = _createUtterance(text, { lang, rate, pitch, volume, voice });
  utt.onstart   = onStart ?? null;
  utt.onend     = onEnd   ?? null;
  utt.onerror   = onEnd   ?? null; // treat error as "finished"

  window.speechSynthesis.speak(utt);
}

/** Speak a Turkish word (tr-TR). */
export function speak(text, callbacks = {}) {
  return _speak(text, { lang: 'tr-TR', rate: 0.78, pitch: 1.0, volume: 1.0, ...callbacks });
}

/** Speak an English string (en-US) — used for post-game answer playback. */
export function speakEnglish(text, callbacks = {}) {
  return _speak(text, { lang: 'en-US', rate: 0.85, pitch: 1.0, volume: 1.0, ...callbacks });
}

export function isSupported() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}
