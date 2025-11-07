'use client';

import { useState, useEffect, useRef } from 'react';
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

  const initialLoadingDone = useRef(false);

  useEffect(() => {
    // Reset state if query is null/undefined
    if (!q) {
      setData(null);
      setIsLoading(false); // No query, not loading.
      setError(null);
      initialLoadingDone.current = false;
      return;
    }

    // Set loading to true only on the first run for a new query
    if (!initialLoadingDone.current) {
      setIsLoading(true);
    }
    
    const unsubscribe = onSnapshot(
      q,
      (snapshot: QuerySnapshot) => {
        const results = snapshot.docs.map(doc => ({
          ...(doc.data() as T),
          id: doc.id,
        }));
        setData(results);
        // Once the first snapshot is received, loading is complete.
        if (!initialLoadingDone.current) {
          setIsLoading(false);
          initialLoadingDone.current = true;
        }
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('useCollection error:', err);
        setError(err);
        setIsLoading(false);
      }
    );

    // Set loading to false once the listener is attached if we haven't already.
    // This provides a faster perceived load time for subsequent updates.
    if (!initialLoadingDone.current) {
        setIsLoading(false);
    }

    // Cleanup function
    return () => {
      unsubscribe();
      // Reset the initial loading flag when the query changes.
      initialLoadingDone.current = false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q?.path, q?.converter]); // Depend on query properties that define its identity

  return { data, isLoading, error };
}
