import { SocketNamespaceEnum } from "@/common/enum";
import { io, type Socket } from "socket.io-client";

const OPTIONS: any = {
  path: "/socket.io",
  transports: ["polling", "websocket"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 10000,
  withCredentials: true,
};

const BASE_URL = process.env.NEXT_PUBLIC_SOCKET_URL;

const createSocket = (namespace: SocketNamespaceEnum) => {
  return io(`${BASE_URL}${namespace}`, OPTIONS);
};

export const socketRegistry: Record<SocketNamespaceEnum, Socket> = {
  [SocketNamespaceEnum.CHAT]: createSocket(SocketNamespaceEnum.CHAT),
  [SocketNamespaceEnum.BASE]: createSocket(SocketNamespaceEnum.BASE),
};
