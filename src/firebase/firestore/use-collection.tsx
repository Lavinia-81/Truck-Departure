'use client';
import { useFirestore } from '@/firebase/provider';
import {
  Query,
  collection,
  onSnapshot,
} from 'firebase/firestore';
import { useEffect, useState, useMemo } from 'react';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

export function useCollection<T>(
  pathOrQuery: string | Query | null
): {
  data: (T & { id: string })[] | null;
  isLoading: boolean;
  error: Error | null;
} {
  const [data, setData] = useState<(T & { id: string })[] | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const firestore = useFirestore();

  const q = useMemo(() => {
    if (!pathOrQuery) {
      return null;
    }
    if (typeof pathOrQuery === 'string') {
      if (!firestore) return null;
      return collection(firestore, pathOrQuery);
    }
    return pathOrQuery;
  }, [firestore, pathOrQuery]);

  useEffect(() => {
    if (!q) {
      if (firestore) {
        setData([]);
      }
      return;
    }

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const data: (T & { id: string })[] = [];
        snapshot.forEach((doc) => {
          data.push({ id: doc.id, ...(doc.data() as T) });
        });
        setData(data);
        setError(null);
      },
      (err) => {
        const path = 'path' in q ? q.path : 'unknown path';
        const permissionError = new FirestorePermissionError({
          path: path,
          operation: 'list',
        });
        errorEmitter.emit('permission-error', permissionError);
        setError(permissionError);
      }
    );

    return () => unsubscribe();
  }, [q, firestore]);

  return { data, isLoading: data === null && error === null, error };
}
