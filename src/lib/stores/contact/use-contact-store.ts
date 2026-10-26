import type { ActionCallbacks } from "@/types/store";
import type {
  IAcceptFriendPayload,
  IBaseResponse,
  IContactRes,
  IGetContactsResponse,
  IGetListContactsResponse,
  IPaginationContacts,
  IRemoveContactPayload,
  IRequestContactPayload,
  IUpdateContactAliasPayload,
} from "@/types/common";
import {
  acceptFriendApi,
  findContactUsersApi,
  getContactsApi,
  removeContactApi,
  requestContactApi,
  updateContactAliasApi,
} from "./api";
import { createPersistedStore } from "../create-persisted-store";
import type { IContactState } from "@/types/state";
import type { IPaginationOptions } from "@/types";
import { ContactStatusEnum } from "@/common/enum";

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
}

export const useContactStore = createPersistedStore<
  IContactState & ContactActions
>(
  (set) => ({
    contacts: {
      data: [],
      meta: { page: 0, limit: 0, total: 0, totalPages: 0 },
    },
    listContacts: {
      data: [],
      meta: { page: 0, limit: 0, total: 0, totalPages: 0 },
    },
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
          set((state) => {
            state.contacts = res.data;
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
  }),
  "contact-storage",
  {
    partialize: () => ({}) as any,
  },
);
