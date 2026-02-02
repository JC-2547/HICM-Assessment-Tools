"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type AuthGuardProps = {
  children: React.ReactNode;
  redirectTo: string;
  allowedRoles?: string[];
  roleRedirects?: Record<string, string>;
};

export default function AuthGuard({
  children,
  redirectTo,
  allowedRoles,
  roleRedirects,
}: AuthGuardProps) {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("access_token");
    const role = (localStorage.getItem("role_name") || "").toLowerCase();
    if (!token) {
      router.replace(redirectTo);
      return;
    }
    if (allowedRoles && !allowedRoles.includes(role)) {
      const fallback = roleRedirects?.[role] || redirectTo;
      router.replace(fallback);
      return;
    }
    setAuthorized(true);
  }, [allowedRoles, redirectTo, roleRedirects, router]);

  if (!authorized) {
    return null;
  }

  return <>{children}</>;
}
