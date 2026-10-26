import { ContactRound } from "lucide-react";
import { useTranslations } from "next-intl";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function StartConversation() {
  const t = useTranslations("Chat.Detail.empty");
  return (
    <Empty className="h-full bg-transparent">
      <EmptyHeader>
        <EmptyMedia>
          <ContactRound className="size-14 shrink-0 opacity-60" />
        </EmptyMedia>
        <EmptyTitle>{t("startContactTitle")}</EmptyTitle>
        <EmptyDescription>{t("startContactDescription")}</EmptyDescription>
      </EmptyHeader>
      <EmptyContent></EmptyContent>
    </Empty>
  );
}
