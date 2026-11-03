import type { ActionCallbacks } from "@/types/store";
import type { IBaseResponse, IGetListUsersResponse } from "@/types/common";
import {
  deleteAvatarApi,
  deleteCoverApi,
  getListUserApi,
  getMyProfileApi,
  getUserProfileApi,
  updateAvatarApi,
  updateCoverApi,
  updateMyProfileApi,
} from "./api";
import { createPersistedStore } from "../create-persisted-store";
import type { IUserState } from "@/types/state";
import type { IPaginationOptions } from "@/types";
import { ContactStatusEnum } from "@/common/enum";
import { useAuthStore } from "../auth/use-auth-store";
import { tStore } from "@/i18n/translate-store";
import type { IUpdateProfilePayload, IUserProfile } from "@/types/profile";

interface UserActions {
  fetchUsers: (
    payload: { params: IPaginationOptions },
    cb?: ActionCallbacks,
  ) => Promise<void>;
  resetUsers: () => void;
  fetchProfile: (userId: string) => Promise<void>;
  fetchMyProfile: () => Promise<void>;
  updateMyProfile: (
    payload: IUpdateProfilePayload,
    cb?: ActionCallbacks<IUserProfile>,
  ) => Promise<boolean>;
  updateAvatar: (file: File, cb?: ActionCallbacks<string>) => Promise<void>;
  deleteAvatar: (cb?: ActionCallbacks) => Promise<void>;
  updateCover: (file: File, cb?: ActionCallbacks<string>) => Promise<void>;
  deleteCover: (cb?: ActionCallbacks) => Promise<void>;
  updateRelationship: (status: ContactStatusEnum | null) => void;
  syncProfileBlockState: (
    targetUserId: string,
    blockInfo: {
      isBlocked: boolean;
      blockedByMe?: boolean;
      blockedByTarget?: boolean;
    },
  ) => void;
  resetProfile: () => void;
}

export const useUserStore = createPersistedStore<IUserState & UserActions>(
  (set) => ({
    profile: null,
    users: { data: [], meta: { page: 0, limit: 0, total: 0, totalPages: 0 } },
    status: "idle",
    isProfileBlocked: false,
    profileBlockedByMe: false,
    profileError: null,

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
      set({
        status: "loading",
        isProfileBlocked: false,
        profileBlockedByMe: false,
        profileError: null,
      });
      try {
        const res = (await getUserProfileApi({
          userId,
        })) as unknown as IBaseResponse<IUserProfile>;
        if (res.status === 200 && res.data) {
          set({
            profile: res.data,
            status: "idle",
            isProfileBlocked: Boolean(res.data.isBlocked),
            profileBlockedByMe: Boolean(res.data.blockedByMe),
            profileError: null,
          });
          if (res.data?.isMe) {
            useAuthStore.getState().updateCurrentUser({
              name: res.data.name,
              email: res.data.email,
              avatar: res.data.avatar,
            });
          }
        }
      } catch (error: any) {
        const errData = error?.response?.data;
        const statusCode = error?.response?.status || errData?.status;
        const isBlockedOrNotFound =
          statusCode === 404 ||
          statusCode === 403 ||
          Boolean(errData?.isBlocked);

        set({
          profile: null,
          status: "idle",
          isProfileBlocked: isBlockedOrNotFound,
          profileBlockedByMe: Boolean(errData?.blockedByMe),
          profileError:
            errData?.message || tStore("Profile.unavailable.description"),
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

    updateMyProfile: async (payload, cb) => {
      try {
        const res = (await updateMyProfileApi(
          payload,
        )) as unknown as IBaseResponse<IUserProfile>;
        if (res.status === 200 && res.data) {
          set((state) => {
            state.profile = {
              ...(state.profile || {}),
              ...res.data,
            };
          });
          if (res.data.name) {
            useAuthStore.getState().updateCurrentUser({
              name: res.data.name,
            });
          }
          cb?.onSuccess?.(res.data);
          return true;
        }
        return false;
      } catch (error: any) {
        cb?.onError?.(
          error.response?.data?.message ||
            tStore("Profile.actions.toast.genericError"),
        );
        return false;
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
            tStore("Profile.actions.toast.avatarUploadError"),
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
          error.response?.data?.message ||
            tStore("Profile.actions.toast.avatarDeleteError"),
        );
      }
    },

    updateCover: async (file, cb) => {
      try {
        const res = (await updateCoverApi(file)) as unknown as IBaseResponse<{
          url: string;
        }>;
        if (res.status === 200 && res.data?.url) {
          const newCoverUrl = res.data.url;
          set((state) => {
            if (state.profile) {
              state.profile.coverImage = newCoverUrl;
            }
          });
          cb?.onSuccess?.(newCoverUrl);
        }
      } catch (error: any) {
        cb?.onError?.(
          error.response?.data?.message ||
            tStore("Profile.actions.toast.genericError"),
        );
      }
    },

    deleteCover: async (cb) => {
      try {
        const res = (await deleteCoverApi()) as unknown as IBaseResponse;
        if (res.status === 200) {
          set((state) => {
            if (state.profile) {
              state.profile.coverImage = null;
            }
          });
          cb?.onSuccess?.();
        }
      } catch (error: any) {
        cb?.onError?.(
          error.response?.data?.message ||
            tStore("Profile.actions.toast.genericError"),
        );
      }
    },

    updateRelationship: (status) => {
      set((state) => {
        if (state.profile) {
          state.profile.relationship = status;
          state.profile.accessLevel =
            status === ContactStatusEnum.FRIEND ? "FRIEND" : "STRANGER";
        }
      });
    },

    syncProfileBlockState: (targetUserId, blockInfo) => {
      set((state) => {
        if (state.profile && state.profile.id === targetUserId) {
          state.profile.isBlocked = blockInfo.isBlocked;
          state.profile.blockedByMe = blockInfo.blockedByMe;
          state.profile.blockedByTarget = blockInfo.blockedByTarget;
          state.profile.relationship = blockInfo.isBlocked
            ? ContactStatusEnum.BLOCKED
            : null;
          state.profile.accessLevel = "STRANGER";
          if (blockInfo.isBlocked) {
            state.isProfileBlocked = true;
            state.profileBlockedByMe = Boolean(blockInfo.blockedByMe);
          } else {
            state.isProfileBlocked = false;
            state.profileBlockedByMe = false;
          }
        }
        state.users.data = state.users.data.filter(
          (u) => !(blockInfo.isBlocked && u.id === targetUserId),
        );
      });
    },

    resetProfile: () =>
      set({
        profile: null,
        isProfileBlocked: false,
        profileBlockedByMe: false,
        profileError: null,
      }),
  }),
  "user-storage",
  {
    partialize: () => ({}) as any,
  },
);
