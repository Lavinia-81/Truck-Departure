'use client';
import { useEffect, useState } from 'react';
import { FirebaseProvider, initializeFirebase } from '.';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { firebaseConfig } from './config';

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
    try {
      // Basic check if the config looks valid before initializing
      if (!firebaseConfig || !firebaseConfig.apiKey) {
        throw new Error("Firebase configuration is not available. Please check your setup.");
      }
      const context = initializeFirebase();
      setFirebaseContext(context);
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
