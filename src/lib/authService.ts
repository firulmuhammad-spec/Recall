import { 
  signOut as firebaseSignOut
} from 'firebase/auth';
import { auth } from './firebase';

const SESSION_KEY = 'recall_last_seen';
const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

export const AuthService = {
  logout: async () => {
    localStorage.removeItem(SESSION_KEY);
    await firebaseSignOut(auth);
  },

  checkSession: async () => {
    try {
      const lastSeen = localStorage.getItem(SESSION_KEY);
      console.log("Checking session. Last seen:", lastSeen);
      if (lastSeen) {
        const lastSeenTime = parseInt(lastSeen, 10);
        if (isNaN(lastSeenTime) || Date.now() - lastSeenTime > THREE_MONTHS_MS) {
          console.warn("Session expired or corrupt. Logging out.");
          await firebaseSignOut(auth);
          localStorage.removeItem(SESSION_KEY);
          return false;
        }
      }
      // Update last seen
      localStorage.setItem(SESSION_KEY, Date.now().toString());
      return true;
    } catch (e) {
      console.error("Error checking session/localStorage:", e);
      return true; // Fallback to true if localStorage fails
    }
  }
};
