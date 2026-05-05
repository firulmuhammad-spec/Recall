import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result;
  } catch (error: any) {
    if (error.code === 'auth/cancelled-popup-request') {
      console.warn('Popup request was cancelled (likely a duplicate call).');
      return null;
    }
    if (error.code === 'auth/popup-closed-by-user') {
      console.warn('User closed the login popup.');
      return null;
    }
    if (error.code === 'auth/popup-blocked') {
      alert('Login popup was blocked by your browser. Please allow popups for this site.');
      return null;
    }
    console.error('Firebase Auth Error:', error);
    throw error;
  }
};

// Connection test
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error("Please check your Firebase configuration.");
    }
  }
}
testConnection();
