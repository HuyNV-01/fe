import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import { MessageCircleMore } from "lucide-react";
import { useTranslations } from "next-intl";

export function ChatSidebarEmpty() {
  const t = useTranslations("Chat.Detail.empty");
  return (
    <Empty className="w-full h-full">
      <EmptyHeader>
        <EmptyMedia variant="default">
          <MessageCircleMore />
        </EmptyMedia>
        <EmptyTitle>{t("title")}</EmptyTitle>
        <EmptyDescription>{t("description")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent></EmptyContent>
    </Empty>
  );
}
