import { ContactRound } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassEmptyState } from "@/components/toolkit";

export function StartConversation() {
  const t = useTranslations("Chat.Detail.empty");
  return (
    <GlassEmptyState
      icon={<ContactRound className="size-10 shrink-0 opacity-80" />}
      title={t("startContactTitle")}
      description={t("startContactDescription")}
      className="w-full h-full bg-transparent"
    />
  );
}
