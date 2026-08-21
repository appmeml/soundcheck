// Normalización de texto antes de comparar objetivo vs. lo que dijo/escribió
// el usuario. Esto separa una app usable de una frustrante: sin esto,
// "I am" nunca haría match con "I'm".

// Contracciones expandidas en AMBOS lados de la comparación.
// Se expande siempre a la forma larga para unificar.
const CONTRACTIONS = [
  [/\bi'm\b/g, 'i am'],
  [/\bdon't\b/g, 'do not'],
  [/\bdoesn't\b/g, 'does not'],
  [/\bdidn't\b/g, 'did not'],
  [/\bcan't\b/g, 'cannot'],
  [/\bwon't\b/g, 'will not'],
  [/\bit's\b/g, 'it is'],
  [/\bthat's\b/g, 'that is'],
  [/\bwhat's\b/g, 'what is'],
  [/\bwhere's\b/g, 'where is'],
  [/\bhow's\b/g, 'how is'],
  [/\bhe's\b/g, 'he is'],
  [/\bshe's\b/g, 'she is'],
  [/\bwe're\b/g, 'we are'],
  [/\bthey're\b/g, 'they are'],
  [/\byou're\b/g, 'you are'],
  [/\bi'll\b/g, 'i will'],
  [/\byou'll\b/g, 'you will'],
  [/\bwe'll\b/g, 'we will'],
  [/\bi've\b/g, 'i have'],
  [/\byou've\b/g, 'you have'],
  [/\bwe've\b/g, 'we have'],
  [/\bisn't\b/g, 'is not'],
  [/\baren't\b/g, 'are not'],
  [/\bi'd\b/g, 'i would'],
  [/\blet's\b/g, 'let us'],
];

// Variantes que se unifican a una sola forma.
const VARIANTS = [
  [/\bwi[\s-]?fi\b/g, 'wifi'],
  [/\bcheck[\s-]?out\b/g, 'checkout'],
  [/\bcheck[\s-]?in\b/g, 'checkin'],
  [/\brest[\s-]?room(s?)\b/g, 'restroom$1'],
  [/\ba\.?\s?c\.?\b/g, 'ac'],
  [/\bo\.?\s?k\.?\b/g, 'ok'],
];

/**
 * Devuelve un arreglo de palabras normalizadas listas para comparar.
 * - minúsculas
 * - contracciones y variantes unificadas
 * - sin puntuación
 */
export function normalizeWords(text) {
  if (!text) return [];
  let s = String(text).toLowerCase();

  // Unicode: quita comillas tipográficas y las vuelve simples.
  s = s.replace(/[‘’ʼ]/g, "'").replace(/[“”]/g, '"');

  for (const [re, rep] of CONTRACTIONS) s = s.replace(re, rep);
  for (const [re, rep] of VARIANTS) s = s.replace(re, rep);

  // Quita toda puntuación excepto letras/números/espacios y apóstrofos internos.
  s = s.replace(/[^\p{L}\p{N}\s'-]/gu, ' ');
  s = s.replace(/[-']/g, ' '); // separa palabras compuestas restantes

  return s.split(/\s+/).filter(Boolean);
}
