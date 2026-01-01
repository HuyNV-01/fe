import ChatLayoutClient from "@/components/chat/chat-layout-client";
import type { TProps } from "@/types";

export interface ConversationLayoutProps extends TProps {
  sidebar?: React.ReactNode;
  option?: React.ReactNode;
}

export default function ConversationLayout({
  children,
  sidebar,
  option,
}: ConversationLayoutProps) {
  return (
    <ChatLayoutClient sidebar={sidebar} option={option}>
      {children}
    </ChatLayoutClient>
  );
}
