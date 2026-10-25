import type {
  IActiveCallState,
  IConversation,
  IMessage,
  IMessagePinnedPayload,
  IMessageReactionPayload,
  IMessageReadPayload,
  IMessageRecalledPayload,
  IMessageStatusUpdatePayload,
  ISendMessagePayload,
  ITypingPayload,
  IUserStatusPayload,
  MessageStatus,
} from "@/types/chat";
import type { CreateDirectChatPayload, IPaginationMeta } from "@/types/common";
import type { ActionCallbacks } from "@/types/store";
import { createPersistedStore } from "../create-persisted-store";
import {
  getInbox,
  getMessages,
  createDirectChat,
  markAsReadApi,
  uploadChatAttachmentsApi,
  editMessageApi,
  recallMessageApi,
  reactMessageApi,
  pinMessageApi,
  muteConversationApi,
  sendMessageHttpFallbackApi,
} from "./api";

import { socketService } from "@/services/socket/socket-client";
import {
  CallStatusEnum,
  CallTypeEnum,
  MessageTypeEnum,
  SocketNamespaceEnum,
} from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { useAuthStore } from "../auth/use-auth-store";
import { v4 as uuidv4 } from "uuid";
import { DEFAULT_LIMIT_INBOX, DEFAULT_LIMIT_MESSAGE } from "@/constant";
import { toast } from "sonner";

interface ChatState {
  tempConversations: IConversation[];
  conversations: IConversation[];
  inboxMeta: IPaginationMeta | null;
  messages: Record<string, IMessage[]>;
  messagesMeta: Record<string, IPaginationMeta>;
  typingUsers: Record<string, string[]>;

  replyingTo: Record<string, IMessage | null>;
  editingMessage: Record<string, IMessage | null>;
  uploadProgress: Record<string, number>;
  activeCall: IActiveCallState | null;

  activeConversationId: string | null;
  isSocketConnected: boolean;
  isLoadingInbox: boolean;
  isLoadingMessages: boolean;
  isLoadingSearch: boolean;

  setSocketConnected: (status: boolean) => void;
  setActiveConversation: (id: string | null) => void;
  setTypingUser: (payload: ITypingPayload & { isTyping: boolean }) => void;

  setReplyingTo: (conversationId: string, message: IMessage | null) => void;
  setEditingMessage: (conversationId: string, message: IMessage | null) => void;

  setActiveCall: (call: IActiveCallState | null) => void;
  updateActiveCall: (patch: Partial<IActiveCallState>) => void;
  initiateCall: (
    conversationId: string,
    callType: CallTypeEnum,
  ) => Promise<void>;

  handleIncomingMessage: (message: IMessage) => void;
  handleMessageEdited: (message: IMessage) => void;
  handleMessageRecalled: (payload: IMessageRecalledPayload) => void;
  handleMessageReaction: (payload: IMessageReactionPayload) => void;
  handleMessagePinned: (payload: IMessagePinnedPayload) => void;

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
  sendAttachmentMessage: (payload: {
    conversationId: string;
    files: File[];
    content?: string;
    replyToMessageId?: string;
  }) => Promise<void>;
  editMessage: (payload: {
    conversationId: string;
    messageId: string;
    content: string;
  }) => Promise<void>;
  recallMessage: (payload: {
    conversationId: string;
    messageId: string;
  }) => Promise<void>;
  reactMessage: (payload: {
    conversationId: string;
    messageId: string;
    emoji: string;
  }) => Promise<void>;
  pinMessage: (payload: {
    conversationId: string;
    messageId: string;
    isPinned: boolean;
  }) => Promise<void>;
  toggleMuteConversation: (
    conversationId: string,
    isMuted: boolean,
  ) => Promise<void>;
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
    replyingTo: {},
    editingMessage: {},
    uploadProgress: {},
    activeCall: null,
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

    setReplyingTo: (conversationId, message) => {
      set((state) => {
        state.replyingTo[conversationId] = message;
        if (message) {
          state.editingMessage[conversationId] = null;
        }
      });
    },

    setEditingMessage: (conversationId, message) => {
      set((state) => {
        state.editingMessage[conversationId] = message;
        if (message) {
          state.replyingTo[conversationId] = null;
        }
      });
    },

    setActiveCall: (call) => {
      set({ activeCall: call });
    },

    updateActiveCall: (patch) => {
      set((state) => {
        if (!state.activeCall) return;
        state.activeCall = {
          ...state.activeCall,
          ...patch,
        };
      });
    },

    initiateCall: async (conversationId, callType) => {
      const { activeCall } = get();
      if (activeCall) {
        toast.warning("Bạn đang trong một cuộc gọi khác");
        return;
      }

      try {
        const res = await socketService.emit<any>(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CALL.INITIATE,
          {
            conversationId,
            callType,
          },
        );

        if (res?.ringingUserIds?.length === 0 && res?.busyUserIds?.length > 0) {
          toast.info("Người nhận hiện đang bận ở một cuộc gọi khác");
          return;
        }

        set({
          activeCall: {
            callId: res.callId,
            conversationId,
            callType,
            initiatorId: res.initiatorId,
            status: CallStatusEnum.RINGING,
            isIncoming: false,
            startedAt: res.createdAt,
            participants: res.participants || {},
            isMinimized: false,
          },
        });
      } catch (err: any) {
        toast.error(err?.message || "Không thể khởi tạo cuộc gọi");
      }
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
      const { activeConversationId } = get();
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
        if (!isMe && isViewing && initialStatus !== "removed") {
          initialStatus = "read";
        }

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
            message.type === MessageTypeEnum.TEXT ||
            message.type === MessageTypeEnum.CALL
              ? message.content
              : `[${message.type}] ${message.content || ""}`;
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

    handleMessageEdited: (message: IMessage) => {
      set((state) => {
        const msgs = state.messages[message.conversationId];
        if (msgs) {
          const idx = msgs.findIndex((m) => m.id === message.id);
          if (idx !== -1) {
            msgs[idx] = {
              ...msgs[idx],
              content: message.content,
              metadata: {
                ...(msgs[idx].metadata || {}),
                ...(message.metadata || {}),
                isEdited: true,
              },
            };
          }
        }

        const conv = state.conversations.find(
          (c) => c.id === message.conversationId,
        );
        if (conv && msgs && msgs[msgs.length - 1]?.id === message.id) {
          conv.lastMessage = message.content;
        }
      });
    },

    handleMessageRecalled: ({ conversationId, messageId }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (msgs) {
          const idx = msgs.findIndex((m) => m.id === messageId);
          if (idx !== -1) {
            msgs[idx].content = "[Tin nhắn đã được thu hồi]";
            msgs[idx].status = "removed";
            msgs[idx].metadata = {
              ...(msgs[idx].metadata || {}),
              isPinned: false,
              attachments: [],
            };
          }
        }

        const conv = state.conversations.find((c) => c.id === conversationId);
        if (conv && msgs && msgs[msgs.length - 1]?.id === messageId) {
          conv.lastMessage = "[Tin nhắn đã được thu hồi]";
        }
      });
    },

    handleMessageReaction: ({ conversationId, messageId, reactions }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;
        const msg = msgs.find((m) => m.id === messageId);
        if (msg) {
          msg.metadata = {
            ...(msg.metadata || {}),
            reactions,
          };
        }
      });
    },

    handleMessagePinned: ({
      conversationId,
      messageId,
      isPinned,
      pinnedBy,
    }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;
        const msg = msgs.find((m) => m.id === messageId);
        if (msg) {
          msg.metadata = {
            ...(msg.metadata || {}),
            isPinned,
            pinnedBy: isPinned ? pinnedBy : undefined,
          };
        }
      });
    },

    updateMessageStatus: ({ conversationId, id, status, userId }) => {
      set((state) => {
        const msgs = state.messages[conversationId];
        if (!msgs) return;

        const msg = msgs.find((m) => m.id === id);
        if (msg && msg.status !== "removed") {
          const priority: Record<MessageStatus, number> = {
            sending: 0,
            failed: 0,
            sent: 1,
            delivered: 2,
            read: 3,
            removed: 4,
          };
          const currentP = priority[msg.status as MessageStatus] || 0;
          const newP = priority[status] || 0;

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

          if (
            isMyMessage &&
            msg.status !== "read" &&
            msg.status !== "removed"
          ) {
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
          if (targetIds.has(msg.id) && msg.status !== "removed") {
            const priority: Record<MessageStatus, number> = {
              sending: 0,
              sent: 1,
              delivered: 2,
              read: 3,
              failed: 0,
              removed: 4,
            };
            const currentP = priority[msg.status as MessageStatus] || 0;
            const newP = priority[status] || 0;

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
          socketService
            .emit(
              SocketNamespaceEnum.CHAT,
              SOCKET_EVENTS.CHAT.ACK_PENDING_MESSAGES,
              {},
            )
            .catch(() => {});
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

        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          socketService
            .emit(SocketNamespaceEnum.CHAT, SOCKET_EVENTS.CHAT.JOIN_ROOM, {
              conversationId: conversation.id,
            })
            .catch(() => {});
        }

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
      const replyTarget = get().replyingTo[payload.conversationId];
      const finalReplyId = payload.replyToMessageId || replyTarget?.id;

      const optimisticMsg: IMessage = {
        id: tempId,
        tempId,
        content: payload.content,
        type: payload.type || MessageTypeEnum.TEXT,
        senderId: currentUser?.id || "",
        conversationId: payload.conversationId,
        createdAt: new Date().toISOString(),
        status: "sending",
        sender: currentUser,
        metadata: {
          ...(payload.metadata || {}),
          ...(replyTarget
            ? {
                replyToMessageId: replyTarget.id,
                replyPreview: {
                  messageId: replyTarget.id,
                  senderId: replyTarget.senderId,
                  senderName: replyTarget.sender?.name || "Người dùng",
                  content: replyTarget.content,
                  type: replyTarget.type,
                },
              }
            : {}),
        },
      };

      set((state) => {
        if (!state.messages[payload.conversationId]) {
          state.messages[payload.conversationId] = [];
        }
        state.messages[payload.conversationId].push(optimisticMsg);
        state.replyingTo[payload.conversationId] = null;
      });

      const requestPayload = {
        ...payload,
        replyToMessageId: finalReplyId,
        tempId,
      };

      try {
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          await socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.SEND_MESSAGE,
            requestPayload,
          );
        } else {
          // Tự động Fallback sang HTTP REST API khi Socket đang reconnect
          await sendMessageHttpFallbackApi(requestPayload);
        }

        set((state) => {
          const msgs = state.messages[payload.conversationId];
          const msgIndex = msgs?.findIndex(
            (m) => m.id === tempId || m.tempId === tempId,
          );
          if (msgs && msgIndex !== undefined && msgIndex !== -1) {
            if (msgs[msgIndex].status === "sending") {
              msgs[msgIndex].status = "sent";
            }
          }
        });
      } catch {
        try {
          await sendMessageHttpFallbackApi(requestPayload);
          set((state) => {
            const msgs = state.messages[payload.conversationId];
            const msgIndex = msgs?.findIndex(
              (m) => m.id === tempId || m.tempId === tempId,
            );
            if (msgs && msgIndex !== undefined && msgIndex !== -1) {
              msgs[msgIndex].status = "sent";
            }
          });
        } catch {
          set((state) => {
            const msgs = state.messages[payload.conversationId];
            const msgIndex = msgs?.findIndex(
              (m) => m.id === tempId || m.tempId === tempId,
            );
            if (msgs && msgIndex !== undefined && msgIndex !== -1) {
              msgs[msgIndex].status = "failed";
            }
          });
        }
      }
    },

    sendAttachmentMessage: async ({
      conversationId,
      files,
      content,
      replyToMessageId,
    }) => {
      if (!files.length) return;
      const tempId = uuidv4();
      const currentUser = useAuthStore.getState().currentAccount?.user;
      const replyTarget = get().replyingTo[conversationId];
      const finalReplyId = replyToMessageId || replyTarget?.id;

      const firstMime = files[0]?.type || "";
      let detectedType = MessageTypeEnum.FILE;
      if (firstMime.startsWith("image/")) detectedType = MessageTypeEnum.IMAGE;
      else if (firstMime.startsWith("video/"))
        detectedType = MessageTypeEnum.VIDEO;
      else if (firstMime.startsWith("audio/"))
        detectedType = MessageTypeEnum.AUDIO;

      const previewAttachments = files.map((file, idx) => ({
        fileId: `local-${tempId}-${idx}`,
        url: URL.createObjectURL(file),
        fileName: file.name,
        mimeType: file.type || "application/octet-stream",
        size: file.size,
      }));

      const optimisticMsg: IMessage = {
        id: tempId,
        tempId,
        content: content || files.map((f) => f.name).join(", "),
        type: detectedType,
        senderId: currentUser?.id || "",
        conversationId,
        createdAt: new Date().toISOString(),
        status: "sending",
        sender: currentUser,
        metadata: {
          attachments: previewAttachments,
          ...(replyTarget
            ? {
                replyToMessageId: replyTarget.id,
                replyPreview: {
                  messageId: replyTarget.id,
                  senderId: replyTarget.senderId,
                  senderName: replyTarget.sender?.name || "Người dùng",
                  content: replyTarget.content,
                  type: replyTarget.type,
                },
              }
            : {}),
        },
      };

      set((state) => {
        if (!state.messages[conversationId]) {
          state.messages[conversationId] = [];
        }
        state.messages[conversationId].push(optimisticMsg);
        state.replyingTo[conversationId] = null;
        state.uploadProgress[tempId] = 1;
      });

      try {
        await uploadChatAttachmentsApi({
          conversationId,
          files,
          content,
          replyToMessageId: finalReplyId,
          tempId,
          onProgress: (percent) => {
            set((state) => {
              state.uploadProgress[tempId] = percent;
            });
          },
        });

        set((state) => {
          delete state.uploadProgress[tempId];
          const msgs = state.messages[conversationId];
          const msgIndex = msgs?.findIndex(
            (m) => m.id === tempId || m.tempId === tempId,
          );
          if (msgs && msgIndex !== undefined && msgIndex !== -1) {
            if (msgs[msgIndex].status === "sending") {
              msgs[msgIndex].status = "sent";
            }
          }
        });
      } catch (err: any) {
        set((state) => {
          delete state.uploadProgress[tempId];
          const msgs = state.messages[conversationId];
          const msgIndex = msgs?.findIndex(
            (m) => m.id === tempId || m.tempId === tempId,
          );
          if (msgs && msgIndex !== undefined && msgIndex !== -1) {
            msgs[msgIndex].status = "failed";
          }
        });
        toast.error(
          err?.response?.data?.message || "Tải tệp đính kèm thất bại",
        );
      }
    },

    editMessage: async ({ conversationId, messageId, content }) => {
      set((state) => {
        state.editingMessage[conversationId] = null;
      });

      try {
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          await socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.EDIT_MESSAGE,
            { conversationId, messageId, content },
          );
        } else {
          await editMessageApi({ conversationId, messageId, content });
        }
      } catch {
        toast.error("Không thể chỉnh sửa tin nhắn");
      }
    },

    recallMessage: async ({ conversationId, messageId }) => {
      try {
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          await socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.RECALL_MESSAGE,
            { conversationId, messageId },
          );
        } else {
          await recallMessageApi({ conversationId, messageId });
        }
      } catch {
        toast.error("Không thể thu hồi tin nhắn");
      }
    },

    reactMessage: async ({ conversationId, messageId, emoji }) => {
      try {
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          await socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.REACT_MESSAGE,
            { conversationId, messageId, emoji },
          );
        } else {
          await reactMessageApi({ conversationId, messageId, emoji });
        }
      } catch {
        toast.error("Không thể thả biểu tượng cảm xúc");
      }
    },

    pinMessage: async ({ conversationId, messageId, isPinned }) => {
      try {
        if (socketService.isConnected(SocketNamespaceEnum.CHAT)) {
          await socketService.emit(
            SocketNamespaceEnum.CHAT,
            SOCKET_EVENTS.CHAT.PIN_MESSAGE,
            { conversationId, messageId, isPinned },
          );
        } else {
          await pinMessageApi({ conversationId, messageId, isPinned });
        }
        toast.success(isPinned ? "Đã ghim tin nhắn" : "Đã bỏ ghim tin nhắn");
      } catch {
        toast.error("Thao tác ghim tin nhắn thất bại");
      }
    },

    toggleMuteConversation: async (conversationId, isMuted) => {
      try {
        await muteConversationApi({ conversationId, isMuted });
        set((state) => {
          const conv = state.conversations.find((c) => c.id === conversationId);
          if (conv) conv.isMuted = isMuted;
        });
        toast.success(
          isMuted
            ? "Đã tắt thông báo cuộc trò chuyện"
            : "Đã bật thông báo cuộc trò chuyện",
        );
      } catch {
        toast.error("Không thể cập nhật cài đặt thông báo");
      }
    },

    resendMessage: async (tempId, payload) => {
      set((state) => {
        const msgs = state.messages[payload.conversationId];
        const msg = msgs?.find((m) => m.id === tempId);
        if (msg) msg.status = "sending";
      });

      try {
        await socketService.emit(
          SocketNamespaceEnum.CHAT,
          SOCKET_EVENTS.CHAT.SEND_MESSAGE,
          { ...payload, tempId },
        );
        set((state) => {
          const msgs = state.messages[payload.conversationId];
          const msg = msgs?.find((m) => m.id === tempId);
          if (msg) msg.status = "sent";
        });
      } catch {
        set((state) => {
          const msgs = state.messages[payload.conversationId];
          const msg = msgs?.find((m) => m.id === tempId);
          if (msg) msg.status = "failed";
        });
      }
    },

    removeFailedMessage: (tempId, conversationId) => {
      set((state) => {
        state.messages[conversationId] = (
          state.messages[conversationId] || []
        ).filter((m) => m.id !== tempId);
      });
    },

    setUserStatus: ({ userId, isOnline }) => {
      set((state) => {
        state.conversations = state.conversations.map((conv) => {
          if (conv.partnerId === userId) {
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
