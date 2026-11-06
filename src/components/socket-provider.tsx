"use client";

import { CallModal } from "@/components/chat/call-modal";
import { useChatSocket } from "@/utils/hooks/socket/use-chat-socket";
import { useContactSocket } from "@/utils/hooks/socket/use-contact-socket";
import { useIamSocket } from "@/utils/hooks/socket/use-iam-socket";
import { useNotificationSocket } from "@/utils/hooks/socket/use-notification-socket";
import { useOmnichannelSocket } from "@/utils/hooks/socket/use-omnichannel-socket";
import { useSocketConnection } from "@/utils/hooks/socket/use-socket-connection";

export const SocketProvider = ({ children }: { children: React.ReactNode }) => {
  useSocketConnection();
  useChatSocket();
  useContactSocket();
  useNotificationSocket();
  useIamSocket();
  useOmnichannelSocket();

  return (
    <>
      {children}
      <CallModal />
    </>
  );
};
