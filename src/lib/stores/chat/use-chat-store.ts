import type {
  IConversation,
  IMessage,
  IMessageReadPayload,
  IMessageStatusUpdatePayload,
  ISendMessagePayload,
  ITypingPayload,
  IUserStatusPayload,
  MessageStatus,
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
  handleIncomingMessage: (message: IMessage) => void;
  updateMessageStatus: (payload: IMessageStatusUpdatePayload) => void;
  handleReadMessage: (payload: IMessageReadPayload) => void;
  setUserStatus: (payload: IUserStatusPayload) => void;
  updateMessageStatusBatch: (payload: {
    conversationId: string;
    messageIds: string[];
    status: MessageStatus;
  }) => void;

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

        socketService.send(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CHAT.MARK_READ,
          {
            conversationId: id,
          },
        );
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

    handleIncomingMessage: (message: IMessage) => {
      const { activeConversationId, conversations } = get();
      const currentUser = useAuthStore.getState().currentAccount?.user;
      const isMe = message.senderId === currentUser?.id;
      const isViewing = activeConversationId === message.conversationId;

      set((state) => {
        const convId = message.conversationId;
        if (!state.messages[convId]) state.messages[convId] = [];

        const msgs = state.messages[convId];

        const existingIndex = msgs.findIndex(
          (m) =>
            (m.tempId && m.tempId === message.tempId) || m.id === message.id,
        );

        let initialStatus: MessageStatus = message.status || "sent";
        if (!isMe && isViewing) initialStatus = "read";

        const newMessage = { ...message, status: initialStatus };

        if (existingIndex !== -1) {
          msgs[existingIndex] = newMessage;
        } else {
          msgs.push(newMessage);
        }

        const convIndex = state.conversations.findIndex((c) => c.id === convId);
        if (convIndex !== -1) {
          const updatedConv = { ...state.conversations[convIndex] };
          updatedConv.lastMessage =
            message.type === "TEXT" ? message.content : `[${message.type}]`;
          updatedConv.lastMessageAt = message.createdAt;

          if (!isMe && !isViewing) {
            updatedConv.unreadCount = (updatedConv.unreadCount || 0) + 1;
          } else if (isViewing) {
            updatedConv.unreadCount = 0;
          }

          state.conversations.splice(convIndex, 1);
          state.conversations.unshift(updatedConv);
        } else {
          get().fetchInbox({ page: 1 });
        }
      });

      if (isViewing && !isMe) {
        socketService.send(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CHAT.MARK_READ,
          {
            conversationId: message.conversationId,
          },
        );
      }
    },

    updateMessageStatus: ({ conversationId, id, status, userId }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;

        const msg = msgs.find((m) => m.id === id);
        if (msg) {
          const priority = {
            sending: 0,
            failed: 0,
            sent: 1,
            delivered: 2,
            read: 3,
          };
          const currentP = priority[msg.status as MessageStatus] || 0;
          const newP = priority[status];

          if (newP > currentP) {
            msg.status = status;
          }

          if (status === "delivered" && userId) {
            if (!msg.deliveredTo) msg.deliveredTo = [];

            const alreadyExists = msg.deliveredTo.some(
              (u: any) => (typeof u === "string" ? u : u.id) === userId,
            );

            if (!alreadyExists) {
              msg.deliveredTo.push(userId);
            }
          }
        }
      });
    },

    handleReadMessage: ({ conversationId, userId, lastReadAt, user }) => {
      const currentUser = useAuthStore.getState().currentAccount?.user;

      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;

        state.messages[conversationId] = msgs.map((msg) => {
          const isMyMessage = msg.senderId === currentUser?.id;

          if (isMyMessage && msg.status !== "read") {
            if (new Date(msg.createdAt) <= new Date(lastReadAt)) {
              const newMsg = { ...msg, status: "read" as MessageStatus };

              if (!newMsg.readBy) newMsg.readBy = [];
              if (!newMsg.readBy.includes(userId)) {
                newMsg.readBy.push(userId);
              }

              if (user) {
                if (!newMsg.readByUsers) newMsg.readByUsers = [];
                const exists = newMsg.readByUsers.some((u) => u.id === userId);
                if (!exists) {
                  newMsg.readByUsers.push(user);
                }
              }

              return newMsg;
            }
          }
          return msg;
        });
      });
    },

    updateMessageStatusBatch: ({ conversationId, messageIds, status }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;

        const targetIds = new Set(messageIds);

        state.messages[conversationId] = msgs.map((msg) => {
          if (targetIds.has(msg.id)) {
            const priority = {
              sending: 0,
              sent: 1,
              delivered: 2,
              read: 3,
              failed: 0,
            };
            const currentP = priority[msg.status as MessageStatus] || 0;
            const newP = priority[status];

            if (newP > currentP) {
              return { ...msg, status };
            }
          }
          return msg;
        });
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

        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.ACK_PENDING_MESSAGES,
            {},
          );
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

        const orderedMessages = [...res.data.data].reverse();

        set((state) => {
          if (page === 1) {
            state.messages[conversationId] = orderedMessages;
          } else {
            const currentMessages = state.messages[conversationId] || [];

            const uniqueNewMessages = orderedMessages.filter(
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

        const currentUser = useAuthStore.getState().currentAccount?.user;

        orderedMessages.forEach((msg: IMessage) => {
          const isMe = msg.senderId === currentUser?.id;

          const isDelivered = msg.deliveredTo?.some(
            (u: any) => (typeof u === "string" ? u : u.id) === currentUser?.id,
          );

          if (!isMe && !isDelivered) {
            socketService.send(
              SocketNamespaceEnum.CHAT,
              SOCKET_EVENTS.CHAT.MESSAGE_RECEIVED,
              { conversationId: msg.conversationId, messageId: msg.id },
            );
          }
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
