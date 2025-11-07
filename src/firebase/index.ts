import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Auth, getAuth, connectAuthEmulator } from 'firebase/auth';
import {
  Firestore,
  getFirestore,
  connectFirestoreEmulator,
} from 'firebase/firestore';
import { firebaseConfig } from './config';

let firebaseApp: FirebaseApp;
let auth: Auth;
let firestore: Firestore;

// This function is leveraged by the FirebaseProvider to safely initialize
// the Firebase app and services, and make them available to the rest of
// the application.
export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  if (getApps().length === 0) {
    firebaseApp = initializeApp(firebaseConfig);
    auth = getAuth(firebaseApp);
    firestore = getFirestore(firebaseApp);
  }
  return { firebaseApp, auth, firestore };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
