'use client';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { createContext, useContext } from 'react';
import { AuthProvider } from './auth/auth-provider';

const FirebaseContext = createContext<{
  firebaseApp: FirebaseApp;
  firestore: Firestore;
} | null>(null);

export function FirebaseProvider({
  children,
  ...value
}: {
  children: React.ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
}) {
  return (
    <FirebaseContext.Provider value={value}>
        <AuthProvider>
            {children}
        </AuthProvider>
    </FirebaseContext.Provider>
  );
}

export const useFirebase = () => useContext(FirebaseContext);

export function useFirebaseApp(): FirebaseApp {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.firebaseApp;
}

export function useFirestore(): Firestore {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context.firestore;
}
