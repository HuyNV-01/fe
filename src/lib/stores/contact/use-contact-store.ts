import type { ActionCallbacks } from "@/types/store";
import type {
  IAcceptFriendPayload,
  IBaseResponse,
  IContactRes,
  IContactsDataRes,
  IGetContactsResponse,
  IGetListContactsResponse,
  IPaginationContacts,
  IRemoveContactPayload,
  IRequestContactPayload,
  IUpdateContactAliasPayload,
  IUserRes,
} from "@/types/common";
import {
  acceptFriendApi,
  blockUserApi,
  findContactUsersApi,
  getContactsApi,
  removeContactApi,
  requestContactApi,
  unblockUserApi,
  updateContactAliasApi,
} from "./api";
import { createPersistedStore } from "../create-persisted-store";
import type { IContactState } from "@/types/state";
import type { IPaginationOptions } from "@/types";
import { ContactStatusEnum } from "@/common/enum";
import { useAuthStore } from "../auth/use-auth-store";
import { useUserStore } from "../user/use-user-store";

interface ContactActions {
  requestContact: (
    payload: { data: IRequestContactPayload },
    cb?: ActionCallbacks,
  ) => Promise<void>;
  acceptFriend: (
    payload: { data: IAcceptFriendPayload },
    cb?: ActionCallbacks,
  ) => Promise<void>;
  removeContact: (
    payload: { data: IRemoveContactPayload },
    cb?: ActionCallbacks,
  ) => Promise<void>;
  updateAlias: (
    payload: { data: IUpdateContactAliasPayload },
    cb?: ActionCallbacks,
  ) => Promise<void>;
  findContactUsers: (
    payload: { params: IPaginationOptions },
    cb?: ActionCallbacks,
  ) => Promise<void>;
  resetContactUsers: () => void;
  handleSocketUpdate: (
    userId: string,
    status: ContactStatusEnum | null,
  ) => void;
  getContacts: (
    payload: { params: IPaginationContacts },
    cb?: ActionCallbacks,
  ) => Promise<void>;
  resetListContacts: () => void;
  fetchBlockedUsers: (
    params?: IPaginationOptions,
    cb?: ActionCallbacks<IContactsDataRes[]>,
  ) => Promise<void>;
  blockUser: (
    targetId: string,
    targetUserInfo?: IUserRes,
    cb?: ActionCallbacks,
  ) => Promise<boolean>;
  unblockUser: (targetId: string, cb?: ActionCallbacks) => Promise<boolean>;
}

export const useContactStore = createPersistedStore<
  IContactState & ContactActions
>(
  (set, get) => ({
    contacts: {
      data: [],
      meta: { page: 0, limit: 0, total: 0, totalPages: 0 },
    },
    listContacts: {
      data: [],
      meta: { page: 0, limit: 0, total: 0, totalPages: 0 },
    },
    blockedUsers: [],
    isLoadingBlocked: false,
    status: "idle",
    isRequest: false,

    findContactUsers: async (payload, cb) => {
      const { params } = payload;
      set({ status: "wait" });
      try {
        const res = (await findContactUsersApi({
          params,
        })) as unknown as IGetListContactsResponse;
        if (res.status === 200) {
          const blockedSet = new Set(
            get().blockedUsers.map(
              (item) => item.contactUser?.id || item.contactId,
            ),
          );
          const filteredData = (res.data?.data || []).filter(
            (u) =>
              u.id &&
              !blockedSet.has(u.id) &&
              u.contactStatus !== ContactStatusEnum.BLOCKED,
          );
          set((state) => {
            state.contacts = {
              ...res.data,
              data: filteredData,
            };
            state.status = "idle";
          });
          cb?.onSuccess?.(res.data);
        }
      } catch (error: any) {
        cb?.onError?.(error.response?.data?.code || error.status);
        set({ status: "idle" });
      }
    },

    resetContactUsers: () => {
      set((state) => {
        state.contacts = {
          data: [],
          meta: { page: 0, limit: 0, total: 0, totalPages: 0 },
        };
        state.status = "idle";
      });
    },

    requestContact: async (payload, cb) => {
      const { data } = payload;
      set({ isRequest: true });
      try {
        const res = (await requestContactApi({
          data,
        })) as unknown as IBaseResponse;
        if (res.status === 200) {
          set((state) => {
            const targetUser = state.contacts.data.find(
              (item) => item.id === data.targetUserId,
            ) as IContactRes | undefined;

            if (targetUser) {
              targetUser.contactStatus = ContactStatusEnum.PENDING_SENT;
            }
            state.isRequest = false;
          });
          cb?.onSuccess?.();
        }
      } catch (error: any) {
        cb?.onError?.(error.response?.data?.code || error.status);
        set({ isRequest: false });
      }
    },

    acceptFriend: async (payload, cb) => {
      const { data } = payload;
      set({ isRequest: true });
      try {
        const res = (await acceptFriendApi({
          data,
        })) as unknown as IBaseResponse;
        if (res.status === 200) {
          set((state) => {
            const targetUser = state.contacts.data.find(
              (item) => item.id === data.senderId,
            ) as IContactRes | undefined;

            if (targetUser) {
              targetUser.contactStatus = ContactStatusEnum.FRIEND;
            }

            const reqIndex = state.listContacts.data.findIndex(
              (item) =>
                item.contactId === data.senderId ||
                item.contactUser?.id === data.senderId,
            );
            if (reqIndex !== -1) {
              const currentItem = state.listContacts.data[reqIndex];
              if (currentItem.status === ContactStatusEnum.PENDING_RECEIVED) {
                state.listContacts.data.splice(reqIndex, 1);
                if (state.listContacts.meta.total > 0) {
                  state.listContacts.meta.total -= 1;
                }
              } else {
                currentItem.status = ContactStatusEnum.FRIEND;
              }
            }

            state.isRequest = false;
          });
          cb?.onSuccess?.();
        }
      } catch (error: any) {
        cb?.onError?.(error.response?.data?.code || error.status);
        set({ isRequest: false });
      }
    },

    removeContact: async (payload, cb) => {
      const { data } = payload;
      set({ isRequest: true });
      try {
        const res = (await removeContactApi({
          data,
        })) as unknown as IBaseResponse;
        if (res.status === 200) {
          set((state) => {
            const targetUser = state.contacts.data.find(
              (item) => item.id === data.targetId,
            ) as IContactRes | undefined;

            if (targetUser) {
              targetUser.contactStatus = null;
            }

            state.listContacts.data = state.listContacts.data.filter(
              (item) =>
                item.contactId !== data.targetId &&
                item.contactUser?.id !== data.targetId,
            );
            if (state.listContacts.meta.total > 0) {
              state.listContacts.meta.total -= 1;
            }

            state.isRequest = false;
          });
          cb?.onSuccess?.();
        }
      } catch (error: any) {
        cb?.onError?.(error.response?.data?.code || error.status);
        set({ isRequest: false });
      }
    },

    updateAlias: async (payload, cb) => {
      const { data } = payload;
      set({ isRequest: true });
      try {
        const res = (await updateContactAliasApi({
          data,
        })) as unknown as IBaseResponse;
        if (res.status === 200) {
          set((state) => {
            const contactItem = state.listContacts.data.find(
              (item) =>
                item.contactId === data.targetId ||
                item.contactUser?.id === data.targetId,
            );
            if (contactItem) {
              contactItem.alias = data.alias.trim() || null;
            }
            state.isRequest = false;
          });
          cb?.onSuccess?.();
        }
      } catch (error: any) {
        cb?.onError?.(error.response?.data?.code || error.status);
        set({ isRequest: false });
      }
    },

    handleSocketUpdate: (userId, status) => {
      set((state) => {
        if (status === ContactStatusEnum.BLOCKED) {
          state.contacts.data = state.contacts.data.filter(
            (u) => u.id !== userId,
          );
          state.listContacts.data = state.listContacts.data.filter(
            (item) =>
              item.contactId !== userId && item.contactUser?.id !== userId,
          );
          return;
        }

        state.contacts.data = state.contacts.data.map((user) => {
          if (user.id === userId) {
            return { ...user, contactStatus: status ?? null };
          }
          return user;
        });

        if (status === null) {
          state.listContacts.data = state.listContacts.data.filter(
            (item) =>
              item.contactId !== userId && item.contactUser?.id !== userId,
          );
          state.blockedUsers = state.blockedUsers.filter(
            (item) =>
              item.contactId !== userId && item.contactUser?.id !== userId,
          );
        } else {
          const existing = state.listContacts.data.find(
            (item) =>
              item.contactId === userId || item.contactUser?.id === userId,
          );
          if (existing) {
            existing.status = status;
          }
        }
      });
    },

    getContacts: async (payload, cb) => {
      const { params } = payload;
      set({ status: "wait" });
      try {
        const res = (await getContactsApi({
          params,
        })) as unknown as IGetContactsResponse;
        if (res.status === 200) {
          set((state) => {
            state.listContacts = res.data;
            if (params.type === ContactStatusEnum.BLOCKED) {
              state.blockedUsers = res.data.data || [];
            }
            state.status = "idle";
          });
          cb?.onSuccess?.(res.data);
        }
      } catch (error: any) {
        cb?.onError?.(error.response?.data?.code || error.status);
        set({ status: "idle" });
      }
    },

    resetListContacts: () => {
      set((state) => {
        state.listContacts = {
          data: [],
          meta: { page: 0, limit: 0, total: 0, totalPages: 0 },
        };
        state.status = "idle";
      });
    },

    fetchBlockedUsers: async (params, cb) => {
      set({ isLoadingBlocked: true });
      try {
        const res = (await getContactsApi({
          params: {
            page: params?.page || 1,
            limit: params?.limit || 100,
            search: params?.search,
            type: ContactStatusEnum.BLOCKED,
          },
        })) as unknown as IGetContactsResponse;
        if (res.status === 200) {
          const list = res.data?.data || [];
          set((state) => {
            state.blockedUsers = list;
            state.isLoadingBlocked = false;
          });
          cb?.onSuccess?.(list);
        }
      } catch (error: any) {
        set({ isLoadingBlocked: false });
        cb?.onError?.(error.response?.data?.code || error.status);
      }
    },

    blockUser: async (targetId, targetUserInfo, cb) => {
      if (!targetId) return false;
      set({ isRequest: true });
      try {
        await blockUserApi(targetId);
        const currentUserId =
          useAuthStore.getState().currentAccount?.user?.id || "";

        set((state) => {
          const existingContact = state.listContacts.data.find(
            (item) =>
              item.contactId === targetId || item.contactUser?.id === targetId,
          );
          const resolvedUser: IUserRes = targetUserInfo ||
            existingContact?.contactUser || {
              id: targetId,
              name: "Người dùng",
            };

          const alreadyInBlocked = state.blockedUsers.some(
            (item) =>
              item.contactId === targetId || item.contactUser?.id === targetId,
          );
          if (!alreadyInBlocked) {
            state.blockedUsers.unshift({
              id: existingContact?.id || `blocked-${targetId}`,
              userId: currentUserId,
              contactId: targetId,
              status: ContactStatusEnum.BLOCKED,
              contactUser: resolvedUser,
              alias: null,
            });
          }

          state.listContacts.data = state.listContacts.data.filter(
            (item) =>
              item.contactId !== targetId && item.contactUser?.id !== targetId,
          );
          state.contacts.data = state.contacts.data.filter(
            (item) => item.id !== targetId,
          );
          state.isRequest = false;
        });

        useUserStore.getState().syncProfileBlockState(targetId, {
          isBlocked: true,
          blockedByMe: true,
        });

        cb?.onSuccess?.();
        return true;
      } catch (error: any) {
        set({ isRequest: false });
        cb?.onError?.(
          error.response?.data?.message ||
            error.response?.data?.code ||
            error.status,
        );
        return false;
      }
    },

    unblockUser: async (targetId, cb) => {
      if (!targetId) return false;
      set({ isRequest: true });
      try {
        await unblockUserApi(targetId);
        set((state) => {
          state.blockedUsers = state.blockedUsers.filter(
            (item) =>
              item.contactId !== targetId && item.contactUser?.id !== targetId,
          );
          state.listContacts.data = state.listContacts.data.filter(
            (item) =>
              !(
                (item.contactId === targetId ||
                  item.contactUser?.id === targetId) &&
                item.status === ContactStatusEnum.BLOCKED
              ),
          );
          state.isRequest = false;
        });

        useUserStore.getState().syncProfileBlockState(targetId, {
          isBlocked: false,
          blockedByMe: false,
        });

        cb?.onSuccess?.();
        return true;
      } catch (error: any) {
        set({ isRequest: false });
        cb?.onError?.(
          error.response?.data?.message ||
            error.response?.data?.code ||
            error.status,
        );
        return false;
      }
    },
  }),
  "contact-storage",
  {
    partialize: () => ({}) as any,
  },
);
