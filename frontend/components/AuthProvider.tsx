"use client";

import { useEffect } from "react";
import { hydrateAuth } from "@/lib/auth";

export default function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    hydrateAuth();
  }, []);

  return <>{children}</>;
}
