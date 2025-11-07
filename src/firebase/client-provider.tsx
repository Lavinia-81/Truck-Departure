'use client';
import { FirebaseProvider, initializeFirebase } from '.';

export function FirebaseClientProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return <FirebaseProvider {...initializeFirebase()}>{children}</FirebaseProvider>;
}
