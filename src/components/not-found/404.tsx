"use client";

import { GlassEmptyState, PatternButton } from "@/components/toolkit";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import config from "@/config";

export default function BaseNotFound() {
  const t = useTranslations("Common.NotFound");
  const router = useRouter();

  return (
    <GlassEmptyState
      title={t("title")}
      description={t("description")}
      action={
        <PatternButton
          variant="glass"
          color="primary"
          rounded="full"
          size="sm"
          onClick={() => router.push(config.routes.public.home)}
        >
          {t("backHome")}
        </PatternButton>
      }
      className="min-h-[60dvh]"
    />
  );
}
