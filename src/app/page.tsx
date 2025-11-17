"use client";

import DepartureDashboard from "@/components/departure-dashboard";
import { useAuth } from "@/firebase/auth/auth-provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading || !user) {
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading user data...</p>
        </div>
    );
  }

  if (!isAdmin) {
    return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <div className="text-center p-8 border rounded-lg">
                <h1 className="text-2xl font-bold text-destructive">Access Denied</h1>
                <p className="text-muted-foreground mt-2">You do not have permission to access this page.</p>
                <p className="text-sm text-muted-foreground mt-4">Please contact the administrator if you believe this is an error.</p>
            </div>
        </div>
    )
  }

  return <DepartureDashboard />;
}
