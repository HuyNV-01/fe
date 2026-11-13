"use client";

import { useEffect } from "react";
import { socketService } from "@/services/socket/socket-client";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import { useCrmStore } from "@/lib/stores/crm/use-crm-store";
import { SocketNamespaceEnum } from "@/common/enum";
import { SOCKET_EVENTS } from "@/constant/socket-events";
import { tStore } from "@/i18n/translate-store";
import {
  showInfoToast,
  showSuccessToast,
  showWarningToast,
} from "@/utils/toast";
import { playNotificationSound } from "@/utils/sound";
import type {
  IAccountabilityMilestone,
  ICollisionLockState,
  IMessage,
  IMessageTranslation,
  MessageStatus,
} from "@/types/chat";
import type {
  AdsConversionEventNameType,
  AdsConversionPlatformType,
  ICustomerProfile,
} from "@/types/crm";

export const useOmnichannelSocket = () => {
  const currentUser = useAuthStore((s) => s.currentAccount);
  const isAuthenticated = !!currentUser?.accessToken;

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const fetchShopChannels = useChannelWorkspaceStore(
    (s) => s.fetchShopChannels,
  );
  const fetchSaasAppProfiles = useChannelWorkspaceStore(
    (s) => s.fetchSaasAppProfiles,
  );
  const fetchWebhookLogs = useChannelWorkspaceStore((s) => s.fetchWebhookLogs);
  const fetchMergedConversations = useChannelWorkspaceStore(
    (s) => s.fetchMergedConversations,
  );
  const fetchInbox = useChatStore((s) => s.fetchInbox);
  const setCollisionLockForConv = useChatStore(
    (s) => s.setCollisionLockForConv,
  );
  const handleGhostedAlert = useChatStore((s) => s.handleGhostedAlert);
  const handleSnoozeWakeup = useChatStore((s) => s.handleSnoozeWakeup);
  const handleConversationTransferred = useChatStore(
    (s) => s.handleConversationTransferred,
  );
  const handleMessageTranslated = useChatStore(
    (s) => s.handleMessageTranslated,
  );
  const handleRealtimeCommentVisibilityUpdated = useChatStore(
    (s) => s.handleRealtimeCommentVisibilityUpdated,
  );
  const handleRealtimeCommentLikeUpdated = useChatStore(
    (s) => s.handleRealtimeCommentLikeUpdated,
  );
  const handleRealtimeCommentPrivateReplySent = useChatStore(
    (s) => s.handleRealtimeCommentPrivateReplySent,
  );
  const handleRealtimeCommentDeletedOnPlatform = useChatStore(
    (s) => s.handleRealtimeCommentDeletedOnPlatform,
  );
  const handleBuyerSeenSynced = useChatStore((s) => s.handleBuyerSeenSynced);
  const handleNerEntitiesDetected = useChatStore(
    (s) => s.handleNerEntitiesDetected,
  );
  const handleReadMessage = useChatStore((s) => s.handleReadMessage);
  const updateMessageStatusBatch = useChatStore(
    (s) => s.updateMessageStatusBatch,
  );
  const handleRealtimeConversationTagsUpdated = useTagStore(
    (s) => s.handleRealtimeConversationTagsUpdated,
  );
  const handleRealtimeMessageTagged = useTagStore(
    (s) => s.handleRealtimeMessageTagged,
  );
  const fetchShopTags = useTagStore((s) => s.fetchShopTags);
  const fetchQuickReplies = useTagStore((s) => s.fetchQuickReplies);

  const fetchAdministrativeTree = useCrmStore((s) => s.fetchAdministrativeTree);
  const handleRealtimeCrmProfileUpdated = useCrmStore(
    (s) => s.handleRealtimeCrmProfileUpdated,
  );
  const handleRealtimeCapiEventDispatched = useCrmStore(
    (s) => s.handleRealtimeCapiEventDispatched,
  );

  useEffect(() => {
    if (activeShopId) {
      fetchShopTags(activeShopId);
      fetchQuickReplies(activeShopId);
      fetchAdministrativeTree(activeShopId);
    }
  }, [activeShopId, fetchShopTags, fetchQuickReplies, fetchAdministrativeTree]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser?.user?.id) return;

    const cleanConversationAssigned = socketService.on<{
      conversationId: string;
      conversationName?: string;
      lastMessage?: string;
      shopId: string;
      channelIntegrationId: string;
      pageShortCode?: string;
      slaDeadlineAt: string;
      slaResponseSeconds?: number;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.CONVERSATION_ASSIGNED,
      async (payload) => {
        if (!payload) return;
        playNotificationSound();
        showInfoToast(
          tStore("OmnichannelInbox.realtimeToast.newAssignedDesc", {
            customerName: payload.conversationName || "Khách hàng",
            preview: payload.lastMessage || "Tin nhắn mới",
            slaSeconds: payload.slaResponseSeconds || 180,
          }),
          {
            title: tStore("OmnichannelInbox.realtimeToast.newAssignedTitle", {
              pageShortCode: payload.pageShortCode || "Kênh bán",
            }),
          },
        );
        fetchInbox({ page: 1 });
        if (payload.shopId) {
          fetchShopChannels(payload.shopId);
          fetchMergedConversations(payload.shopId);
        }
      },
    );

    const cleanConversationReclaimed = socketService.on<{
      conversationId: string;
      conversationName?: string;
      shopId: string;
      previousAgentId: string;
      reason: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.CONVERSATION_RECLAIMED,
      async (payload) => {
        if (!payload) return;
        showWarningToast(
          tStore("OmnichannelInbox.realtimeToast.slaReclaimedDesc", {
            customerName: payload.conversationName || "Khách hàng",
          }),
          {
            title: tStore("OmnichannelInbox.realtimeToast.slaReclaimedTitle"),
          },
        );
        fetchInbox({ page: 1 });
        if (payload.shopId) {
          fetchShopChannels(payload.shopId);
          fetchMergedConversations(payload.shopId);
        }
      },
    );

    const cleanTagsUpdated = socketService.on<{
      conversationId: string;
      activeTagIds: string[];
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.TAGS_UPDATED,
      (payload) => {
        if (!payload) return;
        handleRealtimeConversationTagsUpdated(payload);
      },
    );

    const cleanMessageTagged = socketService.on<{
      action: "ADDED" | "REMOVED";
      conversationId: string;
      messageId: string;
      tagId: string;
      messageTagIds: string[];
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.MESSAGE_TAGGED,
      (payload) => {
        if (!payload) return;
        handleRealtimeMessageTagged(payload);
      },
    );

    const cleanCollisionLock = socketService.on<ICollisionLockState>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.AGENT_COLLISION_LOCK,
      (payload) => {
        if (!payload?.conversationId) return;
        setCollisionLockForConv(payload.conversationId, payload);
      },
    );

    const cleanCollisionUnlock = socketService.on<{
      conversationId: string;
      releasedByUserId: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.AGENT_COLLISION_UNLOCK,
      (payload) => {
        if (!payload?.conversationId) return;
        setCollisionLockForConv(payload.conversationId, null);
      },
    );

    const cleanGhostedAlert = socketService.on<{
      conversationId: string;
      customerName?: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.GHOSTED_ALERT,
      (payload) => {
        if (!payload?.conversationId) return;
        playNotificationSound();
        handleGhostedAlert(payload);
        showWarningToast(
          tStore("OmnichannelInbox.realtimeToast.ghostedAlertDesc", {
            customerName: payload.customerName || "Khách hàng",
          }),
          {
            title: tStore("OmnichannelInbox.realtimeToast.ghostedAlertTitle"),
          },
        );
      },
    );

    const cleanSnoozeWakeup = socketService.on<{
      conversationId: string;
      customerName?: string;
      snoozeNote?: string | null;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.SNOOZE_WAKEUP,
      (payload) => {
        if (!payload?.conversationId) return;
        playNotificationSound();
        handleSnoozeWakeup(payload);
        showInfoToast(
          tStore("OmnichannelInbox.realtimeToast.snoozeWakeupDesc", {
            customerName: payload.customerName || "Khách hàng",
            note: payload.snoozeNote || "",
          }),
          {
            title: tStore("OmnichannelInbox.realtimeToast.snoozeWakeupTitle"),
          },
        );
        fetchInbox({ page: 1 });
      },
    );

    const cleanConversationTransferred = socketService.on<{
      conversationId: string;
      fromAgentId: string;
      toAgentId: string;
      timeline?: IAccountabilityMilestone[];
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.CONVERSATION_TRANSFERRED,
      (payload) => {
        if (!payload?.conversationId) return;
        handleConversationTransferred(payload);
      },
    );

    const cleanMessageTranslated = socketService.on<{
      conversationId: string;
      messageId: string;
      translation: IMessageTranslation;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.MESSAGE_TRANSLATED,
      (payload) => {
        if (!payload?.conversationId || !payload?.messageId) return;
        handleMessageTranslated(payload);
      },
    );

    const cleanCommentVisibilityUpdated = socketService.on<{
      conversationId: string;
      messageId: string;
      isHiddenOnPlatform: boolean;
      hiddenByAgentId?: string | null;
      hiddenAt?: string | null;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.COMMENT_VISIBILITY_UPDATED,
      (payload) => {
        if (!payload?.conversationId || !payload?.messageId) return;
        handleRealtimeCommentVisibilityUpdated(payload);
      },
    );

    const cleanCommentLikeUpdated = socketService.on<{
      conversationId: string;
      messageId: string;
      isLikedByPage: boolean;
      likedByAgentId?: string | null;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.COMMENT_LIKE_UPDATED,
      (payload) => {
        if (!payload?.conversationId || !payload?.messageId) return;
        handleRealtimeCommentLikeUpdated(payload);
      },
    );

    const cleanCommentPrivateReplySent = socketService.on<{
      conversationId: string;
      commentMessageId: string;
      linkedInboxConversationId: string;
      privateReplySentAt: string;
      privateReplyByAgentId?: string | null;
      isHiddenOnPlatform?: boolean;
      isLikedByPage?: boolean;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.COMMENT_PRIVATE_REPLY_SENT,
      (payload) => {
        if (!payload?.conversationId || !payload?.commentMessageId) return;
        handleRealtimeCommentPrivateReplySent(payload);
      },
    );

    const cleanCommentDeletedOnPlatform = socketService.on<{
      conversationId: string;
      messageId: string;
      isDeletedOnPlatform: boolean;
      deletedByActor?: "CUSTOMER" | "AGENT";
      deletedByAgentId?: string | null;
      deletedOnPlatformAt?: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.COMMENT_DELETED_ON_PLATFORM,
      (payload) => {
        if (!payload?.conversationId || !payload?.messageId) return;
        handleRealtimeCommentDeletedOnPlatform(payload);
      },
    );

    const cleanOutboundDeliveryStatus = socketService.on<{
      conversationId: string;
      messageId?: string;
      platformDeliveryStatus?: "DISPATCHED" | "SIMULATED_SANDBOX" | "FAILED";
      platformExternalId?: string | null;
      customerReceiptStatus?: MessageStatus;
      deliveredMessageIds?: string[];
      buyerReaderUser?: {
        id: string;
        name: string;
        avatar: string | null;
      };
      timestamp?: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.OUTBOUND_DELIVERY_STATUS,
      (payload) => {
        if (!payload?.conversationId) return;

        if (payload.customerReceiptStatus === "read") {
          handleReadMessage({
            conversationId: payload.conversationId,
            userId:
              payload.buyerReaderUser?.id ||
              `customer:${payload.conversationId}`,
            user: payload.buyerReaderUser
              ? {
                  id: payload.buyerReaderUser.id,
                  name: payload.buyerReaderUser.name,
                  email: "",
                  avatar: payload.buyerReaderUser.avatar || undefined,
                }
              : undefined,
            lastReadAt: payload.timestamp || new Date().toISOString(),
            status: "read",
            isBuyerReceipt: true,
          });
        } else if (
          payload.customerReceiptStatus === "delivered" &&
          payload.deliveredMessageIds &&
          payload.deliveredMessageIds.length > 0
        ) {
          updateMessageStatusBatch({
            conversationId: payload.conversationId,
            messageIds: payload.deliveredMessageIds,
            status: "delivered",
          });
        }

        if (!payload.messageId) return;
        useChatStore.setState((state) => {
          const msgs = state.messages[payload.conversationId];
          if (!msgs) return;
          const target = msgs.find((m) => m.id === payload.messageId);
          if (target) {
            target.metadata = {
              ...(target.metadata || {}),
              platformDeliveryStatus:
                payload.platformDeliveryStatus || "DISPATCHED",
              platformExternalId:
                payload.platformExternalId ??
                target.metadata?.platformExternalId,
            };
          }
        });
      },
    );

    const cleanBuyerSeenSynced = socketService.on<{
      conversationId: string;
      senderAction: "mark_seen" | "typing_on" | "typing_off";
      platformDeliveryStatus?: "DISPATCHED" | "SIMULATED_SANDBOX" | "FAILED";
      viewerUser?: { id: string; name: string; avatar: string | null } | null;
      syncedAt: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.BUYER_SEEN_SYNCED,
      (payload) => {
        if (!payload?.conversationId) return;
        handleBuyerSeenSynced(payload);
      },
    );

    const cleanNerEntitiesDetected = socketService.on<{
      shopId: string;
      conversationId: string;
      messageId: string;
      extractedEntities: IMessage["extractedEntitiesJson"];
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.NER_ENTITIES_DETECTED,
      (payload) => {
        if (!payload?.conversationId || !payload?.messageId) return;
        handleNerEntitiesDetected(payload);
      },
    );

    const cleanCrmProfileUpdated = socketService.on<{
      conversationId: string;
      customer: ICustomerProfile;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.CRM_PROFILE_UPDATED,
      (payload) => {
        if (!payload?.customer?.id) return;
        handleRealtimeCrmProfileUpdated(payload);
      },
    );

    const cleanCapiEventDispatched = socketService.on<{
      conversationId: string;
      logId: string;
      platform: AdsConversionPlatformType;
      eventName: AdsConversionEventNameType;
      eventId: string;
      ctwaClickId?: string | null;
      sourceAdId?: string | null;
      valueAmount: number;
      currency: string;
      syncStatus:
        | "DISPATCHED_LIVE"
        | "SIMULATED_SANDBOX"
        | "QUEUED_RETRY"
        | "FAILED";
      syncedAt?: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.CAPI_EVENT_DISPATCHED,
      (payload) => {
        if (!payload?.logId) return;
        handleRealtimeCapiEventDispatched(payload);
      },
    );

    const cleanSecurityAuditAlert = socketService.on<{
      shopId: string;
      actorUserId: string;
      actorName: string;
      usedCount: number;
      hourlyLimit: number;
      customerId: string;
      timestamp: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.OMNICHANNEL_INBOX.SECURITY_AUDIT_ALERT,
      (payload) => {
        if (!payload) return;
        playNotificationSound();
        showWarningToast(
          tStore("Crm360.toasts.securityUnmaskAlertDesc", {
            actorName: payload.actorName,
            usedCount: payload.usedCount,
            hourlyLimit: payload.hourlyLimit,
          }),
          {
            title: tStore("Crm360.toasts.securityUnmaskAlertTitle"),
          },
        );
      },
    );

    const cleanChannelIntegrationUpdated = socketService.on<{
      shopId: string;
      action: string;
      channelId: string;
      pageName?: string;
      pageShortCode?: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHANNELS.INTEGRATION_UPDATED,
      async (payload) => {
        const targetShopId = payload?.shopId || activeShopId;
        if (targetShopId) {
          fetchShopChannels(targetShopId);
          fetchMergedConversations(targetShopId);
          if (payload?.action === "SAAS_PROFILE_CREATED") {
            fetchSaasAppProfiles(targetShopId);
          }
        }
        if (
          payload?.action === "WEBHOOK_INBOUND" ||
          payload?.action === "AGENT_REPLIED"
        ) {
          fetchInbox({ page: 1 });
        }
      },
    );

    const cleanChannelIntegrationRemoved = socketService.on<{
      shopId: string;
      channelId: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHANNELS.INTEGRATION_REMOVED,
      async (payload) => {
        const targetShopId = payload?.shopId || activeShopId;
        if (targetShopId) {
          fetchShopChannels(targetShopId);
          fetchMergedConversations(targetShopId);
        }
      },
    );

    const cleanTokenHealthChecked = socketService.on<{
      shopId: string;
      totalChecked: number;
      healthyCount: number;
      warningCount: number;
      expiredCount: number;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHANNELS.TOKEN_HEALTH_CHECKED,
      async (payload) => {
        const targetShopId = payload?.shopId || activeShopId;
        if (targetShopId) {
          fetchShopChannels(targetShopId);
        }
      },
    );

    const cleanWebhookLogUpdated = socketService.on<{
      shopId: string;
      logId: string;
      processingStatus: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHANNELS.WEBHOOK_LOG_UPDATED,
      async (payload) => {
        const targetShopId = payload?.shopId || activeShopId;
        if (targetShopId) {
          fetchWebhookLogs(targetShopId);
          fetchShopChannels(targetShopId);
        }
      },
    );

    const cleanMarketplaceOrderSynced = socketService.on<{
      shopId: string;
      channelIntegrationId: string;
      pageShortCode: string;
      orderSn: string;
      buyerUsername: string;
      totalAmount: number;
      reservedStockItemsCount: number;
      conversationId: string;
    }>(
      SocketNamespaceEnum.CHAT,
      SOCKET_EVENTS.CHANNELS.MARKETPLACE_ORDER_SYNCED,
      async (payload) => {
        if (!payload) return;
        playNotificationSound();
        showSuccessToast(
          tStore("OmnichannelInbox.realtimeToast.marketplaceOrderDesc", {
            buyerUsername: payload.buyerUsername,
            totalFormatted: `${Number(payload.totalAmount || 0).toLocaleString("vi-VN")}đ`,
            reservedQty: payload.reservedStockItemsCount || 1,
          }),
          {
            title: tStore(
              "OmnichannelInbox.realtimeToast.marketplaceOrderTitle",
              {
                orderSn: payload.orderSn,
                pageShortCode: payload.pageShortCode,
              },
            ),
          },
        );
        fetchInbox({ page: 1 });
        if (payload.shopId) {
          fetchShopChannels(payload.shopId);
          fetchMergedConversations(payload.shopId);
        }
      },
    );

    return () => {
      cleanConversationAssigned();
      cleanConversationReclaimed();
      cleanTagsUpdated();
      cleanMessageTagged();
      cleanCollisionLock();
      cleanCollisionUnlock();
      cleanGhostedAlert();
      cleanSnoozeWakeup();
      cleanConversationTransferred();
      cleanMessageTranslated();
      cleanCommentVisibilityUpdated();
      cleanCommentLikeUpdated();
      cleanCommentPrivateReplySent();
      cleanCommentDeletedOnPlatform();
      cleanOutboundDeliveryStatus();
      cleanBuyerSeenSynced();
      cleanNerEntitiesDetected();
      cleanCrmProfileUpdated();
      cleanCapiEventDispatched();
      cleanSecurityAuditAlert();
      cleanChannelIntegrationUpdated();
      cleanChannelIntegrationRemoved();
      cleanTokenHealthChecked();
      cleanWebhookLogUpdated();
      cleanMarketplaceOrderSynced();
    };
  }, [
    isAuthenticated,
    currentUser?.user?.id,
    activeShopId,
    fetchShopChannels,
    fetchSaasAppProfiles,
    fetchWebhookLogs,
    fetchMergedConversations,
    fetchInbox,
    setCollisionLockForConv,
    handleGhostedAlert,
    handleSnoozeWakeup,
    handleConversationTransferred,
    handleMessageTranslated,
    handleRealtimeCommentVisibilityUpdated,
    handleRealtimeCommentLikeUpdated,
    handleRealtimeCommentPrivateReplySent,
    handleRealtimeCommentDeletedOnPlatform,
    handleBuyerSeenSynced,
    handleNerEntitiesDetected,
    handleReadMessage,
    updateMessageStatusBatch,
    handleRealtimeConversationTagsUpdated,
    handleRealtimeMessageTagged,
    handleRealtimeCrmProfileUpdated,
    handleRealtimeCapiEventDispatched,
  ]);
};
