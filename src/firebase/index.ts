'use client';

import { firebaseConfig } from '@/firebase/config';
import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, setDoc, addDoc, deleteDoc, CollectionReference, DocumentReference, SetOptions } from 'firebase/firestore';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface FirebaseSdks {
  app: FirebaseApp;
  auth: Auth;
  firestore: Firestore;
}

// IMPORTANT: DO NOT MODIFY THIS FUNCTION
let firebaseServices: FirebaseSdks | null = null;
export function initializeFirebase(): FirebaseSdks {
  if (firebaseServices) {
    return firebaseServices;
  }

  const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  const firestore = getFirestore(app);
  const auth = getAuth(app);
  
  firebaseServices = {
    app: app,
    auth,
    firestore,
  };
  return firebaseServices;
}

export function setDocumentNonBlocking(docRef: DocumentReference, data: any, options?: SetOptions) {
  const operation = options && 'merge' in options ? 'update' : 'create';
  setDoc(docRef, data, options || {}).catch(error => {
    errorEmitter.emit(
      'permission-error',
      new FirestorePermissionError({
        path: docRef.path,
        operation: operation, 
        requestResourceData: data,
      })
    )
  })
}

export function addDocumentNonBlocking(colRef: CollectionReference, data: any) {
  const promise = addDoc(colRef, data)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: colRef.path,
          operation: 'create',
          requestResourceData: data,
        })
      )
    });
  return promise;
}

export function deleteDocumentNonBlocking(docRef: DocumentReference) {
  deleteDoc(docRef)
    .catch(error => {
      errorEmitter.emit(
        'permission-error',
        new FirestorePermissionError({
          path: docRef.path,
          operation: 'delete',
        })
      )
    });
}


export * from './provider';
export * from './client-provider';
export * from './firestore/use-collection';
export * from './firestore/use-doc';
export * from './errors';
export * from './error-emitter';
