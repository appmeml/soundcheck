// Configuración pública real del proyecto soundcheck-familia.
// Nota: la apiKey de Firebase para web NO es un secreto — identifica al
// proyecto y su acceso se controla con las Reglas de Seguridad de Firestore
// (ver firestore.rules) y los Dominios Autorizados en Firebase Auth.
// La ÚNICA llave secreta del proyecto es GEMINI_API_KEY, que vive solo en
// Cloudflare (functions/api/chat.js) y nunca llega al navegador.
export const firebaseConfig = {
  apiKey: 'AIzaSyCc1jxpSQ_hHRIY_FJTlZzBxXXea4bIcWw',
  authDomain: 'soundcheck-familia.firebaseapp.com',
  projectId: 'soundcheck-familia',
  storageBucket: 'soundcheck-familia.firebasestorage.app',
  messagingSenderId: '361453124924',
  appId: '1:361453124924:web:f1a8b64423fef977183239',
};

// Fecha del viaje para la cuenta regresiva de la pantalla HOY.
export const TRIP_DATE = '2026-09-06';
