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
        
        if (adminDocSnap.exists()) {
             setIsAdmin(true);
        } else {
            // Fallback check by email if UID doc doesn't exist
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

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
        if (firebaseUser) {
            processAuth(firebaseUser);
        } else {
            // If user is null, no need to check admin status
            processAuth(null);
        }
    });
    
    // Handle redirect result
    getRedirectResult(auth)
      .then((result) => {
        if (result) {
            // This is handled by onAuthStateChanged, but we can set loading to false sooner
            // if we get a result here.
        } else {
            // If no redirect and no current user, we are not in a login flow.
            if(auth.currentUser === null) {
                setLoading(false);
            }
        }
      })
      .catch((error) => {
        console.error("Error during redirect result:", error);
        setLoading(false); // Stop loading on error
      });

    return () => unsubscribe();
  }, [auth, firestore]);

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
