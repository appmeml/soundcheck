// Capa de datos: Firebase Auth + Firestore con persistencia offline.
// Todo lo que toca la red vive aquí. Los módulos de lógica (lcs, leitner,
// weakspots) son puros y no dependen de esto.

import { firebaseConfig } from './firebaseConfig.js';

// Versión del SDK de Firebase servida por CDN. Si algún día la app deja de
// cargar por un 404 de gstatic, sube/baja este número (ver README).
const FB = '11.6.1';
const CDN = `https://www.gstatic.com/firebasejs/${FB}`;

const { initializeApp } = await import(`${CDN}/firebase-app.js`);
const {
  getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect,
  getRedirectResult, signOut: fbSignOut, onAuthStateChanged,
} = await import(`${CDN}/firebase-auth.js`);
const {
  initializeFirestore, persistentLocalCache, persistentMultipleTabManager,
  doc, collection, getDoc, getDocs, setDoc, writeBatch, increment,
  query, where, limit,
} = await import(`${CDN}/firebase-firestore.js`);

const app = initializeApp(firebaseConfig);

// Persistencia offline multipestaña — crítico para usarla en Orlando sin datos.
const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

const auth = getAuth(app);
const provider = new GoogleAuthProvider();

// ---------- Autenticación ----------

export function onAuth(cb) {
  return onAuthStateChanged(auth, cb);
}

export async function signIn() {
  try {
    await signInWithPopup(auth, provider);
  } catch (e) {
    // Algunos navegadores/PWA bloquean el popup; caemos a redirect.
    if (e && (e.code === 'auth/popup-blocked' || e.code === 'auth/operation-not-supported-in-this-environment')) {
      await signInWithRedirect(auth, provider);
      return;
    }
    throw e;
  }
}

export async function resolveRedirect() {
  try { await getRedirectResult(auth); } catch (_) { /* ignora */ }
}

export function signOutUser() {
  return fbSignOut(auth);
}

// ---------- Usuario ----------

export async function ensureUserDoc(user) {
  const ref = doc(db, 'users', user.uid);
  const snap = await getDoc(ref);
  const now = Date.now();
  if (!snap.exists()) {
    const data = {
      displayName: user.displayName || 'Sin nombre',
      photoURL: user.photoURL || '',
      email: user.email || '',
      familyId: null,
      createdAt: now,
      lastSessionAt: null,
      streak: 0,
      totalAttempts: 0,
      masteredCount: 0,
    };
    await setDoc(ref, data);
    return data;
  }
  return snap.data();
}

export async function getUserDoc(uid) {
  const snap = await getDoc(doc(db, 'users', uid));
  return snap.exists() ? snap.data() : null;
}

export async function loadCards(uid) {
  const snap = await getDocs(collection(db, 'users', uid, 'cards'));
  const map = {};
  snap.forEach((d) => { map[d.id] = d.data(); });
  return map;
}

/**
 * Escribe TODA la sesión en un solo writeBatch. Con offline habilitado esto
 * hace que la sesión completa se sincronice de una sola vez al recuperar señal.
 * @param {string} uid
 * @param {Array<{phraseId, card, attempt}>} results
 * @param {{masteredCount, streak, familyId, displayName, photoURL}} agg
 */
export async function commitSession(uid, results, agg, now = Date.now()) {
  const batch = writeBatch(db);

  for (const r of results) {
    batch.set(doc(db, 'users', uid, 'cards', r.phraseId), r.card, { merge: true });
    const attemptRef = doc(collection(db, 'users', uid, 'attempts'));
    batch.set(attemptRef, { ...r.attempt, at: now });
  }

  batch.set(doc(db, 'users', uid), {
    totalAttempts: increment(results.length),
    masteredCount: agg.masteredCount,
    streak: agg.streak,
    lastSessionAt: now,
  }, { merge: true });

  // Espejo público en el marcador de la familia (solo agregados).
  if (agg.familyId) {
    batch.set(doc(db, 'families', agg.familyId, 'scoreboard', uid), {
      displayName: agg.displayName || '',
      photoURL: agg.photoURL || '',
      masteredCount: agg.masteredCount,
      streak: agg.streak,
      updatedAt: now,
    }, { merge: true });
  }

  await batch.commit();
}

// ---------- Familia ----------

function randomCode() {
  const A = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // sin I ni O para no confundir
  let s = '';
  for (let i = 0; i < 6; i++) s += A[Math.floor(Math.random() * A.length)];
  return s;
}

export async function createFamily(user, name) {
  const now = Date.now();
  let code = '';
  // Reintenta si el código ya existe (colisión muy improbable).
  for (let tries = 0; tries < 6; tries++) {
    code = randomCode();
    const mapRef = doc(db, 'joinCodes', code);
    const existing = await getDoc(mapRef);
    if (existing.exists()) continue;

    const familyId = code; // el código es también el id de la familia
    const batch = writeBatch(db);
    batch.set(doc(db, 'families', familyId), {
      name: name || 'Mi familia',
      joinCode: code,
      createdBy: user.uid,
      createdAt: now,
    });
    batch.set(mapRef, { familyId });
    batch.set(doc(db, 'users', user.uid), { familyId }, { merge: true });
    batch.set(doc(db, 'families', familyId, 'scoreboard', user.uid), {
      displayName: user.displayName || '',
      photoURL: user.photoURL || '',
      masteredCount: 0,
      streak: 0,
      updatedAt: now,
    });
    await batch.commit();
    return { familyId, code };
  }
  throw new Error('No se pudo generar un código único. Intenta de nuevo.');
}

export async function joinFamily(user, rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!/^[A-Z]{6}$/.test(code)) {
    throw new Error('El código debe tener 6 letras.');
  }
  const mapSnap = await getDoc(doc(db, 'joinCodes', code));
  if (!mapSnap.exists()) {
    throw new Error('No existe un grupo con ese código.');
  }
  const familyId = mapSnap.data().familyId;
  const now = Date.now();
  const me = await getUserDoc(user.uid);

  const batch = writeBatch(db);
  batch.set(doc(db, 'users', user.uid), { familyId }, { merge: true });
  batch.set(doc(db, 'families', familyId, 'scoreboard', user.uid), {
    displayName: user.displayName || '',
    photoURL: user.photoURL || '',
    masteredCount: (me && me.masteredCount) || 0,
    streak: (me && me.streak) || 0,
    updatedAt: now,
  }, { merge: true });
  await batch.commit();
  return { familyId };
}

export async function getFamily(familyId) {
  const snap = await getDoc(doc(db, 'families', familyId));
  return snap.exists() ? snap.data() : null;
}

export async function getScoreboard(familyId) {
  const snap = await getDocs(collection(db, 'families', familyId, 'scoreboard'));
  const rows = [];
  snap.forEach((d) => rows.push({ uid: d.id, ...d.data() }));
  rows.sort((a, b) => (b.masteredCount || 0) - (a.masteredCount || 0));
  return rows;
}

export { db, auth };
