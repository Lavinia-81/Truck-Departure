"use client";

import DepartureDashboard from "@/components/departure-dashboard";
import { useAuth } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import LoginPage from "./login/page";
import { Loader2 } from "lucide-react";

export default function AdminPage() {
  const { user, isAdmin, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="flex h-screen w-full flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Verifying access...</p>
      </div>
    );
  }

  if (!user) {
    // This will be briefly shown before redirect kicks in
    return null;
  }
  
  if (!isAdmin) {
    return (
        <div className="flex flex-col items-center justify-center h-screen bg-background text-center">
            <h1 className="text-3xl font-bold text-destructive mb-4">Access Denied</h1>
            <p className="text-muted-foreground mb-6">You do not have permission to access this page.</p>
            <p className="text-sm text-muted-foreground">Please contact your administrator if you believe this is an error.</p>
        </div>
    )
  }

  return <DepartureDashboard />;
}
