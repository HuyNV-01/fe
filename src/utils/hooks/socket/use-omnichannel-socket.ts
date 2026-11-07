"use client";

import { useEffect } from "react";
import { socketService } from "@/services/socket/socket-client";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
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
  IMessageTranslation,
} from "@/types/chat";

export const useOmnichannelSocket = () => {
  const currentUser = useAuthStore((s) => s.currentAccount);
  const isAuthenticated = !!currentUser?.accessToken;

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const fetchShopChannels = useChannelWorkspaceStore(
    (s) => s.fetchShopChannels,
  );
  const fetchWebhookLogs = useChannelWorkspaceStore((s) => s.fetchWebhookLogs);
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
  const handleRealtimeConversationTagsUpdated = useTagStore(
    (s) => s.handleRealtimeConversationTagsUpdated,
  );
  const handleRealtimeMessageTagged = useTagStore(
    (s) => s.handleRealtimeMessageTagged,
  );
  const fetchShopTags = useTagStore((s) => s.fetchShopTags);
  const fetchQuickReplies = useTagStore((s) => s.fetchQuickReplies);

  useEffect(() => {
    if (activeShopId) {
      fetchShopTags(activeShopId);
      fetchQuickReplies(activeShopId);
    }
  }, [activeShopId, fetchShopTags, fetchQuickReplies]);

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
        }
        if (payload?.action === "WEBHOOK_INBOUND") {
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
    fetchWebhookLogs,
    fetchInbox,
    setCollisionLockForConv,
    handleGhostedAlert,
    handleSnoozeWakeup,
    handleConversationTransferred,
    handleMessageTranslated,
    handleRealtimeConversationTagsUpdated,
    handleRealtimeMessageTagged,
  ]);
};
