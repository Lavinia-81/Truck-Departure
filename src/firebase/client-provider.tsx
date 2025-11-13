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

// This global is injected by the hosting environment.
declare var __FIREBASE_CONFIG__: any;

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [firebaseContext, setFirebaseContext] =
    useState<FirebaseContextState>(null);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // This code only runs on the client.
    if (typeof window !== 'undefined') {
      try {
        if (typeof __FIREBASE_CONFIG__ === 'undefined') {
          throw new Error("Firebase configuration object '__FIREBASE_CONFIG__' not found.");
        }
        const context = initializeFirebase(__FIREBASE_CONFIG__);
        setFirebaseContext(context);
      } catch (e: any) {
        console.error('Firebase initialization failed:', e);
        setError(e);
      }
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
