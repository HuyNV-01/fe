"use client";

import ChatConversationPage from "@/components/chat/chat-conversation-page";
import type { IPageParams } from "@/types";
import { useParams } from "next/navigation";

export default function DetailChatPage() {
  const params = useParams() as unknown as IPageParams;

  return (
    <div className="flex flex-col w-full h-full relative">
      <ChatConversationPage params={params} />
    </div>
  );
}
