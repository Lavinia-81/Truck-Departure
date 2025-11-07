'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import {
  getFirestore,
  Firestore,
  setDoc,
  addDoc,
  deleteDoc,
  CollectionReference,
  DocumentReference,
  SetOptions,
} from 'firebase/firestore';
import { useMemo, type DependencyList } from 'react';

// SECTION: Firebase Initialization

interface FirebaseServices {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

let firebaseServices: FirebaseServices | null = null;

export function initializeFirebase(): FirebaseServices {
  if (firebaseServices) {
    return firebaseServices;
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const auth = getAuth(app);
  const firestore = getFirestore(app);

  firebaseServices = { app, auth, firestore };
  return firebaseServices;
}

// SECTION: Non-blocking Firestore writes

export function setDocumentNonBlocking(
  docRef: DocumentReference,
  data: any,
  options?: SetOptions
) {
  setDoc(docRef, data, options || {}).catch(error => {
    console.error('Firestore Error (setDoc):', error);
  });
}

export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  addDoc(colRef, data).catch(error => {
    console.error('Firestore Error (addDoc):', error);
  });
}

export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef).catch(error => {
    console.error('Firestore Error (deleteDoc):', error);
  });
}

// SECTION: Memoization Hook

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  return useMemo(factory, deps);
}

// SECTION: Type Utilities
export type WithId<T> = T & { id: string };


// SECTION: Barrel Exports for Firebase services

export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
