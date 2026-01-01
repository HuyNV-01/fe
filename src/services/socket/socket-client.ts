import type { Socket } from "socket.io-client";
import { socketRegistry } from "@/lib/socket-registry";
import type { SocketNamespaceEnum } from "@/common/enum";

export interface SocketResponse<T = any> {
  status: "ok" | "error" | 200;
  data?: T;
  message?: string;
  code?: number;
}

type CleanupCallback = () => void;

class SocketClientService {
  private readonly TIMEOUT_MS = 5000;

  private getSocket(namespace: SocketNamespaceEnum): Socket {
    const socket = socketRegistry[namespace];
    if (!socket) {
      throw new Error(
        `Socket namespace '${namespace}' is not defined in registry.`,
      );
    }
    return socket;
  }

  connectAll(token: string) {
    Object.values(socketRegistry).forEach((socket) => {
      if (socket.auth) {
        (socket.auth as any).token = token;
      } else {
        socket.auth = { token };
      }

      if (!socket.connected) {
        socket.connect();
      }
    });
  }

  disconnectAll() {
    Object.values(socketRegistry).forEach((socket) => {
      if (socket.connected) {
        socket.disconnect();
      }
    });
  }

  isConnected(namespace: SocketNamespaceEnum): boolean {
    return this.getSocket(namespace).connected;
  }

  getAllSockets() {
    return Object.values(socketRegistry);
  }

  /**
   * Send event without response (Fire & Forget)
   */
  send<Payload = any>(
    namespace: SocketNamespaceEnum,
    event: string,
    payload: Payload,
  ): void {
    const socket = this.getSocket(namespace);
    if (socket.connected) {
      socket.emit(event, payload);
    }
  }

  /**
   * EMIT event to Server (With Ack & Timeout)
   * @param namespace - Namespace to send
   * @param event - Event name
   * @param payload - Data to send
   * @returns Promise<T> - Data returned from Server
   */
  async emit<ResponseData = any, Payload = any>(
    namespace: SocketNamespaceEnum,
    event: string,
    payload: Payload,
  ): Promise<ResponseData> {
    const socket = this.getSocket(namespace);

    if (!socket.connected) {
      console.warn(
        `[${namespace}] Socket disconnected. Cannot emit '${event}'`,
      );
      return Promise.reject(new Error("Socket not connected"));
    }

    const emitPromise = new Promise<ResponseData>((resolve, reject) => {
      if (process.env.NODE_ENV === "development") {
        console.groupCollapsed(`📤 [${namespace}] Emit: ${event}`);
        console.log("Payload:", payload);
        console.groupEnd();
      }

      socket.emit(event, payload, (response: SocketResponse<ResponseData>) => {
        if (
          response?.status === "ok" ||
          response?.status === 200 ||
          (response as any) === true
        ) {
          resolve(response.data as ResponseData);
        } else {
          const errorMsg = response?.message || `Failed to emit ${event}`;
          console.error(`🔥 [${namespace}] Emit Error:`, errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });

    const timeoutPromise = new Promise<ResponseData>((_, reject) => {
      setTimeout(() => {
        reject(
          new Error(`Socket request timed out after ${this.TIMEOUT_MS}ms`),
        );
      }, this.TIMEOUT_MS);
    });

    return Promise.race([emitPromise, timeoutPromise]);
  }

  /**
   * Listen for the event (ON)
   * @returns Cleanup function to cancel listening (used in return of useEffect)
   */
  on<T = any>(
    namespace: SocketNamespaceEnum,
    event: string,
    callback: (data: T) => void,
  ): CleanupCallback {
    const socket = this.getSocket(namespace);

    const handler = (data: T) => {
      if (process.env.NODE_ENV === "development") {
        console.debug(`📥 [${namespace}] Received: ${event}`, data);
      }
      callback(data);
    };

    socket.on(event, handler);

    return () => {
      socket.off(event, handler);
    };
  }

  /**
   * Listen to the event only once (ONCE)
   */
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
