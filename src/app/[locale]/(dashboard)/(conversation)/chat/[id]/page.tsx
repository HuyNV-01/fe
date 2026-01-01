"use client";

import ChatConversationPage from "@/components/chat/chat-conversation-page";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import type { IPageParams } from "@/types";
import { useParams } from "next/navigation";
import { useEffect } from "react";

export default function DetailChatPage() {
  const params = useParams() as unknown as IPageParams;
  const { setActiveConversation } = useChatStore();
  const conversationId = params.id as string;

  useEffect(() => {
    if (conversationId) {
      setActiveConversation(conversationId);
    }

    return () => {
      setActiveConversation(null);
    };
  }, [conversationId, setActiveConversation]);

  return (
    <div className="flex flex-col w-full h-full relative">
      <ChatConversationPage params={params} />
    </div>
  );
}
