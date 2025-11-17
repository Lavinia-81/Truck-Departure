'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthContext();
  const app = useFirebaseApp();
  const firestore = getFirestore(app);
  
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdminStatus = useCallback(async (user: User) => {
    const adminDocRef = doc(firestore, 'admins', user.uid);
    const adminDocSnap = await getDoc(adminDocRef);
    
    if (adminDocSnap.exists()) {
        setIsAdmin(true);
    } else {
        const adminEmailDocRef = doc(firestore, 'admins', user.email!);
        const adminEmailDocSnap = await getDoc(adminEmailDocRef);
        setIsAdmin(adminEmailDocSnap.exists());
    }
  }, [firestore]);


  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      if (firebaseUser) {
        setUser(firebaseUser);
        await checkAdminStatus(firebaseUser);
      } else {
        setUser(null);
        setIsAdmin(false);
      }
      setLoading(false);
    });
    
    getRedirectResult(auth)
      .catch((error) => {
        console.error("Error during redirect result:", error);
        setLoading(false);
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
    setUser(null);
    setIsAdmin(false);
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
