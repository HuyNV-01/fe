import { createPersistedStore } from "../create-persisted-store";
import {
  getShopTagsApi,
  createShopTagApi,
  updateShopTagApi,
  deleteShopTagApi,
  getTagEventsApi,
  createTagEventApi,
  updateTagEventApi,
  deleteTagEventApi,
  fireTagEventApi,
  toggleConversationTagApi,
  bulkAssignConversationTagsApi,
  toggleMessageBookmarkTagApi,
  getBookmarkedMessagesApi,
  getQuickReplyTemplatesApi,
  createQuickReplyTemplateApi,
  updateQuickReplyTemplateApi,
  deleteQuickReplyTemplateApi,
  interpolateQuickReplyTemplateApi,
  getQuickReplyVariablesApi,
  createQuickReplyVariableApi,
  updateQuickReplyVariableApi,
  deleteQuickReplyVariableApi,
  uploadQuickReplyMediaApi,
} from "./api";
import type {
  IAutoTagRuleConfig,
  ICustomTag,
  IMessageBookmarkItem,
  IQuickReplyAttachmentItem,
  IQuickReplyProductCard,
  IQuickReplySequenceStep,
  IQuickReplyTemplate,
  IQuickReplyUsageContext,
  IQuickReplyVariablesCatalog,
  ITagEventDefinition,
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
import { useChatStore } from "../chat/use-chat-store";
import { tStore } from "@/i18n/translate-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface TagStoreState {
  tags: ICustomTag[];
  tagEvents: ITagEventDefinition[];
  bookmarkedMessagesByConv: Record<string, IMessageBookmarkItem[]>;
  quickReplyTemplates: IQuickReplyTemplate[];
  quickReplyVariablesCatalog: IQuickReplyVariablesCatalog | null;
  isLoadingTags: boolean;
  isLoadingTagEvents: boolean;
  isLoadingBookmarks: boolean;
  isLoadingQuickReplies: boolean;
  isLoadingQuickReplyVariables: boolean;

  fetchShopTags: (shopId: string) => Promise<void>;
  createTag: (
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
  ) => Promise<ICustomTag | null>;
  updateTag: (
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
  ) => Promise<boolean>;
  deleteTag: (shopId: string, tagId: string) => Promise<boolean>;

  fetchTagEvents: (shopId: string) => Promise<void>;
  createTagEvent: (
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
  ) => Promise<ITagEventDefinition | null>;
  updateTagEvent: (
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
  ) => Promise<boolean>;
  deleteTagEvent: (shopId: string, eventId: string) => Promise<boolean>;
  fireTagEvent: (
    shopId: string,
    eventId: string,
    payload: {
      conversationId: string;
      messageContent?: string;
      payload?: Record<string, unknown>;
    },
  ) => Promise<boolean>;

  toggleConversationTag: (payload: {
    shopId: string;
    conversationId: string;
    tagId: string;
    forceState?: "ADD" | "REMOVE";
  }) => Promise<string[]>;
  bulkAssignConversationTags: (payload: {
    shopId: string;
    conversationIds: string[];
    addTagIds?: string[];
    removeTagIds?: string[];
  }) => Promise<boolean>;

  toggleMessageBookmarkTag: (payload: {
    shopId: string;
    conversationId: string;
    messageId: string;
    tagId: string;
    noteText?: string;
  }) => Promise<void>;
  fetchBookmarkedMessages: (
    shopId: string,
    conversationId?: string,
    tagId?: string,
  ) => Promise<void>;

  fetchQuickReplies: (
    shopId: string,
    params?:
      | string
      | {
          search?: string;
          category?: string;
          channelId?: string;
          channelType?: string;
          interactionType?: QuickReplyInteractionType;
          toneStyle?: QuickReplyToneStyle;
          activeTagIds?: string[];
        },
  ) => Promise<void>;
  createQuickReply: (
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
  ) => Promise<boolean>;
  updateQuickReply: (
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
  ) => Promise<boolean>;
  deleteQuickReply: (shopId: string, templateId: string) => Promise<boolean>;
  interpolateQuickReply: (
    shopId: string,
    templateId: string,
    vars: {
      conversationId?: string;
      customerName?: string;
      salutation?: string;
      agentName?: string;
      pageName?: string;
      trackingLink?: string;
      customOverrides?: Record<string, string>;
    },
  ) => Promise<{
    interpolatedContent: string;
    interpolatedSequence?: Array<{
      order: number;
      content: string;
      delayMs: number;
      attachments?: IQuickReplyAttachmentItem[];
    }>;
    attachments?: IQuickReplyAttachmentItem[];
    autoAssignTagIds?: string[];
    resolvedVariables?: Record<string, string>;
    template: IQuickReplyTemplate;
  } | null>;

  fetchQuickReplyVariables: (shopId: string) => Promise<void>;
  createQuickReplyVariable: (
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
  ) => Promise<boolean>;
  updateQuickReplyVariable: (
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
  ) => Promise<boolean>;
  deleteQuickReplyVariable: (
    shopId: string,
    variableId: string,
  ) => Promise<boolean>;
  uploadQuickReplyMedia: (
    files: File[],
  ) => Promise<IQuickReplyAttachmentItem[]>;

  handleRealtimeConversationTagsUpdated: (payload: {
    conversationId: string;
    activeTagIds: string[];
  }) => void;
  handleRealtimeMessageTagged: (payload: {
    action: "ADDED" | "REMOVED";
    conversationId: string;
    messageId: string;
    tagId: string;
    messageTagIds: string[];
  }) => void;
}

export const useTagStore = createPersistedStore<TagStoreState>(
  (set, get) => ({
    tags: [],
    tagEvents: [],
    bookmarkedMessagesByConv: {},
    quickReplyTemplates: [],
    quickReplyVariablesCatalog: null,
    isLoadingTags: false,
    isLoadingTagEvents: false,
    isLoadingBookmarks: false,
    isLoadingQuickReplies: false,
    isLoadingQuickReplyVariables: false,

    fetchShopTags: async (shopId) => {
      if (!shopId) return;
      set({ isLoadingTags: true });
      try {
        const res: any = await getShopTagsApi(shopId);
        const list = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        set({ tags: list, isLoadingTags: false });
      } catch {
        set({ isLoadingTags: false });
      }
    },

    createTag: async (shopId, payload) => {
      try {
        const res: any = await createShopTagApi(shopId, payload);
        const created: ICustomTag = res?.data ?? res;
        await get().fetchShopTags(shopId);
        showSuccessToast(tStore("TaggingSystem.toast.createdSuccess"));
        return created;
      } catch {
        showErrorToast(tStore("TaggingSystem.toast.actionFailed"));
        return null;
      }
    },

    updateTag: async (shopId, tagId, payload) => {
      try {
        await updateShopTagApi(shopId, tagId, payload);
        await get().fetchShopTags(shopId);
        showSuccessToast(tStore("TaggingSystem.toast.updatedSuccess"));
        return true;
      } catch {
        showErrorToast(tStore("TaggingSystem.toast.actionFailed"));
        return false;
      }
    },

    deleteTag: async (shopId, tagId) => {
      try {
        await deleteShopTagApi(shopId, tagId);
        set((state) => {
          state.tags = state.tags.filter((t) => t.id !== tagId);
        });
        showSuccessToast(tStore("TaggingSystem.toast.deletedSuccess"));
        return true;
      } catch {
        showErrorToast(tStore("TaggingSystem.toast.actionFailed"));
        return false;
      }
    },

    fetchTagEvents: async (shopId) => {
      if (!shopId) return;
      set({ isLoadingTagEvents: true });
      try {
        const res: any = await getTagEventsApi(shopId);
        const list: ITagEventDefinition[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        set({ tagEvents: list, isLoadingTagEvents: false });
      } catch {
        set({ isLoadingTagEvents: false });
      }
    },

    createTagEvent: async (shopId, payload) => {
      try {
        const res: any = await createTagEventApi(shopId, payload);
        const created: ITagEventDefinition = res?.data ?? res;
        await get().fetchTagEvents(shopId);
        showSuccessToast(tStore("TaggingSystem.events.toast.createdSuccess"));
        return created;
      } catch {
        showErrorToast(tStore("TaggingSystem.events.toast.actionFailed"));
        return null;
      }
    },

    updateTagEvent: async (shopId, eventId, payload) => {
      try {
        await updateTagEventApi(shopId, eventId, payload);
        await get().fetchTagEvents(shopId);
        showSuccessToast(tStore("TaggingSystem.events.toast.updatedSuccess"));
        return true;
      } catch {
        showErrorToast(tStore("TaggingSystem.events.toast.actionFailed"));
        return false;
      }
    },

    deleteTagEvent: async (shopId, eventId) => {
      try {
        await deleteTagEventApi(shopId, eventId);
        set((state) => {
          state.tagEvents = state.tagEvents.filter((e) => e.id !== eventId);
        });
        showSuccessToast(tStore("TaggingSystem.events.toast.deletedSuccess"));
        return true;
      } catch {
        showErrorToast(tStore("TaggingSystem.events.toast.actionFailed"));
        return false;
      }
    },

    fireTagEvent: async (shopId, eventId, payload) => {
      try {
        await fireTagEventApi(shopId, eventId, payload);
        await get().fetchTagEvents(shopId);
        showSuccessToast(tStore("TaggingSystem.events.toast.firedSuccess"));
        return true;
      } catch {
        showErrorToast(tStore("TaggingSystem.events.toast.actionFailed"));
        return false;
      }
    },

    toggleConversationTag: async ({
      shopId,
      conversationId,
      tagId,
      forceState,
    }) => {
      try {
        const res: any = await toggleConversationTagApi({
          shopId,
          conversationId,
          tagId,
          forceState,
        });
        const data = res?.data ?? res;
        const activeTagIds: string[] = data?.activeTagIds || [];
        get().handleRealtimeConversationTagsUpdated({
          conversationId,
          activeTagIds,
        });
        return activeTagIds;
      } catch {
        showErrorToast(tStore("TaggingSystem.toast.actionFailed"));
        return [];
      }
    },

    bulkAssignConversationTags: async ({
      shopId,
      conversationIds,
      addTagIds,
      removeTagIds,
    }) => {
      try {
        const res: any = await bulkAssignConversationTagsApi({
          shopId,
          conversationIds,
          addTagIds,
          removeTagIds,
        });
        const data = res?.data ?? res;
        for (const item of data?.results || []) {
          get().handleRealtimeConversationTagsUpdated({
            conversationId: item.conversationId,
            activeTagIds: item.activeTagIds,
          });
        }
        showSuccessToast(
          tStore("TaggingSystem.toast.bulkAssignedSuccess", {
            count: conversationIds.length,
          }),
        );
        return true;
      } catch {
        showErrorToast(tStore("TaggingSystem.toast.actionFailed"));
        return false;
      }
    },

    toggleMessageBookmarkTag: async ({
      shopId,
      conversationId,
      messageId,
      tagId,
      noteText,
    }) => {
      try {
        const res: any = await toggleMessageBookmarkTagApi({
          shopId,
          conversationId,
          messageId,
          tagId,
          noteText,
        });
        const data = res?.data ?? res;
        get().handleRealtimeMessageTagged({
          action: data.action,
          conversationId,
          messageId,
          tagId,
          messageTagIds: data.messageTagIds || [],
        });
        await get().fetchBookmarkedMessages(shopId, conversationId);
      } catch {
        showErrorToast(tStore("TaggingSystem.toast.actionFailed"));
      }
    },

    fetchBookmarkedMessages: async (shopId, conversationId, tagId) => {
      if (!shopId) return;
      set({ isLoadingBookmarks: true });
      try {
        const res: any = await getBookmarkedMessagesApi(shopId, {
          conversationId,
          tagId,
        });
        const list: IMessageBookmarkItem[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        const key = conversationId || "ALL_SHOP";
        set((state) => {
          state.bookmarkedMessagesByConv[key] = list;
          state.isLoadingBookmarks = false;
        });
      } catch {
        set({ isLoadingBookmarks: false });
      }
    },

    fetchQuickReplies: async (shopId, params) => {
      if (!shopId) return;
      set({ isLoadingQuickReplies: true });
      try {
        const normalizedParams =
          typeof params === "string" ? { search: params } : params;
        const res: any = await getQuickReplyTemplatesApi(
          shopId,
          normalizedParams,
        );
        const list: IQuickReplyTemplate[] = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        set({ quickReplyTemplates: list, isLoadingQuickReplies: false });
      } catch {
        set({ isLoadingQuickReplies: false });
      }
    },

    createQuickReply: async (shopId, payload) => {
      try {
        await createQuickReplyTemplateApi(shopId, payload);
        await get().fetchQuickReplies(shopId);
        showSuccessToast(tStore("QuickReplies.toast.createdSuccess"));
        return true;
      } catch {
        showErrorToast(tStore("QuickReplies.toast.actionFailed"));
        return false;
      }
    },

    updateQuickReply: async (shopId, templateId, payload) => {
      try {
        await updateQuickReplyTemplateApi(shopId, templateId, payload);
        await get().fetchQuickReplies(shopId);
        showSuccessToast(tStore("QuickReplies.toast.updatedSuccess"));
        return true;
      } catch {
        showErrorToast(tStore("QuickReplies.toast.actionFailed"));
        return false;
      }
    },

    deleteQuickReply: async (shopId, templateId) => {
      try {
        await deleteQuickReplyTemplateApi(shopId, templateId);
        set((state) => {
          state.quickReplyTemplates = state.quickReplyTemplates.filter(
            (q) => q.id !== templateId,
          );
        });
        showSuccessToast(tStore("QuickReplies.toast.deletedSuccess"));
        return true;
      } catch {
        showErrorToast(tStore("QuickReplies.toast.actionFailed"));
        return false;
      }
    },

    interpolateQuickReply: async (shopId, templateId, vars) => {
      try {
        const res: any = await interpolateQuickReplyTemplateApi(
          shopId,
          templateId,
          vars,
        );
        return res?.data ?? res;
      } catch {
        return null;
      }
    },

    fetchQuickReplyVariables: async (shopId) => {
      if (!shopId) return;
      set({ isLoadingQuickReplyVariables: true });
      try {
        const res: any = await getQuickReplyVariablesApi(shopId);
        const data: IQuickReplyVariablesCatalog = res?.data ?? res;
        set({
          quickReplyVariablesCatalog: data,
          isLoadingQuickReplyVariables: false,
        });
      } catch {
        set({ isLoadingQuickReplyVariables: false });
      }
    },

    createQuickReplyVariable: async (shopId, payload) => {
      try {
        await createQuickReplyVariableApi(shopId, payload);
        await get().fetchQuickReplyVariables(shopId);
        showSuccessToast(tStore("QuickReplies.variables.toast.createdSuccess"));
        return true;
      } catch {
        showErrorToast(tStore("QuickReplies.variables.toast.actionFailed"));
        return false;
      }
    },

    updateQuickReplyVariable: async (shopId, variableId, payload) => {
      try {
        await updateQuickReplyVariableApi(shopId, variableId, payload);
        await get().fetchQuickReplyVariables(shopId);
        showSuccessToast(tStore("QuickReplies.variables.toast.updatedSuccess"));
        return true;
      } catch {
        showErrorToast(tStore("QuickReplies.variables.toast.actionFailed"));
        return false;
      }
    },

    deleteQuickReplyVariable: async (shopId, variableId) => {
      try {
        await deleteQuickReplyVariableApi(shopId, variableId);
        await get().fetchQuickReplyVariables(shopId);
        showSuccessToast(tStore("QuickReplies.variables.toast.deletedSuccess"));
        return true;
      } catch {
        showErrorToast(tStore("QuickReplies.variables.toast.actionFailed"));
        return false;
      }
    },

    uploadQuickReplyMedia: async (files) => {
      if (!files.length) return [];
      try {
        const res: any = await uploadQuickReplyMediaApi(files);
        const uploadedList = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res)
            ? res
            : [];
        return uploadedList.map((item: any): IQuickReplyAttachmentItem => {
          const mime = String(item.mimeType || item.mimetype || "");
          const isVideo = mime.startsWith("video/");
          const isImage = mime.startsWith("image/");
          return {
            fileId: item.id || item.fileId,
            url: item.url || item.publicUrl || item.downloadUrl || "",
            fileName: item.originalName || item.fileName || "media",
            mimeType: mime,
            mediaType: isVideo ? "VIDEO" : isImage ? "IMAGE" : "FILE",
            thumbnailUrl: item.thumbnailUrl || null,
            sizeBytes: item.size ? Number(item.size) : null,
          };
        });
      } catch {
        showErrorToast(tStore("QuickReplies.toast.uploadFailed"));
        return [];
      }
    },

    handleRealtimeConversationTagsUpdated: ({
      conversationId,
      activeTagIds,
    }) => {
      useChatStore
        .getState()
        .syncConversationTagsOptimistic(conversationId, activeTagIds);
    },

    handleRealtimeMessageTagged: ({
      conversationId,
      messageId,
      messageTagIds,
    }) => {
      useChatStore
        .getState()
        .syncMessageTagsOptimistic(conversationId, messageId, messageTagIds);
    },
  }),
  "seller-os-tags-store",
);
