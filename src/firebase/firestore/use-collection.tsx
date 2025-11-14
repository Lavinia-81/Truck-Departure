'use client';
import { useFirestore } from '@/firebase/provider';
import {
  Query,
  collection,
  onSnapshot,
  query,
  where,
} from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { useMemo } from 'react';

export interface UseCollectionOptions {
  deps?: any[];
}

export function useCollection<T>(path: string): {
  data: (T & { id: string })[] | null;
  isLoading: boolean;
  error: Error | null;
};
export function useCollection<T>(
  query: Query | null
): {
  data: (T & { id: string })[] | null;
  isLoading: boolean;
  error: Error | null;
};
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
        setError(err);
      }
    );

    return () => unsubscribe();
  }, [q, firestore]);

  return { data, isLoading: data === null && error === null, error };
}
