'use client';
import { useEffect, useState, ReactNode, useCallback } from 'react';
import { FirebaseProvider, initializeFirebase } from '.';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, getDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { firebaseConfig } from '@/firebase/config';
import { Auth, User, getRedirectResult, onAuthStateChanged, GoogleAuthProvider, signInWithRedirect, signOut as firebaseSignOut } from 'firebase/auth';

type FirebaseContextState = {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
};

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [context, setContext] = useState<Omit<FirebaseContextState, 'loading' | 'signIn' | 'signOut' | 'user' | 'isAdmin'> | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const checkAdminStatus = useCallback(async (user: User | null, firestore: Firestore) => {
    if (!user?.email) return false;
    try {
      const adminEmailRef = doc(firestore, 'admins', user.email.toLowerCase());
      const adminEmailSnap = await getDoc(adminEmailRef);
      return adminEmailSnap.exists();
    } catch (error) {
      console.error("Error checking admin status:", error);
      return false;
    }
  }, []);

  useEffect(() => {
    try {
      if (!firebaseConfig || firebaseConfig.apiKey === "YOUR_API_KEY_HERE" || !firebaseConfig.projectId) {
        throw new Error("Firebase configuration is not available. Please fill in your credentials in src/firebase/config.ts");
      }
      const { firebaseApp, firestore, auth } = initializeFirebase();
      setContext({ firebaseApp, firestore, auth });
      
      setLoading(true);

      getRedirectResult(auth).finally(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
          setUser(firebaseUser);
          if (firebaseUser) {
            const adminStatus = await checkAdminStatus(firebaseUser, firestore);
            setIsAdmin(adminStatus);
          } else {
            setIsAdmin(false);
          }
          setLoading(false);
        });
        return () => unsubscribe();
      });

    } catch (e: any) {
      console.error('Firebase initialization failed:', e);
      setError(e);
      setLoading(false);
    }
  }, [checkAdminStatus]);
  
  const signIn = async () => {
    if (!context?.auth) return;
    setLoading(true);
    const provider = new GoogleAuthProvider();
    await signInWithRedirect(context.auth, provider);
  };

  const signOut = async () => {
    if (!context?.auth) return;
    await firebaseSignOut(context.auth);
  };

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="text-center text-destructive p-4 border border-destructive/50 rounded-lg max-w-md">
          <h1 className="text-xl font-bold">Firebase Configuration Error</h1>
          <p className='text-sm'>{error.message}</p>
        </div>
      </div>
    );
  }

  if (!context || loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  return (
    <FirebaseProvider
      {...context}
      user={user}
      isAdmin={isAdmin}
      loading={loading}
      signIn={signIn}
      signOut={signOut}
    >
      {children}
    </FirebaseProvider>
  );
}
