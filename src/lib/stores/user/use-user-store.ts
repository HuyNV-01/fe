import type { ActionCallbacks, TStoreStatus } from "@/types/store";
import type { IGetListUsersResponse } from "@/types/common";
import { getListUserApi, getUserProfileApi } from "./api";
import { createPersistedStore } from "../create-persisted-store";
import type { IUserState } from "@/types/state";
import type { IPaginationOptions } from "@/types";
import type { ContactStatusEnum } from "@/common/enum";

interface UserActions {
  fetchUsers: (
    payload: { params: IPaginationOptions },
    cb?: ActionCallbacks,
  ) => Promise<void>;
  resetUsers: () => void;
  fetchProfile: (userId: string) => Promise<void>;
  updateRelationship: (status: ContactStatusEnum | null) => void;
  resetProfile: () => void;
}

export const useUserStore = createPersistedStore<IUserState & UserActions>(
  (set, get) => ({
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
        const res = await getUserProfileApi({ userId });
        if (res.status === 200) {
          set({ profile: res.data, status: "idle" });
        }
      } catch (err: any) {
        set({
          status: "idle",
        });
      }
    },

    updateRelationship: (status) => {
      set((state) => {
        if (!state.profile) return {};
        return {
          profile: { ...state.profile, relationship: status },
        };
      });
    },

    resetProfile: () => set({ profile: null }),
  }),
  "user-storage",
  {
    partialize: (state) => ({}) as any,
  },
);
