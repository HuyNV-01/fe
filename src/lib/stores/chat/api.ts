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

export const getIceServersApi = async () => {
  return apiClient.get("/chat/calls/ice-servers");
};
