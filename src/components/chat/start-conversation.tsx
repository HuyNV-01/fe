import { ContactRound } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function StartConversation() {
  return (
    <Empty className=" h-full bg-transparent">
      <EmptyHeader>
        <EmptyMedia>
          <ContactRound className="size-14 shrink-0 opacity-60" />
        </EmptyMedia>
        <EmptyTitle>Kết bạn và bắt đầu trò chuyện</EmptyTitle>
        <EmptyDescription>
          Tìm kiếm và kết bạn mới để bắt đầu trò chuyện ngay.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent></EmptyContent>
    </Empty>
  );
}
