import { MessageCircleMore } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function StartChat() {
  const t = useTranslations("Chat.Detail.empty");
  return (
    <Empty className="h-full bg-transparent">
      <EmptyHeader>
        <EmptyMedia>
          <MessageCircleMore className="size-14 shrink-0 opacity-60" />
        </EmptyMedia>
        <EmptyTitle>{t("startChatTitle")}</EmptyTitle>
        <EmptyDescription>{t("startChatDescription")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent></EmptyContent>
    </Empty>
  );
}
