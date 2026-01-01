/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
import axios, {
  type AxiosError,
  type AxiosInstance,
  type AxiosResponse,
  type InternalAxiosRequestConfig,
} from "axios";

interface RetryQueueItem {
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}

const refreshAndRetryQueue: RetryQueueItem[] = [];
let isRefreshing = false;

export const refreshAccessToken = async (): Promise<string> => {
  if (isRefreshing) {
    return new Promise<string>((resolve, reject) => {
      refreshAndRetryQueue.push({ resolve, reject });
    });
  }

  isRefreshing = true;

  try {
    const { data: resData } = await axios.post(
      `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      {},
      { withCredentials: true },
    );

    const newToken = resData.data.accessToken;

    if (typeof window !== "undefined") {
      localStorage.setItem("accessToken", newToken);
    }

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
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: Number(process.env.NEXT_PUBLIC_TIMEOUT) || 10000,
  headers: {
    "Content-Type": "application/json",
  },
  withCredentials: true,
});

apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("accessToken")
        : null;

    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
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
      originalRequest.url?.includes("/auth/login") ||
      originalRequest.url?.includes("/login")
    ) {
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      // if (isRefreshing) {
      //   return new Promise<void>((resolve, reject) => {
      //     refreshAndRetryQueue.push({ resolve, reject });
      //   })
      //     .then((token) => {
      //       if (originalRequest.headers) {
      //         originalRequest.headers.Authorization = `Bearer ${token}`;
      //       }
      //       return apiClient(originalRequest);
      //     })
      //     .catch((err) => Promise.reject(err));
      // }

      // originalRequest._retry = true;
      // isRefreshing = true;

      // try {
      //   const { data: resData } = await axios.post(
      //     `${process.env.NEXT_PUBLIC_API_URL}/auth/refresh`,
      //     {},
      //     { withCredentials: true },
      //   );

      //   const newToken = resData.data.accessToken;

      //   if (typeof window !== "undefined") {
      //     localStorage.setItem("accessToken", newToken);
      //   }

      //   if (originalRequest.headers) {
      //     apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
      //     originalRequest.headers.Authorization = `Bearer ${newToken}`;
      //   }

      //   refreshAndRetryQueue.forEach((prom) => prom.resolve(newToken));
      //   refreshAndRetryQueue.length = 0;

      //   return apiClient(originalRequest);
      // } catch (refreshError) {
      //   refreshAndRetryQueue.forEach((prom) => prom.reject(refreshError));
      //   refreshAndRetryQueue.length = 0;

      //   if (typeof window !== "undefined") {
      //     localStorage.removeItem("accessToken");
      //     localStorage.clear();
      //     window.location.href = "/login";
      //   }
      //   return Promise.reject(refreshError);
      // } finally {
      //   isRefreshing = false;
      // }
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();

        if (originalRequest.headers) {
          apiClient.defaults.headers.common.Authorization = `Bearer ${newToken}`;
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
        }
        return apiClient(originalRequest);
      } catch (refreshError) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("accessToken");
          localStorage.clear();
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      }
    }

    if (error.response?.status === 403) {
    }

    return Promise.reject(error);
  },
);

export default apiClient;
