import { MessageCircleMore } from "lucide-react";
import { useTranslations } from "next-intl";
import { GlassEmptyState } from "@/components/toolkit";

export function StartChat() {
  const t = useTranslations("Chat.Detail.empty");
  return (
    <GlassEmptyState
      icon={<MessageCircleMore className="size-10 shrink-0 opacity-80" />}
      title={t("startChatTitle")}
      description={t("startChatDescription")}
      className="w-full h-full bg-transparent"
    />
  );
}
