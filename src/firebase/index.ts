'use client';
import { FirebaseApp, getApps } from 'firebase/app';
import { Auth } from 'firebase/auth';
import {
  Firestore,
} from 'firebase/firestore';
import { firebaseConfig, auth, firestore } from './config';

let firebaseApp: FirebaseApp;

export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
} {
  if (getApps().length === 0) {
    if (!firebaseConfig.apiKey) {
      throw new Error('Firebase configuration is invalid. apiKey is missing.');
    }
    // app is already initialized in config.ts
    firebaseApp = getApps()[0];
  } else {
    firebaseApp = getApps()[0];
  }
  return { firebaseApp, auth, firestore };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './auth/use-user';
