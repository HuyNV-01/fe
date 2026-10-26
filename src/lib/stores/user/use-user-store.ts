import type { ActionCallbacks } from "@/types/store";
import type { IBaseResponse, IGetListUsersResponse } from "@/types/common";
import {
  deleteAvatarApi,
  getListUserApi,
  getMyProfileApi,
  getUserProfileApi,
  updateAvatarApi,
} from "./api";
import { createPersistedStore } from "../create-persisted-store";
import type { IUserState } from "@/types/state";
import type { IPaginationOptions } from "@/types";
import type { ContactStatusEnum } from "@/common/enum";
import { useAuthStore } from "../auth/use-auth-store";

interface UserActions {
  fetchUsers: (
    payload: { params: IPaginationOptions },
    cb?: ActionCallbacks,
  ) => Promise<void>;
  resetUsers: () => void;
  fetchProfile: (userId: string) => Promise<void>;
  fetchMyProfile: () => Promise<void>;
  updateAvatar: (file: File, cb?: ActionCallbacks<string>) => Promise<void>;
  deleteAvatar: (cb?: ActionCallbacks) => Promise<void>;
  updateRelationship: (status: ContactStatusEnum | null) => void;
  resetProfile: () => void;
}

export const useUserStore = createPersistedStore<IUserState & UserActions>(
  (set) => ({
    profile: null,
    users: { data: [], meta: { page: 0, limit: 0, total: 0, totalPages: 0 } },
    status: "idle",

    fetchUsers: async (payload, cb) => {
      const { params } = payload;
      set({ status: "loading" });
      try {
        const res = (await getListUserApi({
          params,
        })) as unknown as IGetListUsersResponse;
        if (res.status === 200) {
          set((state) => {
            state.users = res.data;
            state.status = "idle";
          });
          cb?.onSuccess?.(res.data);
        }
      } catch (error: any) {
        cb?.onError?.(error.response?.data?.code || error.status);
        set({
          status: "idle",
        });
      }
    },

    resetUsers: () => {
      set((state) => {
        state.users.data = [];
        state.status = "idle";
      });
    },

    fetchProfile: async (userId) => {
      set({ status: "loading" });
      try {
        const res = (await getUserProfileApi({
          userId,
        })) as unknown as IBaseResponse;
        if (res.status === 200) {
          set({ profile: res.data, status: "idle" });
          if (res.data?.isMe) {
            useAuthStore.getState().updateCurrentUser({
              name: res.data.name,
              email: res.data.email,
              avatar: res.data.avatar,
            });
          }
        }
      } catch {
        set({
          status: "idle",
        });
      }
    },

    fetchMyProfile: async () => {
      try {
        const res = (await getMyProfileApi()) as unknown as IBaseResponse;
        if (res.status === 200 && res.data) {
          useAuthStore.getState().updateCurrentUser({
            name: res.data.name,
            email: res.data.email,
            avatar: res.data.avatar,
          });
        }
      } catch {
        // Ignore silent profile refresh error
      }
    },

    updateAvatar: async (file, cb) => {
      try {
        const res = (await updateAvatarApi(file)) as unknown as IBaseResponse<{
          url: string;
        }>;
        if (res.status === 200 && res.data?.url) {
          const newAvatarUrl = res.data.url;
          set((state) => {
            if (state.profile) {
              state.profile.avatar = newAvatarUrl;
            }
          });
          useAuthStore.getState().updateCurrentUser({ avatar: newAvatarUrl });
          cb?.onSuccess?.(newAvatarUrl);
        }
      } catch (error: any) {
        cb?.onError?.(
          error.response?.data?.message ||
            error.response?.data?.code ||
            "Không thể tải lên ảnh đại diện",
        );
      }
    },

    deleteAvatar: async (cb) => {
      try {
        const res = (await deleteAvatarApi()) as unknown as IBaseResponse;
        if (res.status === 200) {
          set((state) => {
            if (state.profile) {
              state.profile.avatar = undefined;
            }
          });
          useAuthStore.getState().updateCurrentUser({ avatar: null });
          cb?.onSuccess?.();
        }
      } catch (error: any) {
        cb?.onError?.(
          error.response?.data?.message || "Không thể xóa ảnh đại diện",
        );
      }
    },

    updateRelationship: (status) => {
      set((state) => {
        if (state.profile) {
          state.profile.relationship = status;
        }
      });
    },

    resetProfile: () => set({ profile: null }),
  }),
  "user-storage",
  {
    partialize: () => ({}) as any,
  },
);
