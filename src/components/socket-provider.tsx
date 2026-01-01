"use client";

import { useChatSocket } from "@/utils/hooks/socket/use-chat-socket";
import { useContactSocket } from "@/utils/hooks/socket/use-contact-socket";
import { useSocketConnection } from "@/utils/hooks/socket/use-socket-connection";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useSocketConnection();
  useChatSocket();
  useContactSocket();

  return <>{children}</>;
};
