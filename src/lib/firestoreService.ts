import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot,
  serverTimestamp,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db, auth, enableNetwork, getDocFromServer } from './firebase';
import { RecallPackage, AppSettings, UserProfile } from '../types';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const message = error instanceof Error ? error.message : String(error);
  
  // Special handling for missing indexes
  if (message.includes('index') || message.includes('FAILED_PRECONDITION')) {
    console.warn('--- FIRESTORE INDEX REQUIRED ---');
    console.warn('The current query requires a composite index.');
    console.warn('Please follow this link to create it:');
    const indexUrl = message.match(/https:\/\/console\.firebase\.google\.com[^\s"]+/);
    if (indexUrl) {
      console.warn(indexUrl[0]);
    } else {
      console.warn('Check the full error object for the index creation URL.');
    }
    console.warn('---------------------------------');
    return; // Don't throw for index errors, just warn
  }

  const errInfo: FirestoreErrorInfo = {
    error: message,
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const FirestoreService = {
  getPackages: (callback: (packages: RecallPackage[]) => void) => {
    if (!auth.currentUser) return;
    const path = 'packages';
    const q = query(
      collection(db, path),
      where('ownerId', '==', auth.currentUser.uid),
      orderBy('tanggalInput', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const packages = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as RecallPackage[];
      callback(packages);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  },

  addPackage: async (data: Omit<RecallPackage, 'id' | 'tanggalInput' | 'ownerId'>) => {
    const path = 'packages';
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');
      const docRef = await addDoc(collection(db, path), {
        ...data,
        ownerId: auth.currentUser.uid,
        tanggalInput: serverTimestamp(),
      });
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  },

  updatePackage: async (id: string, data: Partial<Omit<RecallPackage, 'id' | 'tanggalInput' | 'ownerId'>>) => {
    const path = `packages/${id}`;
    try {
      await updateDoc(doc(db, 'packages', id), data as any);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  deletePackage: async (id: string) => {
    const path = `packages/${id}`;
    try {
      await deleteDoc(doc(db, 'packages', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, path);
    }
  },

  getSettings: (callback: (settings: AppSettings | null) => void) => {
    const path = 'settings/config';
    return onSnapshot(doc(db, 'settings', 'config'), (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as AppSettings);
      } else {
        callback(null);
      }
    }, (error) => {
      if (error.message?.includes('offline')) {
        console.warn("Settings listener offline");
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    });
  },

  saveSettings: async (settings: Omit<AppSettings, 'id'>) => {
    const path = 'settings/config';
    try {
      await setDoc(doc(db, 'settings', 'config'), settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  },

  // User Profile
  getUserProfile: async (uid: string) => {
    const path = `users/${uid}`;
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() };
      }
      return null;
    } catch (error: any) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  subscribeToProfile: (uid: string, callback: (profile: UserProfile | null) => void) => {
    const path = `users/${uid}`;
    return onSnapshot(doc(db, 'users', uid), (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() } as UserProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      // Don't throw for background updates if offline, just log
      if (error.message?.includes('offline')) {
        console.warn("Profile listener offline");
      } else {
        handleFirestoreError(error, OperationType.GET, path);
      }
    });
  },

  updateUserProfile: async (uid: string, data: any) => {
    const path = `users/${uid}`;
    try {
      await updateDoc(doc(db, 'users', uid), data);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, path);
    }
  },

  getAllUsers: async (callback: (users: any[]) => void) => {
    const path = 'users';
    const q = query(collection(db, path));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      callback(users);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, path);
    });
  }
};
