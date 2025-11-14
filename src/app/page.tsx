"use client";

import DepartureDashboard from "@/components/departure-dashboard";
import { AuthGuard } from "@/components/auth-guard";

export default function AdminPage() {
  return (
    <AuthGuard>
      <DepartureDashboard />
    </AuthGuard>
  );
}
