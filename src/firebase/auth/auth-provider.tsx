'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, signOut as firebaseSignOut, GoogleAuthProvider, signInWithRedirect, getRedirectResult, User } from 'firebase/auth';
import { useFirebaseApp } from '@/firebase/provider';
import { Loader2 } from 'lucide-react';
import { collection, doc, getDoc, getFirestore } from 'firebase/firestore';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const app = useFirebaseApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);
  
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const processAuth = async (user: User | null) => {
      if (user) {
        // Check for admin privileges
        const adminDocRef = doc(collection(firestore, 'admins'), user.uid);
        const adminDocSnap = await getDoc(adminDocRef);
        // Fallback check by email if UID doc doesn't exist
        if (adminDocSnap.exists()) {
             setIsAdmin(true);
        } else {
            const adminEmailDocRef = doc(firestore, 'admins', user.email!);
            const adminEmailDocSnap = await getDoc(adminEmailDocRef);
            setIsAdmin(adminEmailDocSnap.exists());
        }
      } else {
        setIsAdmin(false);
      }
      setUser(user);
      setLoading(false);
    };

    const unsubscribe = onAuthStateChanged(auth, processAuth);
    
    // Check for redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
            processAuth(result.user);
        } else {
            // If no redirect result, onAuthStateChanged will handle it.
            // This is to avoid flicker on initial load.
            if(auth.currentUser === null) {
                setLoading(false);
            }
        }
      })
      .catch((error) => {
        console.error("Error during redirect result:", error);
        setLoading(false);
      });

    return () => unsubscribe();
  }, [auth, firestore]);

  const signIn = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(auth, provider);
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setIsAdmin(false);
  };

  if (loading) {
     return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Loading user data...</p>
      </div>
    );
  }

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
