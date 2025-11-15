'use client';
import { FirebaseApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, getFirestore } from 'firebase/firestore';
import { firebaseConfig } from './config-local'; 

let firebaseApp: FirebaseApp;
let firestore: Firestore;

export function initializeFirebase(): {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
} {
  if (getApps().length === 0) {
    if (!firebaseConfig.apiKey || firebaseConfig.apiKey === "YOUR_API_KEY_HERE") {
      throw new Error('Firebase configuration is invalid. Please fill in your credentials in src/firebase/config-local.ts');
    }
    firebaseApp = initializeApp(firebaseConfig);
  } else {
    firebaseApp = getApps()[0];
  }
  
  firestore = getFirestore(firebaseApp);

  return { firebaseApp, firestore };
}

export * from './provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
