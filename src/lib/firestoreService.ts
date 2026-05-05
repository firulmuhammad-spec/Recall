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
import { db, auth } from './firebase';
import { RecallPackage, AppSettings } from '../types';

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
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
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

  getSettings: async (): Promise<AppSettings | null> => {
    const path = 'settings/config';
    try {
      const docSnap = await getDoc(doc(db, 'settings', 'config'));
      if (docSnap.exists()) {
        return docSnap.data() as AppSettings;
      }
      return null;
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, path);
      return null;
    }
  },

  saveSettings: async (settings: Omit<AppSettings, 'id'>) => {
    const path = 'settings/config';
    try {
      await setDoc(doc(db, 'settings', 'config'), settings);
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, path);
    }
  }
};
