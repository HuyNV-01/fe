"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { refreshAccessToken } from "@/lib/http/axios-client";
import { socketService } from "@/services/socket/socket-client";
import { SOCKET_CONNECTION_HANDLERS } from "@/config/socket/socket-handler";
import { SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { getOrCreateDeviceE2EEKey } from "@/utils/crypto-e2ee";

export const useSocketConnection = () => {
  const accessToken = useAuthStore((s) => s.currentAccount?.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const sockets = socketService.getAllSockets();

    if (!accessToken) {
      socketService.disconnectAll();

      Object.values(SOCKET_CONNECTION_HANDLERS).forEach((handler) => {
        handler(false);
      });
      return;
    }

    const handleTokenRefreshAndReconnect = async () => {
      if (isRefreshingRef.current) return;
      isRefreshingRef.current = true;
      try {
        const newToken = await refreshAccessToken();
        setAccessToken(newToken);
        socketService.updateAuthToken(newToken);
        socketService.connectAll(newToken);
      } catch {
        logout();
      } finally {
        isRefreshingRef.current = false;
      }
    };

    sockets.forEach((s) => {
      const nsp = (s as any).nsp as SocketNamespaceEnum;
      const statusHandler = SOCKET_CONNECTION_HANDLERS[nsp];

      const onConnect = async () => {
        if (statusHandler) statusHandler(true);
        socketService.flushPendingQueue(nsp);

        if (nsp === SocketNamespaceEnum.CHAT) {
          const keyInfo = await getOrCreateDeviceE2EEKey();
          if (keyInfo) {
            socketService.send(
              SocketNamespaceEnum.CHAT,
              SOCKET_EVENTS.CHAT.E2EE_REGISTER_KEY,
              {
                publicKey: keyInfo.publicKeyB64,
                algorithm: keyInfo.algorithm,
                keyId: keyInfo.keyId,
              },
            );
          }
        }
      };

      const onDisconnect = (reason: string) => {
        if (statusHandler) statusHandler(false);

        if (reason === "io server disconnect") {
          handleTokenRefreshAndReconnect();
        }
      };

      const onConnectError = async (err: Error) => {
        const isAuthError =
          err.message.includes("Unauthorized") ||
          err.message.includes("token") ||
          err.message.includes("Authentication") ||
          err.message.includes("expired");

        if (isAuthError) {
          await handleTokenRefreshAndReconnect();
        }
      };

      s.off("connect", onConnect);
      s.off("disconnect", onDisconnect);
      s.off("connect_error", onConnectError);

      s.on("connect", onConnect);
      s.on("disconnect", onDisconnect);
      s.on("connect_error", onConnectError);
    });

    socketService.connectAll(accessToken);

    const heartbeatInterval = setInterval(() => {
      if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
        socketService.send(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.SYSTEM.HEARTBEAT,
          {},
        );
      }
    }, 45_000);

    return () => {
      clearInterval(heartbeatInterval);
      sockets.forEach((s) => {
        s.off("connect");
        s.off("disconnect");
        s.off("connect_error");
      });
    };
  }, [accessToken, logout, setAccessToken]);
};
