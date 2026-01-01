"use client";

import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import Loading from "./skeleton/loading";
import { useStoreWait } from "@/utils/hooks/use-store-wait";

export default function BaseLoading() {
  const authStatus = useAuthStore((state) => state.status);
  
  const isLoading = useStoreWait([authStatus]);

  return <Loading loading={isLoading} />;
}
