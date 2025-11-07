'use client';

import { useState, useEffect } from 'react';
import {
  onSnapshot,
  query,
  Query,
  QuerySnapshot,
  FirestoreError,
} from 'firebase/firestore';
import type { WithId } from '@/firebase';

export function useCollection<T = any>(
  q: Query | null | undefined
): { data: WithId<T>[] | null; isLoading: boolean; error: Error | null } {
  const [data, setData] = useState<WithId<T>[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!q) {
      setData(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const results = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(results);
        setIsLoading(false);
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('useCollection error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, [q]);

  return { data, isLoading, error };
}
