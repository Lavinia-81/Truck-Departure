'use client';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { createContext, useContext } from 'react';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import { Auth, User } from 'firebase/auth';

interface FirebaseContextType {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signIn: () => Promise<void>;
  signOut: () => Promise<void>;
}

const FirebaseContext = createContext<FirebaseContextType | null>(null);

export function FirebaseProvider({
  children,
  ...value
}: {
  children: React.ReactNode;
} & FirebaseContextType) {
  return (
    <FirebaseContext.Provider value={value}>
        {children}
        <FirebaseErrorListener />
    </FirebaseContext.Provider>
  );
}

// General hook to get the whole context
export const useFirebase = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useFirebase must be used within a FirebaseProvider');
    }
    return context;
}

// Specific hook for Auth related data and functions
export const useAuth = () => {
    const context = useContext(FirebaseContext);
    if (!context) {
        throw new Error('useAuth must be used within a FirebaseProvider');
    }
    return {
        user: context.user,
        isAdmin: context.isAdmin,
        loading: context.loading,
        signIn: context.signIn,
        signOut: context.signOut,
        auth: context.auth,
    };
};

// Specific hook for Firebase App
export function useFirebaseApp(): FirebaseApp {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebaseApp must be used within a FirebaseProvider');
  }
  return context.firebaseApp;
}

// Specific hook for Firestore
export function useFirestore(): Firestore {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirestore must be used within a FirebaseProvider');
  }
  return context.firestore;
}

// Specific hook for Auth instance
export function useAuthContext(): Auth {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useAuthContext must be used within a FirebaseProvider');
  }
  return context.auth;
}
