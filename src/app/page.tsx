"use client";

import DepartureDashboard from "@/components/departure-dashboard";
import { useAuth } from "@/firebase/provider";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If auth check is done and there's no user, redirect to login.
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show a loading screen while auth is being checked.
  if (loading) {
     return (
        <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="mt-4 text-muted-foreground">Loading user data...</p>
        </div>
    );
  }

  // After loading, if there's a user, check if they are an admin.
  if (user && !isAdmin) {
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

  // After loading, if user is an admin, show the dashboard.
  if(user && isAdmin) {
    return <DepartureDashboard />;
  }

  // If there's no user and loading is false, the redirect is in progress.
  // Return a loader to prevent rendering anything else.
   return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
    </div>
  );
}
