"use client";

import AuthGuard from "@/components/auth-guard";
import DepartureDashboard from "@/components/departure-dashboard";

export default function AdminPage() {
  return (
    <AuthGuard>
      <DepartureDashboard />
    </AuthGuard>
  );
}
