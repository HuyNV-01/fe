import { GlassEmptyState } from "@/components/toolkit";
import { MessageCircleMore } from "lucide-react";
import { useTranslations } from "next-intl";

export function ChatSidebarEmpty() {
  const t = useTranslations("Chat.Detail.empty");
  return (
    <GlassEmptyState
      icon={<MessageCircleMore className="w-7 h-7" />}
      title={t("title")}
      description={t("description")}
      className="w-full h-full"
    />
  );
}
