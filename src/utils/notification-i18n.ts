import { type INotification, NotificationTypeEnum } from "@/types/notification";

type TranslationFn = (key: string, values?: Record<string, any>) => string;

export function resolveNotificationI18n(
  item: INotification,
  t: TranslationFn,
): { title: string; content: string } {
  const meta = item.metadata || {};
  const params = meta.i18nParams || {};
  const actorName =
    (params.senderName as string) ||
    (params.actorName as string) ||
    (params.callerName as string) ||
    (params.requesterName as string) ||
    (params.creatorName as string) ||
    (params.accepterName as string) ||
    item.actor?.name ||
    t("systemActor");

  const conversationName =
    (params.conversationName as string) ||
    meta.conversationName ||
    t("i18n.defaultGroup");
  const isGroup = Boolean(params.isGroup) || meta.conversationType === "GROUP";
  const messageType =
    (params.messageType as string) || meta.messageType || "TEXT";

  const getPreviewText = () => {
    if (messageType === "IMAGE") return t("i18n.preview.image");
    if (messageType === "VIDEO") return t("i18n.preview.video");
    if (messageType === "AUDIO") return t("i18n.preview.audio");
    if (messageType === "FILE") return t("i18n.preview.file");
    return (params.preview as string) || item.content || "";
  };

  let roleLabel = (params.roleKey as string) || "";
  if (params.roleKey) {
    try {
      roleLabel = t(`i18n.roles.${String(params.roleKey)}`);
    } catch {}
  }

  let statusLabel = (params.statusKey as string) || "";
  if (params.statusKey) {
    try {
      statusLabel = t(`i18n.statuses.${String(params.statusKey)}`);
    } catch {}
  }

  const mergedParams = {
    ...params,
    senderName: actorName,
    actorName,
    callerName: actorName,
    requesterName: actorName,
    creatorName: actorName,
    accepterName: actorName,
    conversationName,
    roleLabel,
    statusLabel,
    shopName: (params.shopName as string) || "",
    requestedNote: (params.requestedNote as string) || "",
    reason: (params.reason as string) || "",
    preview: getPreviewText(),
    emoji: params.emoji || meta.emoji || "",
    callTypeLabel:
      (params.callType || meta.callType) === "VIDEO"
        ? t("i18n.callType.video")
        : t("i18n.callType.audio"),
  };

  if (meta.titleKey && meta.contentKey) {
    try {
      const normalizedTitleKey = meta.titleKey.startsWith("Notifications.")
        ? meta.titleKey.replace(/^Notifications\./, "")
        : meta.titleKey;
      const normalizedContentKey = meta.contentKey.startsWith("Notifications.")
        ? meta.contentKey.replace(/^Notifications\./, "")
        : meta.contentKey;
      return {
        title: t(normalizedTitleKey, mergedParams),
        content: t(normalizedContentKey, mergedParams),
      };
    } catch {}
  }

  switch (item.type) {
    case NotificationTypeEnum.MESSAGE_REPLY:
      return {
        title: isGroup
          ? t("i18n.messageReply.groupTitle", mergedParams)
          : t("i18n.messageReply.directTitle", mergedParams),
        content: getPreviewText(),
      };

    case NotificationTypeEnum.NEW_MESSAGE:
      return {
        title: isGroup
          ? t("i18n.newMessage.groupTitle", mergedParams)
          : t("i18n.newMessage.directTitle", mergedParams),
        content: isGroup
          ? t("i18n.newMessage.groupContent", mergedParams)
          : getPreviewText(),
      };

    case NotificationTypeEnum.MESSAGE_REACTION:
      return {
        title: t("i18n.messageReaction.title", mergedParams),
        content: t("i18n.messageReaction.content", {
          ...mergedParams,
          preview: (params.preview as string) || item.content,
        }),
      };

    case NotificationTypeEnum.MISSED_CALL:
      return {
        title: t("i18n.missedCall.title", mergedParams),
        content: t("i18n.missedCall.content", mergedParams),
      };

    case NotificationTypeEnum.GROUP_MEMBER_ADDED:
      return {
        title: t("i18n.groupMemberAdded.title", mergedParams),
        content: t("i18n.groupMemberAdded.content", mergedParams),
      };

    case NotificationTypeEnum.GROUP_INVITE:
      return {
        title: t("i18n.groupInvite.title", mergedParams),
        content: t("i18n.groupInvite.content", mergedParams),
      };

    case NotificationTypeEnum.FRIEND_REQUEST:
      return {
        title: t("i18n.friendRequest.title", mergedParams),
        content: t("i18n.friendRequest.content", mergedParams),
      };

    case NotificationTypeEnum.FRIEND_ACCEPTED:
      return {
        title: t("i18n.friendAccepted.title", mergedParams),
        content: t("i18n.friendAccepted.content", mergedParams),
      };

    case NotificationTypeEnum.SHOP_INVITATION:
      return {
        title: t("i18n.shopInvitationReceived.title", mergedParams),
        content: t("i18n.shopInvitationReceived.content", mergedParams),
      };

    case NotificationTypeEnum.SHOP_INVITATION_ACCEPTED:
      return {
        title: t("i18n.shopInvitationAccepted.title", mergedParams),
        content: t("i18n.shopInvitationAccepted.content", mergedParams),
      };

    case NotificationTypeEnum.SHOP_JOIN_REQUEST:
      return {
        title: t("i18n.shopJoinRequest.title", mergedParams),
        content: t("i18n.shopJoinRequest.content", mergedParams),
      };

    case NotificationTypeEnum.SHOP_JOIN_APPROVED:
      return {
        title: t("i18n.shopJoinApproved.title", mergedParams),
        content: t("i18n.shopJoinApproved.content", mergedParams),
      };

    case NotificationTypeEnum.SHOP_JOIN_REJECTED:
      return {
        title: t("i18n.shopJoinRejected.title", mergedParams),
        content: t("i18n.shopJoinRejected.content", mergedParams),
      };

    case NotificationTypeEnum.SHOP_ROLE_UPDATED:
      return {
        title: t("i18n.shopRoleUpdated.title", mergedParams),
        content: t("i18n.shopRoleUpdated.content", mergedParams),
      };

    case NotificationTypeEnum.SHOP_MEMBER_STATUS_CHANGED:
      return {
        title: t("i18n.shopMemberStatusChanged.title", mergedParams),
        content: t("i18n.shopMemberStatusChanged.content", mergedParams),
      };

    case NotificationTypeEnum.SHOP_SHIFT_HANDOVER:
      return {
        title: t("i18n.shopShiftHandover.title", mergedParams),
        content: t("i18n.shopShiftHandover.content", mergedParams),
      };

    case NotificationTypeEnum.SHOP_FORCE_OFFLINE:
      return {
        title: t("i18n.shopForceOffline.title", mergedParams),
        content: t("i18n.shopForceOffline.content", mergedParams),
      };

    case NotificationTypeEnum.SHOP_WORKSPACE_UPDATED:
      return {
        title: t("i18n.shopWorkspaceUpdated.title", mergedParams),
        content: t("i18n.shopWorkspaceUpdated.content", mergedParams),
      };

    case NotificationTypeEnum.CHANNEL_CONNECTED:
      return {
        title: t("i18n.channelConnected.title", mergedParams),
        content: t("i18n.channelConnected.content", mergedParams),
      };

    case NotificationTypeEnum.CHANNEL_TOKEN_WARNING:
      return {
        title: t("i18n.channelTokenWarning.title", mergedParams),
        content: t("i18n.channelTokenWarning.content", mergedParams),
      };

    case NotificationTypeEnum.INBOX_CONVERSATION_ASSIGNED:
      return {
        title: t("i18n.inboxConversationAssigned.title", mergedParams),
        content: t("i18n.inboxConversationAssigned.content", mergedParams),
      };

    case NotificationTypeEnum.INBOX_SLA_RECLAIMED:
      return {
        title: t("i18n.inboxSlaReclaimed.title", mergedParams),
        content: t("i18n.inboxSlaReclaimed.content", mergedParams),
      };

    case NotificationTypeEnum.MARKETPLACE_ORDER_SYNCED:
      return {
        title: t("i18n.marketplaceOrderSynced.title", mergedParams),
        content: t("i18n.marketplaceOrderSynced.content", mergedParams),
      };

    default:
      return {
        title: item.title,
        content: item.content,
      };
  }
}
