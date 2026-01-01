"use client";

import { useEffect } from "react";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { refreshAccessToken } from "@/lib/http/axios-client";
import { socketService } from "@/services/socket/socket-client";
import { SOCKET_CONNECTION_HANDLERS } from "@/config/socket/socket-handler";

export const useSocketConnection = () => {
  const accessToken = useAuthStore((s) => s.currentAccount?.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);

  useEffect(() => {
    const sockets = socketService.getAllSockets();

    if (!accessToken) {
      socketService.disconnectAll();

      Object.values(SOCKET_CONNECTION_HANDLERS).forEach((handler) => {
        handler(false);
      });
      return;
    }

    sockets.forEach((s) => {
      const statusHandler = SOCKET_CONNECTION_HANDLERS[(s as any).nsp];

      const onConnect = () => {
        console.log(`✅ [${(s as any).nsp}] Connected | ID: ${s.id}`);

        if (statusHandler) statusHandler(true);
      };

      const onDisconnect = (reason: string) => {
        console.warn(`❌ [${(s as any).nsp}] Disconnected | Reason: ${reason}`);
        if (statusHandler) statusHandler(false);

        if (reason === "io server disconnect") {
          s.connect();
        }
      };

      const onConnectError = async (err: Error) => {
        const isAuthError =
          err.message.includes("Unauthorized") ||
          err.message.includes("token missing") ||
          err.message.includes("Authentication") ||
          err.message.includes("jwt expired");

        if (isAuthError) {
          console.warn(`🔄 [${(s as any).nsp}] Auth failed. Refreshing...`);
          try {
            const newToken = await refreshAccessToken();
            setAccessToken(newToken);
          } catch (refreshErr) {
            console.error(`🚨 [${(s as any).nsp}] Refresh failed. Logout.`);
            logout();
          }
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

    return () => {
      sockets.forEach((s) => {
        s.off("connect");
        s.off("disconnect");
        s.off("connect_error");
      });
    };
  }, [accessToken, logout, setAccessToken]);
};
