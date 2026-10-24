import type { Socket } from "socket.io-client";
import { getOrCreateSocket } from "@/lib/socket-registry";
import { SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";

export interface SocketResponse<T = any> {
  status: "ok" | "error" | 200 | 201;
  data?: T;
  message?: string;
  code?: number;
}

type CleanupCallback = () => void;

interface QueuedPacket {
  namespace: SocketNamespaceEnum;
  event: string;
  payload: any;
  queuedAt: number;
}

class SocketClientService {
  private readonly TIMEOUT_MS = 8000;
  private readonly QUEUE_TTL_MS = 15000;
  private readonly pendingQueue: QueuedPacket[] = [];

  private getSocket(namespace: SocketNamespaceEnum): Socket {
    return getOrCreateSocket(namespace);
  }

  connectAll(token: string) {
    [SocketNamespaceEnum.CHAT, SocketNamespaceEnum.BASE].forEach((ns) => {
      const socket = this.getSocket(ns);
      const currentAuth = (socket.auth as Record<string, any>) || {};
      socket.auth = {
        ...currentAuth,
        token,
      };

      if (!socket.connected) {
        socket.connect();
      } else {
        socket.emit(SOCKET_EVENTS.SYSTEM.AUTH_REFRESH, { token });
      }
    });
  }

  updateAuthToken(token: string) {
    [SocketNamespaceEnum.CHAT, SocketNamespaceEnum.BASE].forEach((ns) => {
      const socket = this.getSocket(ns);
      const currentAuth = (socket.auth as Record<string, any>) || {};
      socket.auth = {
        ...currentAuth,
        token,
      };

      if (socket.connected) {
        socket.emit(SOCKET_EVENTS.SYSTEM.AUTH_REFRESH, { token });
      }
    });
  }

  disconnectAll() {
    [SocketNamespaceEnum.CHAT, SocketNamespaceEnum.BASE].forEach((ns) => {
      const socket = this.getSocket(ns);
      if (socket.connected) {
        socket.disconnect();
      }
    });
    this.pendingQueue.length = 0;
  }

  isConnected(namespace: SocketNamespaceEnum): boolean {
    return this.getSocket(namespace).connected;
  }

  getAllSockets(): Socket[] {
    return [
      this.getSocket(SocketNamespaceEnum.CHAT),
      this.getSocket(SocketNamespaceEnum.BASE),
    ];
  }

  flushPendingQueue(namespace: SocketNamespaceEnum) {
    const socket = this.getSocket(namespace);
    if (!socket.connected || this.pendingQueue.length === 0) return;

    const now = Date.now();
    const remaining: QueuedPacket[] = [];

    for (const item of this.pendingQueue) {
      if (now - item.queuedAt > this.QUEUE_TTL_MS) continue;
      if (item.namespace === namespace) {
        socket.emit(item.event, item.payload);
      } else {
        remaining.push(item);
      }
    }

    this.pendingQueue.length = 0;
    this.pendingQueue.push(...remaining);
  }

  send<Payload = any>(
    namespace: SocketNamespaceEnum,
    event: string,
    payload: Payload,
  ): void {
    const socket = this.getSocket(namespace);
    if (socket.connected) {
      socket.emit(event, payload);
    } else if (event !== SOCKET_EVENTS.CHAT.TYPING_EMIT) {
      this.pendingQueue.push({
        namespace,
        event,
        payload,
        queuedAt: Date.now(),
      });
    }
  }

  async emit<ResponseData = any, Payload = any>(
    namespace: SocketNamespaceEnum,
    event: string,
    payload: Payload,
    timeoutMs: number = this.TIMEOUT_MS,
  ): Promise<ResponseData> {
    const socket = this.getSocket(namespace);

    if (!socket.connected) {
      return Promise.reject(new Error("Socket not connected"));
    }

    const emitPromise = new Promise<ResponseData>((resolve, reject) => {
      socket.emit(event, payload, (response: SocketResponse<ResponseData>) => {
        if (
          response?.status === "ok" ||
          response?.status === 200 ||
          response?.status === 201 ||
          (response as any) === true
        ) {
          resolve((response?.data ?? response) as ResponseData);
        } else {
          const errorMsg = response?.message || `Failed to emit ${event}`;
          reject(new Error(errorMsg));
        }
      });
    });

    const timeoutPromise = new Promise<ResponseData>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Socket request timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([emitPromise, timeoutPromise]);
  }

  on<T = any>(
    namespace: SocketNamespaceEnum,
    event: string,
    callback: (data: T) => void,
  ): CleanupCallback {
    const socket = this.getSocket(namespace);

    const handler = (data: T) => {
      callback(data);
    };

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }

  once<T = any>(
    namespace: SocketNamespaceEnum,
    event: string,
    callback: (data: T) => void,
  ) {
    const socket = this.getSocket(namespace);
    socket.once(event, callback);
  }
}

export const socketService = new SocketClientService();
