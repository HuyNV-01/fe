/** biome-ignore-all lint/suspicious/useIterableCallbackReturn: <explanation> */
import apiClient from "@/lib/http/axios-client";
import type {
  IAutoTagRuleConfig,
  IQuickReplyAttachmentItem,
  IQuickReplyProductCard,
  IQuickReplySequenceStep,
  IQuickReplyUsageContext,
  ITagEventMatchConditions,
  ITagEventTagBinding,
  ITagWorkflowActionItem,
  ITagWorkflowExecutionCondition,
  QuickReplyInteractionType,
  QuickReplyScopeType,
  QuickReplyToneStyle,
  QuickReplyVariableSourceType,
  TagApplicableScopeType,
  TagCategoryType,
  TagEventCategoryType,
  TagEventDirectionType,
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
    description?: string | null;
    colorHex?: string;
    colorOklch?: string;
    category?: TagCategoryType;
    isMutuallyExclusiveGroup?: boolean;
    applicableScopesJson?: TagApplicableScopeType[];
    shortcutKey?: string | null;
    sortOrder?: number;
    autoRuleConfigJson?: IAutoTagRuleConfig | null;
    linkedEventKeysJson?: string[] | null;
    onApplyActionsJson?: ITagWorkflowActionItem[] | null;
    onRemoveActionsJson?: ITagWorkflowActionItem[] | null;
    executionConditionJson?: ITagWorkflowExecutionCondition | null;
  },
) => {
  return apiClient.post(`/tags/${shopId}`, payload);
};

export const updateShopTagApi = async (
  shopId: string,
  tagId: string,
  payload: {
    name?: string;
    description?: string | null;
    colorHex?: string;
    colorOklch?: string;
    category?: TagCategoryType;
    isMutuallyExclusiveGroup?: boolean;
    applicableScopesJson?: TagApplicableScopeType[];
    shortcutKey?: string | null;
    sortOrder?: number;
    autoRuleConfigJson?: IAutoTagRuleConfig | null;
    linkedEventKeysJson?: string[] | null;
    onApplyActionsJson?: ITagWorkflowActionItem[] | null;
    onRemoveActionsJson?: ITagWorkflowActionItem[] | null;
    executionConditionJson?: ITagWorkflowExecutionCondition | null;
    isActive?: boolean;
  },
) => {
  return apiClient.patch(`/tags/${shopId}/${tagId}`, payload);
};

export const deleteShopTagApi = async (shopId: string, tagId: string) => {
  return apiClient.delete(`/tags/${shopId}/${tagId}`);
};

export const getTagEventsApi = async (shopId: string) => {
  return apiClient.get(`/tags/${shopId}/events`);
};

export const createTagEventApi = async (
  shopId: string,
  payload: {
    eventKey: string;
    name: string;
    description?: string | null;
    category?: TagEventCategoryType;
    direction?: TagEventDirectionType;
    systemEventTopic?: string | null;
    matchConditionsJson?: ITagEventMatchConditions | null;
    linkedTagBindingsJson?: ITagEventTagBinding[] | null;
    outboundActionsJson?: ITagWorkflowActionItem[] | null;
    cooldownSeconds?: number;
  },
) => {
  return apiClient.post(`/tags/${shopId}/events`, payload);
};

export const updateTagEventApi = async (
  shopId: string,
  eventId: string,
  payload: {
    name?: string;
    description?: string | null;
    category?: TagEventCategoryType;
    direction?: TagEventDirectionType;
    systemEventTopic?: string | null;
    matchConditionsJson?: ITagEventMatchConditions | null;
    linkedTagBindingsJson?: ITagEventTagBinding[] | null;
    outboundActionsJson?: ITagWorkflowActionItem[] | null;
    cooldownSeconds?: number;
    isActive?: boolean;
  },
) => {
  return apiClient.patch(`/tags/${shopId}/events/${eventId}`, payload);
};

export const deleteTagEventApi = async (shopId: string, eventId: string) => {
  return apiClient.delete(`/tags/${shopId}/events/${eventId}`);
};

export const fireTagEventApi = async (
  shopId: string,
  eventId: string,
  payload: {
    conversationId: string;
    messageContent?: string;
    payload?: Record<string, unknown>;
  },
) => {
  return apiClient.post(`/tags/${shopId}/events/${eventId}/fire`, payload);
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
  params?: {
    search?: string;
    category?: string;
    channelId?: string;
    channelType?: string;
    interactionType?: QuickReplyInteractionType;
    toneStyle?: QuickReplyToneStyle;
    activeTagIds?: string[];
  },
) => {
  return apiClient.get(`/chat/quick-replies/${shopId}`, {
    params: params
      ? {
          ...params,
          activeTagIds: params.activeTagIds?.length
            ? params.activeTagIds.join(",")
            : undefined,
        }
      : undefined,
  });
};

export const createQuickReplyTemplateApi = async (
  shopId: string,
  payload: {
    shortcut: string;
    title: string;
    category?: string;
    scope?: QuickReplyScopeType;
    allowedChannelIdsJson?: string[] | null;
    usageContextJson?: IQuickReplyUsageContext | null;
    contentTemplate: string;
    messageSequenceJson?: IQuickReplySequenceStep[] | null;
    attachmentsJson?: IQuickReplyAttachmentItem[];
    productCardsJson?: IQuickReplyProductCard[];
    autoAssignTagIdsJson?: string[] | null;
    customVariableDefaultsJson?: Record<string, string> | null;
    isPinned?: boolean;
    sortOrder?: number;
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
    scope?: QuickReplyScopeType;
    allowedChannelIdsJson?: string[] | null;
    usageContextJson?: IQuickReplyUsageContext | null;
    contentTemplate?: string;
    messageSequenceJson?: IQuickReplySequenceStep[] | null;
    attachmentsJson?: IQuickReplyAttachmentItem[];
    productCardsJson?: IQuickReplyProductCard[];
    autoAssignTagIdsJson?: string[] | null;
    customVariableDefaultsJson?: Record<string, string> | null;
    isPinned?: boolean;
    sortOrder?: number;
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
    conversationId?: string;
    customerName?: string;
    salutation?: string;
    agentName?: string;
    pageName?: string;
    trackingLink?: string;
    customOverrides?: Record<string, string>;
  },
) => {
  return apiClient.post(
    `/chat/quick-replies/${shopId}/${templateId}/interpolate`,
    payload,
  );
};

export const getQuickReplyVariablesApi = async (shopId: string) => {
  return apiClient.get(`/chat/quick-replies/${shopId}/variables`);
};

export const createQuickReplyVariableApi = async (
  shopId: string,
  payload: {
    variableKey: string;
    label: string;
    description?: string | null;
    sourceType?: QuickReplyVariableSourceType;
    defaultValue?: string | null;
    sampleValue?: string | null;
    dynamicPath?: string | null;
    sortOrder?: number;
  },
) => {
  return apiClient.post(`/chat/quick-replies/${shopId}/variables`, payload);
};

export const updateQuickReplyVariableApi = async (
  shopId: string,
  variableId: string,
  payload: {
    variableKey?: string;
    label?: string;
    description?: string | null;
    sourceType?: QuickReplyVariableSourceType;
    defaultValue?: string | null;
    sampleValue?: string | null;
    dynamicPath?: string | null;
    sortOrder?: number;
    isActive?: boolean;
  },
) => {
  return apiClient.patch(
    `/chat/quick-replies/${shopId}/variables/${variableId}`,
    payload,
  );
};

export const deleteQuickReplyVariableApi = async (
  shopId: string,
  variableId: string,
) => {
  return apiClient.delete(
    `/chat/quick-replies/${shopId}/variables/${variableId}`,
  );
};

export const uploadQuickReplyMediaApi = async (files: File[]) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("files", f));
  return apiClient.post(
    `/files/upload-multiple?folder=quick-replies&optimize=true&generateThumbnail=true`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
      timeout: 120000,
    },
  );
};
