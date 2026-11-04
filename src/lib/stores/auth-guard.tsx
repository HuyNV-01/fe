"use client";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useAuthStore } from "./auth/use-auth-store";
import { usePermissionStore } from "./iam/use-permission-store";
import Loading from "@/components/skeleton/loading";
import config from "@/config";

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  const _hasHydrated = useAuthStore((s) => s._hasHydrated);
  const authenticated = useAuthStore((s) => s.authenticated);
  const fetchOnboardingOverview = usePermissionStore(
    (s) => s.fetchOnboardingOverview,
  );

  useEffect(() => {
    if (_hasHydrated && !authenticated) {
      router.push(`${config.routes.public.login}`);
    } else if (_hasHydrated && authenticated) {
      fetchOnboardingOverview();
    }
  }, [_hasHydrated, authenticated, router, fetchOnboardingOverview]);

  if (!_hasHydrated) {
    return <Loading loading={true} />;
  }

  return <>{children}</>;
}
