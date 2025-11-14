'use client';

import { useAuthContext } from './auth-provider';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { ADMIN_EMAILS } from '@/lib/admins';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuthContext();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        // If user is not logged in, redirect to login page.
        router.replace('/login');
      } else if (!ADMIN_EMAILS.includes(user.email || '')) {
        // If user is not an admin, redirect to a 'not authorized' page or login.
        // You can create a dedicated page for this.
        console.warn(`User ${user.email} is not authorized.`);
        router.replace('/login?error=not-authorized');
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !user || !ADMIN_EMAILS.includes(user.email || '')) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-muted-foreground">Verifying access...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
