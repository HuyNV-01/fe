/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";
import {
  resolveFrontendApiBaseUrl,
  TUNNEL_REQUEST_HEADERS,
} from "@/config/tunnel";
import { socketService } from "@/services/socket/socket-client";

interface RetryQueueItem {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}

const refreshAndRetryQueue: RetryQueueItem[] = [];
let isRefreshing = false;

/**
 * Đọc `refreshToken` đã lưu từ `localStorage` hoặc `auth-storage` (Zustand Persist)
 * để đảm bảo ngay cả khi trình duyệt chặn Third-Party Cookie trên tên miền Ngrok (`.ngrok-free.app`),
 * yêu cầu `/auth/refresh` vẫn luôn gửi kèm `refreshToken` qua Header và Body.
 */
const getStoredRefreshToken = (): string | null => {
  if (typeof window === "undefined") return null;
  const direct = localStorage.getItem("refreshToken");
  if (direct && direct.trim()) {
    return direct.trim();
  }
  try {
    const rawAuthStorage = localStorage.getItem("auth-storage");
    if (rawAuthStorage) {
      const parsed = JSON.parse(rawAuthStorage);
      const fromStore = parsed?.state?.currentAccount?.refreshToken;
      if (typeof fromStore === "string" && fromStore.trim()) {
        return fromStore.trim();
      }
    }
  } catch {
    // Bỏ qua lỗi đọc JSON
  }
  return null;
};

/**
 * Đồng bộ cặp `accessToken` và `refreshToken` mới vào cả `localStorage`, `auth-storage` (Zustand)
 * và cập nhật tức thì cho kết nối WebSocket (`socketService.updateAuthToken`),
 * ngăn chặn triệt để tình trạng F5 trên Ngrok bị nạp lại token cũ đã hết hạn.
 */
const syncRefreshedTokensEverywhere = (
  newAccessToken: string,
  newRefreshToken?: string,
): void => {
  if (typeof window === "undefined") return;

  localStorage.setItem("accessToken", newAccessToken);
  if (newRefreshToken) {
    localStorage.setItem("refreshToken", newRefreshToken);
  }

  try {
    const rawAuthStorage = localStorage.getItem("auth-storage");
    if (rawAuthStorage) {
      const parsed = JSON.parse(rawAuthStorage);
      if (parsed?.state?.currentAccount) {
        parsed.state.currentAccount.accessToken = newAccessToken;
        if (newRefreshToken) {
          parsed.state.currentAccount.refreshToken = newRefreshToken;
        }
        parsed.state.authenticated = true;
        localStorage.setItem("auth-storage", JSON.stringify(parsed));
      }
    }
  } catch {
    // Bỏ qua nếu localStorage bị khóa
  }

  try {
    socketService.updateAuthToken(newAccessToken);
  } catch {
    // Bỏ qua nếu socket chưa khởi tạo
  }
};

export const refreshAccessToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      refreshAndRetryQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const storedRefreshToken = getStoredRefreshToken();
    const refreshHeaders: Record<string, string> = {
      ...TUNNEL_REQUEST_HEADERS,
    };
    if (storedRefreshToken) {
      refreshHeaders.Authorization = `Bearer ${storedRefreshToken}`;
      refreshHeaders["x-refresh-token"] = storedRefreshToken;
    }

    const { data: resData } = await axios.post(
      `${resolveFrontendApiBaseUrl()}/auth/refresh`,
      storedRefreshToken ? { refreshToken: storedRefreshToken } : {},
      {
        withCredentials: true,
        headers: refreshHeaders,
        timeout: 10000,
      },
    );

    const payloadData = resData?.data ?? resData;
    const newToken: string = payloadData?.accessToken;
    const newRefreshToken: string | undefined = payloadData?.refreshToken;

    if (!newToken) {
      throw new Error("EMPTY_REFRESHED_ACCESS_TOKEN");
    }

    syncRefreshedTokensEverywhere(newToken, newRefreshToken);

    refreshAndRetryQueue.forEach((prom) => prom.resolve(newToken));
    refreshAndRetryQueue.length = 0;

    return newToken;
  } catch (error) {
    refreshAndRetryQueue.forEach((prom) => prom.reject(error));
    refreshAndRetryQueue.length = 0;
    throw error;
  } finally {
    isRefreshing = false;
  }
};

const apiClient: AxiosInstance = axios.create({
  baseURL: resolveFrontendApiBaseUrl(),
  timeout: Number(process.env.NEXT_PUBLIC_TIMEOUT) || 15000,
  headers: {
    "Content-Type": "application/json",
    ...TUNNEL_REQUEST_HEADERS,
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    const activeShopId =
      typeof window !== "undefined"
        ? localStorage.getItem("activeShopId")
        : null;

    if (config.headers) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (activeShopId && !config.headers["x-shop-id"]) {
        config.headers["x-shop-id"] = activeShopId;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response.data;
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };

    if (
      !originalRequest ||
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/auth/refresh") ||
      originalRequest.url?.includes("/login")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        if (originalRequest.headers) {
          apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError: any) {
        const refreshStatus = refreshError?.response?.status;
        // Chỉ đăng xuất khi máy chủ xác nhận Refresh Token không còn hiệu lực (401 / 403),
        // không đăng xuất khi chỉ bị gián đoạn mạng Ngrok tạm thời (timeout / 502 / 504)
        if (
          typeof window !== "undefined" &&
          (refreshStatus === 401 || refreshStatus === 403)
        ) {
          localStorage.removeItem("accessToken");
          localStorage.removeItem("refreshToken");
          localStorage.removeItem("activeShopId");
          localStorage.removeItem("auth-storage");
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default apiClient;
