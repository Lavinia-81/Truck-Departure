'use client';

import { useUser } from '@/firebase/auth/use-user';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2, ShieldAlert } from 'lucide-react';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading, isAdmin, isAdminLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    const isAuthLoading = isLoading || isAdminLoading;
    if (!isAuthLoading) {
      if (!user) {
        router.push('/login');
      }
    }
  }, [user, isLoading, isAdminLoading, router]);

  const isAuthLoading = isLoading || isAdminLoading;

  if (isAuthLoading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verificare autorizare...</p>
      </div>
    );
  }

  if (!user) {
    // Should be redirected by useEffect, but this is a fallback.
    return null;
  }
  
  if (!isAdmin) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-4 text-center">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="mt-4 text-2xl font-bold">Acces Refuzat</h1>
        <p className="mt-2 text-muted-foreground">
          Nu aveți permisiunile necesare pentru a accesa această pagină.
        </p>
         <p className="text-sm text-muted-foreground">
          Contactați administratorul principal dacă considerați că aceasta este o eroare.
        </p>
      </div>
    );
  }

  return <>{children}</>;
}
