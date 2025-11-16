"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/firebase';
import { LogIn, Loader2 } from 'lucide-react';
import Image from 'next/image';

export default function LoginPage() {
  const { user, isAdmin, signIn, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/');
    }
  }, [user, loading, router]);
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="bg-white p-4 rounded-md shadow-lg inline-block">
            <div className="w-[200px] h-auto">
              <Image src="https://marcommnews.com/wp-content/uploads/2020/05/1200px-Very-Group-Logo-2.svg_-1024x397.png" alt="The Very Group Logo" width={200} height={78} className="h-auto w-full" />
            </div>
        </div>

        <div className="rounded-lg border bg-card text-card-foreground shadow-sm p-8">
            <h1 className="text-3xl font-bold tracking-tight mb-2">Welcome Back</h1>
            <p className="text-muted-foreground mb-6">
              Please sign in to access the Admin Dashboard.
            </p>

            {loading ? (
                <Button disabled className='w-full'>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Please wait
                </Button>
            ): (
                 <Button onClick={signIn} className="w-full text-lg p-6">
                    <LogIn className="mr-3 h-5 w-5" />
                    Sign In with Google
                </Button>
            )}
            
            <p className="mt-6 text-xs text-muted-foreground">
                By signing in, you agree to our terms of service. Access is restricted to authorized personnel only.
            </p>
        </div>
        
      </div>
    </div>
  );
}
