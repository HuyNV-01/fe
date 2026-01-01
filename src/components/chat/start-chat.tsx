import { MessageCircleMore } from "lucide-react";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function StartChat() {
  return (
    <Empty className=" h-full bg-transparent">
      <EmptyHeader>
        <EmptyMedia>
          <MessageCircleMore className="size-14 shrink-0 opacity-60" />
        </EmptyMedia>
        <EmptyTitle>Chào mừng tới cuộc trò chuyện</EmptyTitle>
        <EmptyDescription>
          Cùng bắt đầu cuộc trò chuyện của bạn tại đây.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent></EmptyContent>
    </Empty>
  );
}
