'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithRedirect, getRedirectResult, User } from 'firebase/auth';
import { useAuthContext } from '@/firebase/provider';
import { doc, getDoc, getFirestore } from 'firebase/firestore';
import { useFirebaseApp } from '@/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthContext();
  const app = useFirebaseApp();
  const firestore = getFirestore(app);
  
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = useCallback(async (user: User) => {
    if (!user.email) return false;
    // Check for admin doc using UID first
    const adminUidRef = doc(firestore, 'admins', user.uid);
    const adminUidSnap = await getDoc(adminUidRef);
    if (adminUidSnap.exists()) return true;

    // Fallback to checking by email
    const adminEmailRef = doc(firestore, 'admins', user.email);
    const adminEmailSnap = await getDoc(adminEmailRef);
    return adminEmailSnap.exists();
  }, [firestore]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        const adminStatus = await checkAdminStatus(firebaseUser);
        setIsAdmin(adminStatus);
      } else {
        // This case handles sign-out and initial load before redirect result
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });

    // Handle the redirect result separately to avoid race conditions
    getRedirectResult(auth).catch((error) => {
        console.error("Error during redirect result:", error);
        setLoading(false); // Ensure loading is off even if redirect fails
    });

    return () => unsubscribe();
  }, [auth, checkAdminStatus]);

  const signIn = async () => {
    setLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // State will be cleared by onAuthStateChanged listener
  };

  return (
    <AuthContext.Provider value={{ user, isAdmin, loading, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
