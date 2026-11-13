"use client";

import { useEffect, useRef } from "react";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { refreshAccessToken } from "@/lib/http/axios-client";
import { socketService } from "@/services/socket/socket-client";
import { SOCKET_CONNECTION_HANDLERS } from "@/config/socket/socket-handler";
import { SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { getOrCreateDeviceE2EEKey } from "@/utils/crypto-e2ee";

/**
 * Giải mã thời điểm hết hạn (`exp` tính bằng mili-giây) của JWT Access Token
 * để chủ động làm mới trước khi hết hạn, tránh bị ngắt kết nối WebSocket đột ngột trên Ngrok.
 */
const decodeJwtExpMs = (token?: string | null): number | null => {
  if (!token) return null;
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => `%${`00${c.charCodeAt(0).toString(16)}`.slice(-2)}`)
        .join(""),
    );
    const parsed = JSON.parse(jsonPayload) as { exp?: number };
    return parsed?.exp ? Number(parsed.exp) * 1000 : null;
  } catch {
    return null;
  }
};

export const useSocketConnection = () => {
  const storeAccessToken = useAuthStore((s) => s.currentAccount?.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const setAccessToken = useAuthStore((s) => s.setAccessToken);
  const isRefreshingRef = useRef(false);

  useEffect(() => {
    const sockets = socketService.getAllSockets();

    // Đồng bộ ưu tiên token mới nhất giữa localStorage và Zustand store khi vừa tải lại trang trên Ngrok
    const latestLocalToken =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;
    const effectiveToken = latestLocalToken || storeAccessToken;

    if (
      latestLocalToken &&
      storeAccessToken &&
      latestLocalToken !== storeAccessToken
    ) {
      const latestRefresh =
        typeof window !== "undefined"
          ? localStorage.getItem("refreshToken") || undefined
          : undefined;
      setAccessToken(latestLocalToken, latestRefresh);
    }

    if (!effectiveToken) {
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
        const latestRefresh =
          typeof window !== "undefined"
            ? localStorage.getItem("refreshToken") || undefined
            : undefined;
        setAccessToken(newToken, latestRefresh);
        socketService.updateAuthToken(newToken);
        socketService.connectAll(newToken);
      } catch (err: any) {
        const status = err?.response?.status;
        // Chỉ đăng xuất khi máy chủ xác nhận Refresh Token không hợp lệ (401/403),
        // bảo toàn phiên làm việc khi đường hầm Ngrok chập chờn tạm thời
        if (status === 401 || status === 403) {
          logout();
        }
      } finally {
        isRefreshingRef.current = false;
      }
    };

    // Nếu token hiện tại đã hết hạn hoặc sắp hết hạn trong vòng 90 giây, chủ động làm mới ngay
    const expMs = decodeJwtExpMs(effectiveToken);
    if (expMs && expMs - Date.now() <= 90_000) {
      void handleTokenRefreshAndReconnect();
    }

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
          void handleTokenRefreshAndReconnect();
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

    socketService.connectAll(effectiveToken);

    const heartbeatInterval = setInterval(() => {
      const currentTok =
        typeof window !== "undefined"
          ? localStorage.getItem("accessToken") || effectiveToken
          : effectiveToken;
      const currentExpMs = decodeJwtExpMs(currentTok);

      // Chủ động xoay vòng ngầm trước khi hết hạn 2 phút để không bao giờ bị đứt phiên
      if (currentExpMs && currentExpMs - Date.now() <= 120_000) {
        void handleTokenRefreshAndReconnect();
        return;
      }

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
  }, [storeAccessToken, logout, setAccessToken]);
};
