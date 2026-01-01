import type { ActionCallbacks } from "@/types/store";
import type {
  IAcceptFriendPayload,
  IContactRes,
  IGetContactsResponse,
  IGetListContactsResponse,
  IPaginationContacts,
  IRemoveContactPayload,
  IRequestContactPayload,
} from "@/types/common";
import {
  acceptFriendApi,
  findContactUsersApi,
  getContactsApi,
  removeContactApi,
  requestContactApi,
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
        const res = await requestContactApi({
          data,
        });
        if (res.status === 200) {
          set((state) => {
            const targetUser = state.contacts.data.find(
              (item) => item.id === data.targetUserId,
            ) as any as IContactRes;

            if (targetUser) {
              targetUser.contactStatus = ContactStatusEnum.PENDING_SENT;
            }
            state.isRequest = false;
          });
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
        const res = await acceptFriendApi({
          data,
        });
        if (res.status === 200) {
          set((state) => {
            const targetUser = state.contacts.data.find(
              (item) => item.id === data.senderId,
            ) as any as IContactRes;

            if (targetUser) {
              targetUser.contactStatus = ContactStatusEnum.FRIEND;
            }
            state.isRequest = false;
          });
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
        const res = await removeContactApi({
          data,
        });
        if (res.status === 200) {
          set((state) => {
            const targetUser = state.contacts.data.find(
              (item) => item.id === data.targetId,
            ) as any as IContactRes;

            if (targetUser) {
              targetUser.contactStatus = null;
            }
            state.isRequest = false;
          });
        }
      } catch (error: any) {
        cb?.onError?.(error.response?.data?.code || error.status);
        set({ isRequest: false });
      }
    },

    handleSocketUpdate: (userId, status) => {
      set((state) => {
        const updatedData = state.contacts.data.map((user) => {
          if (user.id === userId) {
            return { ...user, contactStatus: status ?? (null as any) };
          }
          return user;
        });

        return {
          contacts: {
            ...state.contacts,
            data: updatedData,
          },
        };
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
    partialize: (state) => ({}) as any,
  },
);
