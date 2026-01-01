import apiClient from "@/lib/http/axios-client";
import type { IPaginationOptions } from "@/types";
import type { CreateDirectChatPayload } from "@/types/common";

export const getInbox = async (payload: { params: IPaginationOptions }) => {
  const { params } = payload;
  const result = await apiClient.get("/chat/inbox", {
    params,
  });

  return result;
};

export const getMessages = async (payload: {
  conversationId: string;
  params: { page: number; limit: number };
}) => {
  const { conversationId, params } = payload;
  const result = await apiClient.get(
    `/chat/conversations/${conversationId}/messages`,
    {
      params,
    },
  );

  return result;
};

export const createGroup = async (payload: {
  name: string;
  memberIds: string[];
}) => {
  const result = await apiClient.post("/chat/groups", payload);
  return result;
};

export const createDirectChat = async (payload: CreateDirectChatPayload) => {
  const result = await apiClient.post("/chat/direct", payload);
  return result;
};

export const markAsReadApi = async (payload: { conversationId: string }) => {
  const { conversationId } = payload;
  const result = await apiClient.put(
    `/chat/conversations/${conversationId}/read`,
  );
  return result;
};
