'use client';

import React, {
  createContext,
  useContext,
  ReactNode,
  useMemo,
  DependencyList,
} from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore } from 'firebase/firestore';
import { Auth } from 'firebase/auth';

// Define the shape of the context state
export interface FirebaseContextState {
  app: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
}

// Create the context with an undefined initial value
export const FirebaseContext = createContext<FirebaseContextState | undefined>(
  undefined
);

// Define the props for the provider component
interface FirebaseProviderProps {
  children: ReactNode;
  app: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// The provider component
export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  app,
  firestore,
  auth,
}) => {
  // Memoize the context value to prevent unnecessary re-renders
  const contextValue = useMemo(
    () => ({
      app,
      firestore,
      auth,
    }),
    [app, firestore, auth]
  );

  return (
    <FirebaseContext.Provider value={contextValue}>
      {children}
    </FirebaseContext.Provider>
  );
};

// Custom hook to access the full context
export const useFirebase = (): FirebaseContextState => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }
  return context;
};

// Custom hook to access the Firebase App instance
export const useFirebaseApp = (): FirebaseApp | null => {
  return useFirebase().app;
};

// Custom hook to access the Firestore instance
export const useFirestore = (): Firestore | null => {
  return useFirebase().firestore;
};

// Custom hook to access the Auth instance
export const useAuth = (): Auth | null => {
  return useFirebase().auth;
};
