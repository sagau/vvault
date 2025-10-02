"use client";

import { useAuth } from "@/hooks/useAuth";
import RoleSwitcher from "@/components/RoleSwitcher";

export default function AuthDebugPage() {
  const { user, loading } = useAuth();
  const role = user?.role;

  // ✅ Hide in production
  if (process.env.NODE_ENV === "production") {
    return <p className="p-6">🚫 This page is disabled in production.</p>;
  }

  if (loading) {
    return <p className="p-4">Loading...</p>;
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-bold">🔎 Auth Debug Page</h1>

      <div className="bg-gray-100 p-4 rounded-lg shadow">
        <p>
          <strong>UID:</strong> {user?.uid ?? "None"}
        </p>
        <p>
          <strong>Role:</strong> {role || "No role"}
        </p>
        <p>
          <strong>Company ID:</strong> {user?.companyId || "No company"}
        </p>
        <p>
          <strong>Email:</strong> {user?.email || "No email"}
        </p>
      </div>

      <RoleSwitcher />

      <p className="text-sm text-gray-600">
        This page shows current authentication information. In production, this page
        is hidden automatically.
      </p>
    </div>
  );
}
