'use client';

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithRedirect, getRedirectResult, User } from 'firebase/auth';
import { useAuthContext } from '@/firebase/provider';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean; // True while checking auth state, false once resolved.
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const auth = useAuthContext();
  const firestore = useFirestore();
  
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true); // Start as true

  const checkAdminStatus = useCallback(async (user: User | null) => {
    if (!user?.email || !firestore) return false;
    try {
        const adminEmailRef = doc(firestore, 'admins', user.email.toLowerCase());
        const adminEmailSnap = await getDoc(adminEmailRef);
        return adminEmailSnap.exists();
    } catch (error) {
        console.error("Error checking admin status:", error);
        return false;
    }
  }, [firestore]);


  useEffect(() => {
    if (!auth) {
        setLoading(false);
        return;
    }

    // This is the key change: we handle the redirect result first.
    getRedirectResult(auth)
      .then((result) => {
        // This will be null if the user just loaded the page without a redirect.
        // If they come from Google, `result.user` will be populated.
      })
      .catch((error) => {
        console.error("Error from getRedirectResult:", error);
      })
      .finally(() => {
        // After handling the redirect, we set up the regular auth state listener.
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          if (firebaseUser) {
            setUser(firebaseUser);
            const adminStatus = await checkAdminStatus(firebaseUser);
            setIsAdmin(adminStatus);
          } else {
            setUser(null);
            setIsAdmin(false);
          }
          // Only set loading to false AFTER the user state has been determined.
          setLoading(false);
        });
        
        return unsubscribe;
      });

  }, [auth, checkAdminStatus]);

  const signIn = async () => {
    if (!auth) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const signOut = async () => {
    if (!auth) return;
    await firebaseSignOut(auth);
    // The onAuthStateChanged listener will handle clearing the user state.
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
