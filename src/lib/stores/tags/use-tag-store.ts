import { createPersistedStore } from "../create-persisted-store";
import {
  getShopTagsApi,
  createShopTagApi,
  updateShopTagApi,
  deleteShopTagApi,
  toggleConversationTagApi,
  bulkAssignConversationTagsApi,
  toggleMessageBookmarkTagApi,
  getBookmarkedMessagesApi,
  getQuickReplyTemplatesApi,
  createQuickReplyTemplateApi,
  updateQuickReplyTemplateApi,
  deleteQuickReplyTemplateApi,
  interpolateQuickReplyTemplateApi,
} from "./api";
import type {
  IAutoTagRuleConfig,
  ICustomTag,
  IMessageBookmarkItem,
  IQuickReplyProductCard,
  IQuickReplyTemplate,
  TagApplicableScopeType,
  TagCategoryType,
} from "@/types/chat";
import { useChatStore } from "../chat/use-chat-store";
import { tStore } from "@/i18n/translate-store";
import { showErrorToast, showSuccessToast } from "@/utils/toast";

interface TagStoreState {
  tags: ICustomTag[];
  bookmarkedMessagesByConv: Record<string, IMessageBookmarkItem[]>;
  quickReplyTemplates: IQuickReplyTemplate[];
  isLoadingTags: boolean;
  isLoadingBookmarks: boolean;
  isLoadingQuickReplies: boolean;

  fetchShopTags: (shopId: string) => Promise<void>;
  createTag: (
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
  ) => Promise<ICustomTag | null>;
  updateTag: (
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
  ) => Promise<boolean>;
  deleteTag: (shopId: string, tagId: string) => Promise<boolean>;

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

  fetchQuickReplies: (shopId: string, search?: string) => Promise<void>;
  createQuickReply: (
    shopId: string,
    payload: {
      shortcut: string;
      title: string;
      category?: string;
      contentTemplate: string;
      productCardsJson?: IQuickReplyProductCard[];
    },
  ) => Promise<boolean>;
  updateQuickReply: (
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
  ) => Promise<boolean>;
  deleteQuickReply: (shopId: string, templateId: string) => Promise<boolean>;
  interpolateQuickReply: (
    shopId: string,
    templateId: string,
    vars: {
      customerName?: string;
      salutation?: string;
      agentName?: string;
      pageName?: string;
      trackingLink?: string;
    },
  ) => Promise<{
    interpolatedContent: string;
    template: IQuickReplyTemplate;
  } | null>;

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
    bookmarkedMessagesByConv: {},
    quickReplyTemplates: [],
    isLoadingTags: false,
    isLoadingBookmarks: false,
    isLoadingQuickReplies: false,

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

    fetchQuickReplies: async (shopId, search) => {
      if (!shopId) return;
      set({ isLoadingQuickReplies: true });
      try {
        const res: any = await getQuickReplyTemplatesApi(shopId, search);
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
