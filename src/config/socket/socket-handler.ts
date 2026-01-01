import { SocketNamespaceEnum } from "@/common/enum";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";

type ConnectionHandler = (isConnected: boolean) => void;

export const SOCKET_CONNECTION_HANDLERS: Record<string, ConnectionHandler> = {
  [SocketNamespaceEnum.CHAT]: (isConnected) => {
    useChatStore.getState().setSocketConnected(isConnected);
  },

  "/": (isConnected) => {},
};
