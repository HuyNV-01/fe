import { SocketNamespaceEnum } from "@/common/enum";
import { io, type Socket } from "socket.io-client";

const getDeviceId = (): string => {
  if (typeof window === "undefined") return "ssr-client";
  let deviceId = localStorage.getItem("chat_device_id");
  if (!deviceId) {
    deviceId = `web-${Math.random().toString(36).substring(2, 10)}-${Date.now().toString(36)}`;
    localStorage.setItem("chat_device_id", deviceId);
  }
  return deviceId;
};

const OPTIONS: any = {
  path: "/socket.io",
  transports: ["websocket", "polling"],
  autoConnect: false,
  reconnection: true,
  reconnectionAttempts: 12,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 8000,
  timeout: 10000,
  withCredentials: true,
};

const BASE_URL =
  process.env.NEXT_PUBLIC_SOCKET_URL ||
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
  "http://localhost:3000";

const socketCache: Partial<Record<SocketNamespaceEnum, Socket>> = {};

export const getOrCreateSocket = (namespace: SocketNamespaceEnum): Socket => {
  if (!socketCache[namespace]) {
    socketCache[namespace] = io(`${BASE_URL}${namespace}`, {
      ...OPTIONS,
      auth: {
        deviceId: getDeviceId(),
      },
    });
  }
  return socketCache[namespace] as Socket;
};

export const socketRegistry: Record<SocketNamespaceEnum, Socket> = {
  get [SocketNamespaceEnum.CHAT]() {
    return getOrCreateSocket(SocketNamespaceEnum.CHAT);
  },
  get [SocketNamespaceEnum.BASE]() {
    return getOrCreateSocket(SocketNamespaceEnum.BASE);
  },
};
