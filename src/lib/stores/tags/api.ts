import apiClient from "@/lib/http/axios-client";
import type {
  IAutoTagRuleConfig,
  IQuickReplyProductCard,
  TagApplicableScopeType,
  TagCategoryType,
} from "@/types/chat";

export const getShopTagsApi = async (
  shopId: string,
  params?: { category?: TagCategoryType; scope?: TagApplicableScopeType },
) => {
  return apiClient.get(`/tags/${shopId}`, { params });
};

export const createShopTagApi = async (
  shopId: string,
  payload: {
    name: string;
    slug?: string;
    colorHex?: string;
    colorOklch?: string;
    category?: TagCategoryType;
    isMutuallyExclusiveGroup?: boolean;
    applicableScopesJson?: TagApplicableScopeType[];
    shortcutKey?: string | null;
    sortOrder?: number;
    autoRuleConfigJson?: IAutoTagRuleConfig | null;
  },
) => {
  return apiClient.post(`/tags/${shopId}`, payload);
};

export const updateShopTagApi = async (
  shopId: string,
  tagId: string,
  payload: {
    name?: string;
    colorHex?: string;
    colorOklch?: string;
    category?: TagCategoryType;
    isMutuallyExclusiveGroup?: boolean;
    applicableScopesJson?: TagApplicableScopeType[];
    shortcutKey?: string | null;
    sortOrder?: number;
    autoRuleConfigJson?: IAutoTagRuleConfig | null;
    isActive?: boolean;
  },
) => {
  return apiClient.patch(`/tags/${shopId}/${tagId}`, payload);
};

export const deleteShopTagApi = async (shopId: string, tagId: string) => {
  return apiClient.delete(`/tags/${shopId}/${tagId}`);
};

export const toggleConversationTagApi = async (payload: {
  shopId: string;
  conversationId: string;
  tagId: string;
  forceState?: "ADD" | "REMOVE";
}) => {
  return apiClient.post(
    `/tags/${payload.shopId}/conversations/${payload.conversationId}/toggle`,
    {
      tagId: payload.tagId,
      forceState: payload.forceState,
    },
  );
};

export const bulkAssignConversationTagsApi = async (payload: {
  shopId: string;
  conversationIds: string[];
  addTagIds?: string[];
  removeTagIds?: string[];
}) => {
  return apiClient.post(`/tags/${payload.shopId}/conversations/bulk-assign`, {
    conversationIds: payload.conversationIds,
    addTagIds: payload.addTagIds,
    removeTagIds: payload.removeTagIds,
  });
};

export const toggleMessageBookmarkTagApi = async (payload: {
  shopId: string;
  conversationId: string;
  messageId: string;
  tagId: string;
  noteText?: string;
}) => {
  return apiClient.post(
    `/tags/${payload.shopId}/messages/${payload.messageId}/bookmark`,
    {
      conversationId: payload.conversationId,
      tagId: payload.tagId,
      noteText: payload.noteText,
    },
  );
};

export const getBookmarkedMessagesApi = async (
  shopId: string,
  params?: { conversationId?: string; tagId?: string },
) => {
  return apiClient.get(`/tags/${shopId}/bookmarks`, { params });
};

export const getQuickReplyTemplatesApi = async (
  shopId: string,
  search?: string,
) => {
  return apiClient.get(`/chat/quick-replies/${shopId}`, {
    params: search ? { search } : undefined,
  });
};

export const createQuickReplyTemplateApi = async (
  shopId: string,
  payload: {
    shortcut: string;
    title: string;
    category?: string;
    contentTemplate: string;
    productCardsJson?: IQuickReplyProductCard[];
  },
) => {
  return apiClient.post(`/chat/quick-replies/${shopId}`, payload);
};

export const updateQuickReplyTemplateApi = async (
  shopId: string,
  templateId: string,
  payload: {
    shortcut?: string;
    title?: string;
    category?: string;
    contentTemplate?: string;
    productCardsJson?: IQuickReplyProductCard[];
    isActive?: boolean;
  },
) => {
  return apiClient.patch(
    `/chat/quick-replies/${shopId}/${templateId}`,
    payload,
  );
};

export const deleteQuickReplyTemplateApi = async (
  shopId: string,
  templateId: string,
) => {
  return apiClient.delete(`/chat/quick-replies/${shopId}/${templateId}`);
};

export const interpolateQuickReplyTemplateApi = async (
  shopId: string,
  templateId: string,
  payload: {
    customerName?: string;
    salutation?: string;
    agentName?: string;
    trackingLink?: string;
  },
) => {
  return apiClient.post(
    `/chat/quick-replies/${shopId}/${templateId}/interpolate`,
    payload,
  );
};
