"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-lg font-semibold">Loading...</div>
    </div>
  );
}

export default function withGuard<P>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles: string[]
) {
  return function GuardedComponent(props: P) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading) {
        if (!user) {
          router.replace("/login");
        } else if (!user.role || !allowedRoles.includes(user.role)) {
          router.replace("/unauthorized");
        }
      }
    }, [user, loading, router]);

    if (loading) {
      return <LoadingScreen />;
    }

    if (!user) {
      return null; // redirecting
    }

    if (!user.role || !allowedRoles.includes(user.role)) {
      return (
        <div className="flex items-center justify-center h-screen">
          <div className="text-lg font-semibold text-red-600">
            Access denied
          </div>
        </div>
      );
    }

    return <WrappedComponent {...(props as any)} />;
  };
}
