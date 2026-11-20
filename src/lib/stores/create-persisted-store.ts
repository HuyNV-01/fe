import { StateCreator, create } from "zustand";
import {
  devtools,
  persist,
  createJSONStorage,
  PersistOptions,
  PersistStorage,
  StateStorage,
} from "zustand/middleware";
import { immer } from "zustand/middleware/immer";
import { HydrationState } from "@/types/store";

// Chống crash toàn bộ ứng dụng khi localStorage đầy 5MB (QuotaExceededError)
const safeLocalStorage: StateStorage = {
  getItem: (name: string): string | null => {
    if (typeof window === "undefined") return null;
    try {
      return window.localStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: (name: string, value: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(name, value);
    } catch (err: any) {
      const isQuotaError =
        err?.name === "QuotaExceededError" ||
        err?.code === 22 ||
        err?.code === 1014;
      if (isQuotaError) {
        try {
          // Tự động dọn bản lưu cũ bị phình dung lượng rồi thử ghi lại 1 lần
          window.localStorage.removeItem(name);
          if (name !== "crm-360-storage") {
            window.localStorage.removeItem("crm-360-storage");
          }
          window.localStorage.setItem(name, value);
        } catch {
          // Bỏ qua ghi localStorage nếu trình duyệt vẫn hết dung lượng, giữ state chạy bình thường trên RAM
        }
      }
    }
  },
  removeItem: (name: string): void => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.removeItem(name);
    } catch {
      // Bỏ qua lỗi Storage trên chế độ ẩn danh nghiêm ngặt
    }
  },
};

export const createPersistedStore = <T>(
  storeCreator: StateCreator<
    T & HydrationState,
    [["zustand/immer", never]],
    [],
    T
  >,
  persistName: string,
  options?: Partial<PersistOptions<T & HydrationState>>,
) => {
  return create<T & HydrationState>()(
    devtools(
      persist(
        immer((set, get, api) => {
          const clientStore = storeCreator(set, get, api);
          return {
            ...clientStore,
            _hasHydrated: false,
            setHasHydrated: (status) => {
              set((s: any) => {
                s._hasHydrated = status;
              });
            },
          };
        }),
        {
          name: persistName,
          storage: createJSONStorage(() => safeLocalStorage) as PersistStorage<
            T & HydrationState
          >,
          onRehydrateStorage: () => (state) => {
            state?.setHasHydrated(true);
          },
          ...options,
        },
      ),
    ),
  );
};
