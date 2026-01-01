"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "./auth/use-auth-store";
import Loading from "@/components/skeleton/loading";
import config from "@/config";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const authenticated = useAuthStore((s) => s.authenticated);

  useEffect(() => {
    if (_hasHydrated && !authenticated) {
      router.push(`${config.routes.public.login}`);
    }
  }, [_hasHydrated, authenticated, router]);

  if (!_hasHydrated) {
    return <Loading loading={true} />;
  }

  return <>{children}</>;
}
