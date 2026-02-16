import { getApp } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-app.js';
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-firestore.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.7.0/firebase-auth.js';

const PREFS_STORAGE_KEY = 'hayati_prefs_v1';
const PREFS_CHANGED_EVENT = 'hayatiPrefsChanged';

const DEFAULT_PREFS = {
  language: 'ru',
  currency: 'USD',
  metricSystem: 'imperial',
  timezone: 'utc',
  updatedAtMs: 0
};

let initialized = false;
let activeUid = null;
let isApplyingRemote = false;
let unsubscribeRemote = null;
let pushTimer = null;
let warnedNoFirebaseAuth = false;

function normalizePrefs(raw = {}) {
  return {
    language: String(raw.language || DEFAULT_PREFS.language).toLowerCase(),
    currency: String(raw.currency || DEFAULT_PREFS.currency).toUpperCase(),
    metricSystem: String(raw.metricSystem || DEFAULT_PREFS.metricSystem).toLowerCase(),
    timezone: String(raw.timezone || DEFAULT_PREFS.timezone).toLowerCase(),
    updatedAtMs: Number(raw.updatedAtMs || 0) || 0
  };
}

function readLocalPrefs() {
  try {
    const raw = localStorage.getItem(PREFS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return normalizePrefs({
      ...parsed,
      language: parsed.language || localStorage.getItem('hayati_lang') || DEFAULT_PREFS.language
    });
  } catch (_error) {
    return normalizePrefs({
      language: localStorage.getItem('hayati_lang') || DEFAULT_PREFS.language
    });
  }
}

function writeLocalPrefs(prefs, source = 'cloud') {
  const next = normalizePrefs(prefs);
  localStorage.setItem(PREFS_STORAGE_KEY, JSON.stringify(next));
  localStorage.setItem('hayati_lang', next.language);
  window.dispatchEvent(new CustomEvent(PREFS_CHANGED_EVENT, {
    detail: { prefs: next, source }
  }));
  return next;
}

function getEffectiveUid(auth) {
  return auth?.currentUser?.uid || null;
}

async function pushPrefsToCloud(db, uid, prefs) {
  const prefsRef = doc(db, 'users', uid, 'preferences', 'global');
  const payload = normalizePrefs({
    ...prefs,
    updatedAtMs: Number(prefs.updatedAtMs || Date.now())
  });

  await setDoc(prefsRef, {
    ...payload,
    updatedAt: serverTimestamp(),
    source: 'cabinet-web'
  }, { merge: true });
}

function scheduleCloudPush(db, uid, prefs) {
  if (!uid) return;

  if (pushTimer) {
    clearTimeout(pushTimer);
  }

  pushTimer = setTimeout(async () => {
    try {
      await pushPrefsToCloud(db, uid, prefs);
      console.log('[prefsSync] Cloud push complete:', uid);
    } catch (error) {
      console.warn('[prefsSync] Cloud push skipped:', error?.message || error);
    }
  }, 400);
}

function applyCloudLanguageIfNeeded(nextPrefs) {
  const cloudLang = nextPrefs.language;
  if (!window.i18n?.isSupported?.(cloudLang)) return;

  const currentLang = window.i18n?.getCurrentLanguage?.();
  if (currentLang === cloudLang) return;

  window.i18n.setLanguage(cloudLang).catch((error) => {
    console.warn('[prefsSync] Language apply failed:', error?.message || error);
  });
}

async function attachRemoteListener(db, auth, uid) {
  if (unsubscribeRemote) {
    unsubscribeRemote();
    unsubscribeRemote = null;
  }

  const prefsRef = doc(db, 'users', uid, 'preferences', 'global');
  const localPrefs = readLocalPrefs();

  try {
    const snap = await getDoc(prefsRef);
    if (!snap.exists()) {
      const seedPrefs = normalizePrefs({
        ...localPrefs,
        updatedAtMs: localPrefs.updatedAtMs || Date.now()
      });
      scheduleCloudPush(db, uid, seedPrefs);
    } else {
      const cloudPrefs = normalizePrefs(snap.data());
      if (cloudPrefs.updatedAtMs > localPrefs.updatedAtMs) {
        isApplyingRemote = true;
        writeLocalPrefs(cloudPrefs, 'cloud-init');
        applyCloudLanguageIfNeeded(cloudPrefs);
        isApplyingRemote = false;
      } else {
        const localFresh = normalizePrefs({
          ...localPrefs,
          updatedAtMs: localPrefs.updatedAtMs || Date.now()
        });
        scheduleCloudPush(db, uid, localFresh);
      }
    }
  } catch (error) {
    console.warn('[prefsSync] Initial cloud read skipped:', error?.message || error);
  }

  unsubscribeRemote = onSnapshot(prefsRef, (snap) => {
    if (!snap.exists()) return;

    const cloudPrefs = normalizePrefs(snap.data());
    const currentLocal = readLocalPrefs();

    if (cloudPrefs.updatedAtMs <= currentLocal.updatedAtMs) return;

    isApplyingRemote = true;
    writeLocalPrefs(cloudPrefs, 'cloud-live');
    applyCloudLanguageIfNeeded(cloudPrefs);
    isApplyingRemote = false;
  }, (error) => {
    console.warn('[prefsSync] Live listener disabled:', error?.message || error);
  });

  activeUid = uid;

  const uidFromSession = getEffectiveUid(auth);
  if (uidFromSession && uidFromSession === uid) {
    const latestLocal = readLocalPrefs();
    if (!latestLocal.updatedAtMs) {
      writeLocalPrefs({ ...latestLocal, updatedAtMs: Date.now() }, 'bootstrap');
    }
  }
}

export function setupPreferencesCloudSync(auth) {
  if (initialized) return;
  initialized = true;

  let db;
  try {
    db = getFirestore(getApp());
  } catch (error) {
    console.warn('[prefsSync] Firestore not available:', error?.message || error);
    return;
  }

  window.addEventListener(PREFS_CHANGED_EVENT, (event) => {
    if (isApplyingRemote) return;

    const uid = activeUid || getEffectiveUid(auth);
    if (!uid) {
      if (!warnedNoFirebaseAuth) {
        warnedNoFirebaseAuth = true;
        console.log('[prefsSync] Firebase user is not signed in. Firestore sync skipped; local prefs only.');
      }
      return;
    }

    const incoming = event?.detail?.prefs || readLocalPrefs();
    const normalized = normalizePrefs({
      ...incoming,
      updatedAtMs: Number(incoming.updatedAtMs || Date.now())
    });

    scheduleCloudPush(db, uid, normalized);
  });

  onAuthStateChanged(auth, async (user) => {
    if (!user?.uid) {
      activeUid = null;
      if (unsubscribeRemote) {
        unsubscribeRemote();
        unsubscribeRemote = null;
      }
      return;
    }

    warnedNoFirebaseAuth = false;
    await attachRemoteListener(db, auth, user.uid);
  });
}
