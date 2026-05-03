import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User 
} from 'firebase/auth';
import { auth, db } from './firebase';
import { doc, getDoc, setDoc, serverTimestamp, query, collection, where, getDocs, deleteDoc } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  loading: boolean;
  signIn: () => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (newData: any) => Promise<void>;
  resetAccount: () => Promise<void>;
  clearReviewsOnly: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set a timeout as a fail-safe for loading
    const loadingTimeout = setTimeout(() => {
      if (loading) {
        console.warn('Firebase connection timeout - proceeding with local state');
        setLoading(false);
      }
    }, 4000);

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setProfile(userDoc.data());
          } else {
            const newProfile = {
              uid: user.uid,
              name: user.displayName || '新同学',
              email: user.email,
              photo: user.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.uid}`,
              role: 'student',
              level: 1,
              exp: 0,
              createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', user.uid), newProfile);
            setProfile(newProfile);
          }
        } catch (e) {
          console.error("Firebase Profile Error:", e);
        }
      } else {
        setProfile(null);
      }
      setLoading(false);
      clearTimeout(loadingTimeout);
    });

    return () => {
      unsubscribe();
      clearTimeout(loadingTimeout);
    };
  }, []);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const updateProfile = async (newData: any) => {
    if (!user || !newData || typeof newData !== 'object') {
      console.warn('updateProfile called with invalid data:', newData);
      return;
    }
    try {
      const profileRef = doc(db, 'users', user.uid);
      await setDoc(profileRef, newData, { merge: true });
      setProfile((prev: any) => ({ ...prev, ...newData }));
    } catch (error) {
      console.error('Error updating profile:', error);
      throw error;
    }
  };

  const resetAccount = async () => {
    if (!user) return;
    try {
      // 1. Reset profile stats
      const profileRef = doc(db, 'users', user.uid);
      const defaultProfile = {
        level: 1,
        exp: 0,
      };
      await setDoc(profileRef, defaultProfile, { merge: true });
      setProfile((prev: any) => ({ ...prev, ...defaultProfile }));

      // 2. Clear reviews (Note: client-side delete of multiple docs requires fetching them first)
      const reviewsPath = 'reviews';
      const q = query(
        collection(db, reviewsPath),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      
      console.log('Account data cleared successfully');
    } catch (error) {
      console.error('Error resetting account:', error);
      throw error;
    }
  };

  const clearReviewsOnly = async () => {
    if (!user) return;
    try {
      const reviewsPath = 'reviews';
      const q = query(
        collection(db, reviewsPath),
        where('userId', '==', user.uid)
      );
      const snapshot = await getDocs(q);
      const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);
      console.log('Reviews cleared successfully');
    } catch (error) {
      console.error('Error clearing reviews:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, logout, updateProfile, resetAccount, clearReviewsOnly }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
