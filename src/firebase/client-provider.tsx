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
  } => {
    return initializeFirebase();
  }, []);
  return (
    <FirebaseProvider {...firebaseContext}>{children}</FirebaseProvider>
  );
}
