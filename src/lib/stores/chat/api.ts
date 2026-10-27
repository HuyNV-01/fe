/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
import apiClient from "@/lib/http/axios-client";
import type { IPaginationOptions } from "@/types";
import type { CreateDirectChatPayload } from "@/types/common";

export const getInbox = async (payload: { params: IPaginationOptions }) => {
  const { params } = payload;
  return apiClient.get("/chat/inbox", { params });
};

export const getMessages = async (payload: {
  conversationId: string;
  params: { page: number; limit: number; search?: string };
}) => {
  const { conversationId, params } = payload;
  return apiClient.get(`/chat/conversations/${conversationId}/messages`, {
    params,
  });
};

export const createGroup = async (payload: {
  name: string;
  memberIds: string[];
}) => {
  return apiClient.post("/chat/groups", payload);
};

export const addGroupMembersApi = async (payload: {
  conversationId: string;
  memberIds: string[];
}) => {
  return apiClient.post(`/chat/groups/${payload.conversationId}/members`, {
    memberIds: payload.memberIds,
  });
};

export const removeGroupMemberApi = async (payload: {
  conversationId: string;
  memberId: string;
}) => {
  return apiClient.delete(
    `/chat/groups/${payload.conversationId}/members/${payload.memberId}`,
  );
};

export const createDirectChat = async (payload: CreateDirectChatPayload) => {
  return apiClient.post("/chat/direct", payload);
};

export const markAsReadApi = async (payload: { conversationId: string }) => {
  const { conversationId } = payload;
  return apiClient.put(`/chat/conversations/${conversationId}/read`);
};

export const muteConversationApi = async (payload: {
  conversationId: string;
  isMuted: boolean;
}) => {
  return apiClient.put(`/chat/conversations/${payload.conversationId}/mute`, {
    isMuted: payload.isMuted,
  });
};

export const uploadChatAttachmentsApi = async (payload: {
  conversationId: string;
  files: File[];
  content?: string;
  replyToMessageId?: string;
  tempId?: string;
  onProgress?: (percent: number) => void;
}) => {
  const formData = new FormData();
  payload.files.forEach((f) => formData.append("files", f));
  if (payload.content) formData.append("content", payload.content);
  if (payload.replyToMessageId) {
    formData.append("replyToMessageId", payload.replyToMessageId);
  }
  if (payload.tempId) formData.append("tempId", payload.tempId);

  return apiClient.post(
    `/chat/conversations/${payload.conversationId}/attachments`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
      onUploadProgress: (event) => {
        if (event.total && payload.onProgress) {
          payload.onProgress(Math.round((event.loaded * 100) / event.total));
        }
      },
    },
  );
};

export const editMessageApi = async (payload: {
  conversationId: string;
  messageId: string;
  content: string;
}) => {
  return apiClient.patch("/chat/messages/edit", payload);
};

export const recallMessageApi = async (payload: {
  conversationId: string;
  messageId: string;
}) => {
  return apiClient.delete(
    `/chat/conversations/${payload.conversationId}/messages/${payload.messageId}`,
  );
};

export const reactMessageApi = async (payload: {
  conversationId: string;
  messageId: string;
  emoji: string;
}) => {
  return apiClient.post("/chat/messages/react", payload);
};

export const pinMessageApi = async (payload: {
  conversationId: string;
  messageId: string;
  isPinned: boolean;
}) => {
  return apiClient.post("/chat/messages/pin", payload);
};

export const registerE2EEPublicKeyApi = async (payload: {
  publicKey: string;
  algorithm?: string;
  keyId: string;
}) => {
  return apiClient.post("/chat/e2ee/keys", payload);
};

export const getConversationPublicKeysApi = async (conversationId: string) => {
  return apiClient.get(`/chat/conversations/${conversationId}/e2ee-keys`);
};

export const getIceServersApi = async () => {
  return apiClient.get("/chat/calls/ice-servers");
};

export const sendMessageHttpFallbackApi = async (payload: {
  conversationId: string;
  content: string;
  type?: string;
  replyToMessageId?: string;
  fileIds?: string[];
  tempId?: string;
}) => {
  return apiClient.post("/chat/messages", payload);
};

export const getConversationDetailsApi = async (conversationId: string) => {
  return apiClient.get(`/chat/conversations/${conversationId}/details`);
};

export const getPinnedMessagesApi = async (conversationId: string) => {
  return apiClient.get(`/chat/conversations/${conversationId}/pinned`);
};

export const getSharedAssetsApi = async (
  conversationId: string,
  tab: "MEDIA" | "FILES" | "LINKS" = "MEDIA",
) => {
  return apiClient.get(`/chat/conversations/${conversationId}/shared-assets`, {
    params: { tab },
  });
};

export const updateParticipantNicknameApi = async (payload: {
  conversationId: string;
  targetUserId: string;
  nickname: string | null;
}) => {
  return apiClient.put(
    `/chat/conversations/${payload.conversationId}/nickname`,
    {
      targetUserId: payload.targetUserId,
      nickname: payload.nickname,
    },
  );
};

export const updateConversationSettingsApi = async (payload: {
  conversationId: string;
  isMuted?: boolean;
  soundEnabled?: boolean;
  readReceiptsEnabled?: boolean;
  isRestricted?: boolean;
}) => {
  const { conversationId, ...body } = payload;
  return apiClient.patch(
    `/chat/conversations/${conversationId}/settings`,
    body,
  );
};

export const updateDisappearingMessagesApi = async (payload: {
  conversationId: string;
  disappearingTtl: number | null;
}) => {
  return apiClient.patch(
    `/chat/conversations/${payload.conversationId}/disappearing`,
    { disappearingTtl: payload.disappearingTtl },
  );
};

export const deleteConversationApi = async (conversationId: string) => {
  return apiClient.delete(`/chat/conversations/${conversationId}`);
};
