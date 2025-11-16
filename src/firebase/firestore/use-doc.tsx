'use client';
import { useFirestore } from '@/firebase/provider';
import {
  DocumentReference,
  doc,
  onSnapshot,
} from 'firebase/firestore';
import { useEffect, useMemo, useState } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useDoc<T>(
  pathOrRef: string | DocumentReference | null
): {
  data: (T & { id: string }) | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<(T & { id: string }) | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  const docRef = useMemo(() => {
    if (!pathOrRef) {
      return null;
    }
    if (typeof pathOrRef === 'string') {
      if (!firestore) return null;
      return doc(firestore, pathOrRef);
    }
    return pathOrRef;
  }, [firestore, pathOrRef]);

  useEffect(() => {
    if (!docRef) {
      if (firestore) {
        setData(null);
      }
      return;
    }
    const unsubscribe = onSnapshot(
      docRef,
      (snapshot) => {
        if (snapshot.exists()) {
          setData({ id: snapshot.id, ...(snapshot.data() as T) });
        } else {
          setData(null);
        }
        setError(null);
      },
      (err) => {
        const permissionError = new FirestorePermissionError({
          path: docRef.path,
          operation: 'get',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
      }
    );

    return () => unsubscribe();
  }, [docRef, firestore]);

  return { data, isLoading: data === null && error === null, error };
}
