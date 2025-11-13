'use client';
import { useMemo } from 'react';
import { FirebaseProvider, initializeFirebase } from '.';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';

// This is a re-implementation of the Firebase client provider that
// is more robust and ensures that the Firebase app is initialized
// only once.
export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const firebaseContext = useMemo((): {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
  } | null => {
    try {
      return initializeFirebase();
    } catch (e: any) {
      // If initialization fails, we'll return null and the app can
      // render an error state.
      return null;
    }
  }, []);

  if (!firebaseContext) {
    // You can render a more sophisticated error boundary here
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <div className="text-center text-destructive p-4 border border-destructive/50 rounded-lg">
                <h1 className="text-xl font-bold">Firebase Configuration Error</h1>
                <p>Could not initialize Firebase. Please check your environment variables.</p>
                <p className="text-sm text-muted-foreground mt-2">Error: Missing or invalid NEXT_PUBLIC_FIREBASE_CONFIG.</p>
            </div>
        </div>
    );
  }

  return (
    <FirebaseProvider {...firebaseContext}>{children}</FirebaseProvider>
  );
}
