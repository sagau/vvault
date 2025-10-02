"use client";

import React from "react";
import { useAuth } from "@/hooks/useAuth";

export default function RoleSwitcher() {
  const { user } = useAuth();
  const role = user?.role;

  // ✅ Hide in production
  if (process.env.NODE_ENV === "production") {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white shadow-lg rounded p-4 border text-sm z-50">
      <p className="mb-2 font-semibold">Dev Auth Info</p>

      <div className="mt-3 text-xs text-gray-600">
        <p>
          <b>User ID:</b> {user?.uid || 'Not logged in'}
        </p>
        <p>
          <b>Role:</b> {role || 'No role'}
        </p>
        <p>
          <b>Company ID:</b> {user?.companyId || 'No company'}
        </p>
      </div>
    </div>
  );
}
