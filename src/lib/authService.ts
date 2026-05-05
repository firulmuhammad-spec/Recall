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
    const lastSeen = localStorage.getItem(SESSION_KEY);
    if (lastSeen) {
      const lastSeenTime = parseInt(lastSeen, 10);
      if (Date.now() - lastSeenTime > THREE_MONTHS_MS) {
        await firebaseSignOut(auth);
        localStorage.removeItem(SESSION_KEY);
        return false;
      }
    }
    // Update last seen
    localStorage.setItem(SESSION_KEY, Date.now().toString());
    return true;
  }
};
