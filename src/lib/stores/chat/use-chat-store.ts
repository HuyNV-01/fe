import type {
  IConversation,
  IMessage,
  ISendMessagePayload,
  ITypingPayload,
  IUserStatusPayload,
} from "@/types/chat";
import type { CreateDirectChatPayload, IPaginationMeta } from "@/types/common";
import type { ActionCallbacks } from "@/types/store";
import { createPersistedStore } from "../create-persisted-store";
import { getInbox, getMessages, createDirectChat, markAsReadApi } from "./api";

import { socketService } from "@/services/socket/socket-client";
import { MessageTypeEnum, SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { useAuthStore } from "../auth/use-auth-store";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_LIMIT_INBOX, DEFAULT_LIMIT_MESSAGE } from "@/constant";

interface ChatState {
  tempConversations: IConversation[];
  conversations: IConversation[];
  inboxMeta: IPaginationMeta | null;
  messages: Record<string, IMessage[]>;
  messagesMeta: Record<string, IPaginationMeta>;
  typingUsers: Record<string, string[]>;

  activeConversationId: string | null;
  isSocketConnected: boolean;
  isLoadingInbox: boolean;
  isLoadingMessages: boolean;
  isLoadingSearch: boolean;

  setSocketConnected: (status: boolean) => void;
  setActiveConversation: (id: string | null) => void;
  setTypingUser: (payload: ITypingPayload & { isTyping: boolean }) => void;
  receiveMessage: (message: IMessage) => void;
  setUserStatus: (payload: IUserStatusPayload) => void;

  fetchInbox: (
    payload: { page?: number; limit?: number; search?: string },
    cb?: ActionCallbacks,
  ) => Promise<void>;
  fetchMessages: (
    conversationId: string,
    page?: number,
    cb?: ActionCallbacks,
  ) => Promise<void>;
  createDirectChat: (
    payload: CreateDirectChatPayload,
    cb?: ActionCallbacks,
  ) => Promise<string | null>;
  sendMessage: (payload: ISendMessagePayload) => Promise<void>;
  resendMessage: (
    tempId: string,
    payload: ISendMessagePayload,
  ) => Promise<void>;
  removeFailedMessage: (tempId: string, conversationId: string) => void;
  resetTempConversations: () => void;
}

export const useChatStore = createPersistedStore<ChatState>(
  (set, get) => ({
    tempConversations: [],
    conversations: [],
    inboxMeta: null,
    messages: {},
    messagesMeta: {},
    typingUsers: {},
    activeConversationId: null,
    isSocketConnected: false,
    isLoadingInbox: false,
    isLoadingMessages: false,
    isLoadingSearch: false,

    setSocketConnected: (status) => {
      set({ isSocketConnected: status });

      if (status) {
        const { activeConversationId } = get();
        if (activeConversationId) {
          socketService
            .emit(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CHAT.JOIN_ROOM, {
              conversationId: activeConversationId,
            })
            .catch(console.warn);
        }
      }
    },

    setActiveConversation: (id) => {
      const { activeConversationId, isSocketConnected } = get();

      if (activeConversationId === id) return;

      if (activeConversationId && isSocketConnected) {
        socketService
          .emit(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CHAT.LEAVE_ROOM, {
            conversationId: activeConversationId,
          })
          .catch(console.warn);
      }

      set((state) => {
        state.activeConversationId = id;
        if (id) {
          const conv = state.conversations.find((c) => c.id === id);
          if (conv) conv.unreadCount = 0;
        }
      });

      if (!id) return;

      if (isSocketConnected) {
        socketService
          .emit(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CHAT.JOIN_ROOM, {
            conversationId: id,
          })
          .catch((err) => console.error("Join room failed:", err));
      }

      markAsReadApi({ conversationId: id }).catch(console.error);
    },

    setTypingUser: ({
      conversationId,
      userId,
      isTyping,
    }: ITypingPayload & { isTyping: boolean }) => {
      set((state) => {
        const currentTyping = state.typingUsers[conversationId] || [];

        if (isTyping) {
          if (!currentTyping.includes(userId)) {
            state.typingUsers[conversationId] = [...currentTyping, userId];
          }
        } else {
          state.typingUsers[conversationId] = currentTyping.filter(
            (id) => id !== userId,
          );
        }
      });

      if (isTyping) {
        setTimeout(() => {
          set((state) => {
            const users = state.typingUsers[conversationId] || [];
            state.typingUsers[conversationId] = users.filter(
              (id) => id !== userId,
            );
          });
        }, 5000);
      }
    },

    receiveMessage: (message) => {
      set((state) => {
        const convId = message.conversationId;

        if (!state.messages[convId]) state.messages[convId] = [];

        const existingIndex = state.messages[convId].findIndex(
          (m) =>
            m.id === message.id || (m.tempId && m.tempId === message.tempId),
        );

        if (existingIndex !== -1) {
          state.messages[convId][existingIndex] = {
            ...message,
            status: "read",
          };
        } else {
          state.messages[convId].push({ ...message, status: "read" });
        }

        const exists = state.messages[convId].some((m) => m.id === message.id);
        if (!exists) {
          state.messages[convId].push(message);
        }

        const existingConv = state.conversations.find((c) => c.id === convId);

        if (existingConv) {
          const updatedConv = {
            ...existingConv,
            lastMessage:
              message.type === "TEXT" ? message.content : `[${message.type}]`,
            lastMessageAt: message.createdAt,
          };

          if (state.activeConversationId !== convId) {
            updatedConv.unreadCount = (updatedConv.unreadCount || 0) + 1;
          } else {
            updatedConv.unreadCount = 0;
          }
          const otherConvs = state.conversations.filter((c) => c.id !== convId);

          state.conversations = [updatedConv, ...otherConvs];
        } else {
          get().fetchInbox({ page: 1 });
        }
      });
    },

    fetchInbox: async (payload, cb) => {
      const { page = 1, limit, search } = payload;
      if (search) {
        set({ isLoadingSearch: true });
      } else {
        set({ isLoadingInbox: true });
      }

      try {
        const res = await getInbox({
          params: { page, limit: limit || DEFAULT_LIMIT_INBOX, search },
        });

        if (search) {
          set((state) => {
            if (page === 1) {
              state.tempConversations = res.data.data;
            } else {
              const newConvs = res.data.data.filter(
                (newC: { id: string }) =>
                  !state.tempConversations.some((curr) => curr.id === newC.id),
              );
              state.tempConversations = [
                ...state.tempConversations,
                ...newConvs,
              ];
            }
          });
        } else {
          set((state) => {
            if (page === 1) {
              state.conversations = res.data.data;
            } else {
              const newConvs = res.data.data.filter(
                (newC: { id: string }) =>
                  !state.conversations.some((curr) => curr.id === newC.id),
              );
              state.conversations = [...state.conversations, ...newConvs];
            }
            state.inboxMeta = res.data.meta;
          });
        }

        cb?.onSuccess?.();
      } catch (error: any) {
        const message =
          error.response?.data?.message || "Lỗi tải danh sách chat";
        cb?.onError?.(message);
      } finally {
        set({ isLoadingInbox: false });
        set({ isLoadingSearch: false });
      }
    },

    fetchMessages: async (conversationId, page = 1, cb) => {
      const state = get();
      if (state.isLoadingMessages) return;

      const currentMeta = state.messagesMeta[conversationId];
      if (page > 1 && currentMeta && page > currentMeta.totalPages) return;

      set({ isLoadingMessages: true });

      try {
        const res = await getMessages({
          conversationId,
          params: { page, limit: DEFAULT_LIMIT_MESSAGE },
        });

        set((state) => {
          const newMessages = res.data.data.reverse();

          if (page === 1) {
            state.messages[conversationId] = newMessages;
          } else {
            const currentMessages = state.messages[conversationId] || [];
            const uniqueNewMessages = newMessages.filter(
              (nm: { id: string }) =>
                !currentMessages.some((cm) => cm.id === nm.id),
            );
            state.messages[conversationId] = [
              ...uniqueNewMessages,
              ...currentMessages,
            ];
          }
          state.messagesMeta[conversationId] = res.data.meta;
        });

        cb?.onSuccess?.();
      } catch (error: any) {
        const message = error.response?.data?.message || "Lỗi tải tin nhắn";
        cb?.onError?.(message);
      } finally {
        set({ isLoadingMessages: false });
      }
    },

    createDirectChat: async (payload, cb) => {
      try {
        const res = await createDirectChat(payload);
        const conversation = res.data;

        set((state) => {
          state.activeConversationId = conversation.id;
          if (!state.conversations.find((c) => c.id === conversation.id)) {
            state.conversations.unshift(conversation);
          }
        });

        socketService.emit(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CHAT.JOIN_ROOM,
          { conversationId: conversation.id },
        );

        cb?.onSuccess?.();
        return conversation.id;
      } catch (error: any) {
        const message = error.response?.data?.message || "Lỗi tạo chat";
        cb?.onError?.(message);
        return null;
      }
    },

    sendMessage: async (payload) => {
      const tempId = uuidv4();
      const currentUser = useAuthStore.getState().currentAccount?.user;

      const optimisticMsg: IMessage = {
        id: tempId,
        tempId: tempId,
        content: payload.content,
        type: payload.type || MessageTypeEnum.TEXT,
        senderId: currentUser?.id || "",
        conversationId: payload.conversationId,
        createdAt: new Date().toISOString(),
        status: "sending",
        sender: currentUser,
      };

      set((state) => {
        if (!state.messages[payload.conversationId])
          state.messages[payload.conversationId] = [];
        state.messages[payload.conversationId].push(optimisticMsg);
      });

      try {
        await socketService.emit(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CHAT.SEND_MESSAGE,
          { ...payload, tempId },
        );

        set((state) => {
          const msgs = state.messages[payload.conversationId];
          const msgIndex = msgs.findIndex((m) => m.id === tempId);
          if (msgIndex !== -1) {
            msgs[msgIndex].status = "sent";
          }
        });
      } catch (error) {
        set((state) => {
          const msgs = state.messages[payload.conversationId];
          const msgIndex = msgs.findIndex((m) => m.id === tempId);
          if (msgIndex !== -1) {
            msgs[msgIndex].status = "failed";
          }
        });
      }
    },

    resendMessage: async (tempId, payload) => {
      set((state) => {
        const msgs = state.messages[payload.conversationId];
        const msg = msgs.find((m) => m.id === tempId);
        if (msg) msg.status = "sending";
      });

      try {
        await socketService.emit(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CHAT.SEND_MESSAGE,
          payload,
        );
        set((state) => {
          const msgs = state.messages[payload.conversationId];
          const msg = msgs.find((m) => m.id === tempId);
          if (msg) msg.status = "sent";
        });
      } catch (error) {
        set((state) => {
          const msgs = state.messages[payload.conversationId];
          const msg = msgs.find((m) => m.id === tempId);
          if (msg) msg.status = "failed";
        });
      }
    },

    removeFailedMessage: (tempId, conversationId) => {
      set((state) => {
        state.messages[conversationId] = state.messages[conversationId].filter(
          (m) => m.id !== tempId,
        );
      });
    },

    setUserStatus: ({ userId, isOnline }) => {
      set((state) => {
        state.conversations = state.conversations.map((conv) => {
          if ((conv as any).partnerId === userId) {
            return { ...conv, isOnline };
          }
          return conv;
        });
      });
    },

    resetTempConversations: () => {
      set((state) => {
        state.tempConversations = [];
        state.isLoadingSearch = false;
      });
    },
  }),
  "chat-storage",
  {
    partialize: (state) => ({ conversations: state.conversations }) as any,
  },
);
