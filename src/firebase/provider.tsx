'use client';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { createContext, useContext } from 'react';

const FirebaseContext = createContext<{
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} | null>(null);

// This provider is used to share the Firebase app and services
// with the rest of the application.
export function FirebaseProvider({
  children,
  ...value
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}) {
  return (
    <FirebaseContext.Provider value={value}>{children}</FirebaseContext.Provider>
  );
}

// These hooks are used to access the Firebase app and services
// from any component in the application.
export const useFirebase = () => useContext(FirebaseContext);

export function useFirebaseApp(): FirebaseApp {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.firebaseApp;
}

export function useAuth(): Auth {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useAuth must be used within a FirebaseProvider');
  }
  return context.auth;
}

export function useFirestore(): Firestore {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context.firestore;
}
