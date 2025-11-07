'use client';

import { useState, useEffect, useRef } from 'react';
import {
  onSnapshot,
  DocumentReference,
  DocumentSnapshot,
  FirestoreError,
} from 'firebase/firestore';
import type { WithId } from '@/firebase';

export function useDoc<T = any>(
  docRef: DocumentReference | null | undefined
): { data: WithId<T> | null; isLoading: boolean; error: Error | null } {
  const [data, setData] = useState<WithId<T> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const initialLoadingDone = useRef(false);

  useEffect(() => {
    if (!docRef) {
      setData(null);
      setIsLoading(false);
      setError(null);
      initialLoadingDone.current = false;
      return;
    }

    if (!initialLoadingDone.current) {
      setIsLoading(true);
    }

    const unsubscribe = onSnapshot(
      docRef,
      (snapshot: DocumentSnapshot) => {
        if (snapshot.exists()) {
          setData({ ...(snapshot.data() as T), id: snapshot.id });
        } else {
          setData(null);
        }
        if (!initialLoadingDone.current) {
          setIsLoading(false);
          initialLoadingDone.current = true;
        }
        setError(null);
      },
      (err: FirestoreError) => {
        console.error('useDoc error:', err);
        setError(err);
        setIsLoading(false);
      }
    );
    
    // Set loading to false once the listener is attached for faster perceived load time.
    if (!initialLoadingDone.current) {
        setIsLoading(false);
    }

    return () => {
        unsubscribe();
        initialLoadingDone.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [docRef?.path, docRef?.converter]);

  return { data, isLoading, error };
}
