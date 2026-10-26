"use client";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import { PatternButton } from "../button/button-patterns";
import { useRouter } from "@/i18n/navigation";
import { useTranslations } from "next-intl";
import config from "@/config";

export default function BaseNotFound() {
  const t = useTranslations("Common.NotFound");
  const router = useRouter();

  return (
    <Empty className="min-h-[60dvh]">
      <EmptyHeader>
        <EmptyTitle>{t("title")}</EmptyTitle>
        <EmptyDescription>{t("description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <PatternButton
          variant="glass"
          color="primary"
          rounded="full"
          size="sm"
          onClick={() => router.push(config.routes.public.home)}
        >
          {t("backHome")}
        </PatternButton>
      </EmptyContent>
    </Empty>
  );
}
