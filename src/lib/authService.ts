import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updatePassword as updateFirebasePassword,
  signOut as firebaseSignOut
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './firebase';

const SESSION_KEY = 'recall_last_seen';
const THREE_MONTHS_MS = 3 * 30 * 24 * 60 * 60 * 1000;

export const AuthService = {
  login: async (username: string, password: string) => {
    const email = `${username.toLowerCase()}@recall.local`;
    try {
      const result = await signInWithEmailAndPassword(auth, email, password);
      
      // Update last seen
      localStorage.setItem(SESSION_KEY, Date.now().toString());
      
      return result.user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

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
    // Update last seen on every active check
    localStorage.setItem(SESSION_KEY, Date.now().toString());
    return true;
  },

  updatePassword: async (newPassword: string) => {
    if (auth.currentUser) {
      await updateFirebasePassword(auth.currentUser, newPassword);
    }
  },

  // Seed default users if they don't exist
  // Note: This is an internal helper. In production, we'd use a server-side script.
  seedDefaultUsers: async () => {
    const defaults = [
      { username: 'admin', password: '123', displayName: 'Super Admin', role: 'Admin' },
      { username: 'firul', password: '123', displayName: 'Firul', role: 'User' },
      { username: 'zahra', password: '123', displayName: 'Zahra', role: 'User' }
    ];

    let successCount = 0;
    let errors: string[] = [];

    for (const u of defaults) {
      const email = `${u.username}@recall.local`;
      try {
        // Try creating the auth user
        const cred = await createUserWithEmailAndPassword(auth, email, u.password);
        // Create the firestore profile
        await setDoc(doc(db, 'users', cred.user.uid), {
          username: u.username,
          displayName: u.displayName,
          role: u.role,
          preferences: {
            viewMode: 'grid',
            sortBy: 'newest'
          },
          createdAt: serverTimestamp()
        });
        successCount++;
        console.log(`Seeded user: ${u.username}`);
      } catch (err: any) {
        if (err.code === 'auth/email-already-in-use') {
          console.log(`User ${u.username} already exists`);
          successCount++;
        } else {
          console.error(`Error seeding ${u.username}:`, err);
          errors.push(err.code || err.message);
        }
      }
    }

    if (successCount === 0 && errors.length > 0) {
      throw new Error(errors[0]);
    }
  }
};
