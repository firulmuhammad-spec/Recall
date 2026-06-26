import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  where, 
  serverTimestamp,
  Timestamp
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { RecallPackage, AppSettings, UserProfile } from '../types';

export const FirestoreService = {
  getPackages: (isAdmin: boolean, callback: (packages: RecallPackage[]) => void) => {
    if (!auth.currentUser) return () => {};
    const uid = auth.currentUser.uid;

    const q = isAdmin
      ? query(collection(db, 'packages'))
      : query(collection(db, 'packages'), where('ownerId', '==', uid));

    console.log(`Subscribing to packages. Admin: ${isAdmin}, UID: ${uid}`);

    return onSnapshot(q, (snapshot) => {
      const packages = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          ...data
        };
      }) as RecallPackage[];

      // Filter out deleted ones
      const nonDeleted = packages.filter(p => p.isDeleted !== true);

      // Sort: Pinned first, then date descending
      const sortedPackages = nonDeleted.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;

        const getTime = (val: any) => {
          if (!val) return Date.now();
          if (typeof val.toMillis === 'function') return val.toMillis();
          if (val.seconds) return val.seconds * 1000;
          return new Date(val).getTime() || 0;
        };
        return getTime(b.tanggalInput) - getTime(a.tanggalInput);
      });

      callback(sortedPackages);
    }, (error) => {
      console.error("Error subscribing to packages:", error);
    });
  },

  getTrash: (callback: (packages: RecallPackage[]) => void) => {
    if (!auth.currentUser) return () => {};
    const uid = auth.currentUser.uid;

    let unsubPackages: (() => void) | null = null;

    // First fetch the user's profile to check if they are an Admin
    const unsubUser = onSnapshot(doc(db, 'users', uid), (docSnap) => {
      const data = docSnap.data();
      const isAdmin = data?.role === 'Admin';

      if (unsubPackages) unsubPackages();

      const q = isAdmin
        ? query(collection(db, 'packages'), where('isDeleted', '==', true))
        : query(collection(db, 'packages'), where('ownerId', '==', uid), where('isDeleted', '==', true));

      unsubPackages = onSnapshot(q, (snapshot) => {
        const packages = snapshot.docs.map(docSnap => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            ...data
          };
        }) as RecallPackage[];
        callback(packages);
      }, (error) => {
        console.error("Error subscribing to trash packages:", error);
      });
    }, (error) => {
      console.error("Error subscribing to user profile for trash:", error);
    });

    return () => {
      unsubUser();
      if (unsubPackages) unsubPackages();
    };
  },

  restoreFromTrash: async (id: string) => {
    try {
      const docRef = doc(db, 'packages', id);
      await updateDoc(docRef, {
        isDeleted: false,
        deletedAt: null
      });
    } catch (error) {
      console.error("Error restoring from trash:", error);
      throw error;
    }
  },

  deletePermanently: async (id: string) => {
    try {
      const docRef = doc(db, 'packages', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting permanently:", error);
      throw error;
    }
  },

  togglePin: async (id: string, isPinned: boolean) => {
    try {
      const docRef = doc(db, 'packages', id);
      await updateDoc(docRef, { isPinned });
    } catch (error) {
      console.error("Error toggling pin:", error);
      throw error;
    }
  },

  moveToTrash: async (id: string) => {
    try {
      const docRef = doc(db, 'packages', id);
      await updateDoc(docRef, {
        isDeleted: true,
        deletedAt: serverTimestamp()
      });
    } catch (error) {
      console.error("Error moving to trash:", error);
      throw error;
    }
  },

  addPackage: async (data: Omit<RecallPackage, 'id' | 'tanggalInput' | 'ownerId'>) => {
    try {
      if (!auth.currentUser) throw new Error('User not authenticated');
      const payload = {
        ...data,
        ownerId: auth.currentUser.uid,
        isDeleted: false,
        isPinned: false,
        tanggalInput: serverTimestamp()
      };
      const docRef = await addDoc(collection(db, 'packages'), payload);
      return docRef.id;
    } catch (error) {
      console.error("Error adding package:", error);
      throw error;
    }
  },

  updatePackage: async (id: string, data: Partial<Omit<RecallPackage, 'id' | 'tanggalInput' | 'ownerId'>>) => {
    try {
      const docRef = doc(db, 'packages', id);
      await updateDoc(docRef, data);
    } catch (error) {
      console.error("Error updating package:", error);
      throw error;
    }
  },

  deletePackage: async (id: string) => {
    try {
      const docRef = doc(db, 'packages', id);
      await deleteDoc(docRef);
    } catch (error) {
      console.error("Error deleting package:", error);
      throw error;
    }
  },

  getSettings: (callback: (settings: AppSettings | null) => void) => {
    const docRef = doc(db, 'settings', 'config');
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: 'settings', ...docSnap.data() } as AppSettings);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("Error subscribing to settings:", error);
    });
  },

  saveSettings: async (settings: Omit<AppSettings, 'id'>) => {
    try {
      const docRef = doc(db, 'settings', 'config');
      await setDoc(docRef, settings);
    } catch (error) {
      console.error("Error saving settings:", error);
      throw error;
    }
  },

  // User Profile
  getUserProfile: async (uid: string) => {
    try {
      const docSnap = await getDoc(doc(db, 'users', uid));
      if (docSnap.exists()) {
        return { id: docSnap.id, ...docSnap.data() } as UserProfile;
      }
      return null;
    } catch (error) {
      console.error("Error getting user profile:", error);
      return null;
    }
  },

  subscribeToProfile: (uid: string, callback: (profile: UserProfile | null) => void) => {
    return onSnapshot(doc(db, 'users', uid), (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...docSnap.data() } as UserProfile);
      } else {
        callback(null);
      }
    }, (error) => {
      console.error("Error subscribing to profile:", error);
    });
  },

  updateUserProfile: async (uid: string, data: any) => {
    try {
      const docRef = doc(db, 'users', uid);
      await setDoc(docRef, data, { merge: true });
    } catch (error) {
      console.error("Error updating user profile:", error);
      throw error;
    }
  },

  getAllUsers: async (callback: (users: any[]) => void) => {
    const q = query(collection(db, 'users'));
    return onSnapshot(q, (snapshot) => {
      const users = snapshot.docs.map(docSnap => ({
        id: docSnap.id,
        ...docSnap.data()
      }));
      callback(users);
    }, (error) => {
      console.error("Error subscribing to all users:", error);
    });
  }
};

