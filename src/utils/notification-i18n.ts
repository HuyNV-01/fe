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

  const mergedParams = {
    ...params,
    senderName: actorName,
    actorName,
    callerName: actorName,
    requesterName: actorName,
    creatorName: actorName,
    accepterName: actorName,
    conversationName,
    preview: getPreviewText(),
    emoji: params.emoji || meta.emoji || "",
    callTypeLabel:
      (params.callType || meta.callType) === "VIDEO"
        ? t("i18n.callType.video")
        : t("i18n.callType.audio"),
  };

  if (meta.titleKey && meta.contentKey) {
    try {
      return {
        title: t(meta.titleKey, mergedParams),
        content: t(meta.contentKey, mergedParams),
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

    default:
      return {
        title: item.title,
        content: item.content,
      };
  }
}
