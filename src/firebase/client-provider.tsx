'use client';
import { useEffect, useState } from 'react';
import { FirebaseProvider, initializeFirebase } from '.';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';

type FirebaseContextState = {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null;

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebaseContext, setFirebaseContext] =
    useState<FirebaseContextState>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // This entire block now runs only on the client, after the initial render.
    // This prevents any server-side execution of Firebase initialization.
    try {
      // @ts-ignore
      if (typeof __FIREBASE_CONFIG__ === 'undefined') {
        setError(new Error("Firebase configuration is not available. Please check your setup."));
        return;
      }
      // @ts-ignore
      const firebaseConfig = __FIREBASE_CONFIG__;
      if (!firebaseConfig.apiKey) {
        setError(new Error("Invalid Firebase configuration received."));
        return;
      }
      setFirebaseContext(initializeFirebase(firebaseConfig));
    } catch (e: any) {
      console.error('Firebase initialization failed:', e);
      setError(e);
    }
  }, []);

  if (error) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <div className="text-center text-destructive p-4 border border-destructive/50 rounded-lg max-w-md">
          <h1 className="text-xl font-bold">Firebase Configuration Error</h1>
          <p>
            Could not initialize Firebase. Please check your setup.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Error: {error.message}
          </p>
        </div>
      </div>
    );
  }

  if (!firebaseContext) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing Firebase...</p>
      </div>
    );
  }

  return (
    <FirebaseProvider {...firebaseContext}>{children}</FirebaseProvider>
  );
}
