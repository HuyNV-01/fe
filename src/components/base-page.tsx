/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import type React from "react";
import { useEffect, useRef } from "react";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

export default function BasePage({ children }: { children?: React.ReactNode }) {
  const t = useTranslations("Form.Login");
  const tError = useTranslations("Messages.error");
  const searchParams = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const router = useRouter();
  const tokenProcessed = useRef(false);
  const callbackLoginThird = useAuthStore((s) => s.callbackLoginThird);

  useEffect(() => {
    if (tokenFromUrl && !tokenProcessed.current) {
      tokenProcessed.current = true;
      callbackLoginThird(
        { accessToken: tokenFromUrl },
        {
          onSuccess: (code) => {
            router.replace(config.routes.public.home);
            showSuccessToast(tError(`toast.${code}`));
          },
          onError: (code) => {
            showErrorToast(tError(`toast.${code}`) || t("toast.error"));
          },
        },
      );
    }
  }, [tokenFromUrl]);
  return <div className="w-full h-full">{children}</div>;
}
