import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, browserLocalPersistence, setPersistence } from 'firebase/auth';
import { initializeFirestore, doc, getDocFromServer, CACHE_SIZE_UNLIMITED, terminate, clearIndexedDbPersistence, enableNetwork, disableNetwork, memoryLocalCache } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const config = firebaseConfig;
const app = initializeApp(config);

// Set persistence to local (survive browser restart)
const authInstance = getAuth(app);
setPersistence(authInstance, browserLocalPersistence).catch(err => console.error("Persistence error:", err));

export const auth = authInstance;

// Initialize Firestore with settings to bypass potential proxy/websocket issues
const firestoreSettings = {
  experimentalForceLongPolling: true,
  localCache: memoryLocalCache(),
  ignoreUndefinedProperties: true
};

const databaseId = config.firestoreDatabaseId && config.firestoreDatabaseId !== "" && config.firestoreDatabaseId !== "(default)"
  ? config.firestoreDatabaseId
  : undefined;

export const db = initializeFirestore(app, firestoreSettings, databaseId);

export { enableNetwork, disableNetwork, getDocFromServer };

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ 
  prompt: 'select_account' 
});

// Utility to reset Firestore in case it gets stuck in offline state
export const resetFirestore = async () => {
  try {
    await terminate(db);
    await clearIndexedDbPersistence(db);
    console.log("Firestore cache cleared successfully.");
    window.location.reload();
  } catch (err) {
    console.error("Error resetting Firestore:", err);
  }
};

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    console.error('Firebase Auth Error:', error.code, error.message);
    throw error;
  }
};

export const signInWithGoogleRedirect = () => {
  return signInWithRedirect(auth, googleProvider);
};

export const handleRedirectResult = () => {
  return getRedirectResult(auth);
};
