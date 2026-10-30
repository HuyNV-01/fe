"use client";

import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import DropdownMenuContentCus from "@/components/dropdown-menu/dropdown-menu-content-cus";
import ItemMenu from "@/components/dropdown-menu/item-menu";
import {
  ImageLightboxModal,
  type LightboxImageItem,
} from "@/components/chat/image-lightbox-modal";
import {
  Bell,
  Volume2,
  Eye,
  Timer,
  Pencil,
  Image as ImageIcon,
  FileText,
  Link2,
  ShieldAlert,
  Ban,
  Trash2,
  Check,
  X,
  Download,
  ExternalLink,
  LogOut,
  Crown,
  ShieldCheck,
  MoreVertical,
  UserMinus,
  UserCheck,
} from "lucide-react";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { ConfirmDeleteModal } from "@/components/common/confirm-delete-modal";
import {
  downloadMediaFile,
  formatFileSize,
  sanitizeMediaUrl,
} from "@/utils/crypto-e2ee";
import { getInitials } from "@/utils/helper";
import { ConversationTypeEnum, GroupRoleEnum } from "@/common/enum";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";
import { useEffect, useRef, useState } from "react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "../ui/sheet";
import { ScrollArea } from "@radix-ui/react-scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Separator } from "../ui/separator";
import { Switch } from "../ui/switch";

interface ConversationInfoDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  conversationId: string;
  initialSection?: "INFO" | "MEDIA";
  onDeletedConversation?: () => void;
  onLeaveGroup?: () => void;
}

const DISAPPEARING_OPTIONS = [
  { labelKey: "off", value: 0 },
  { labelKey: "1m", value: 60 },
  { labelKey: "1h", value: 3600 },
  { labelKey: "24h", value: 86400 },
  { labelKey: "7d", value: 604800 },
];

export function ConversationInfoDrawer({
  open,
  onOpenChange,
  conversationId,
  initialSection = "INFO",
  onDeletedConversation,
  onLeaveGroup,
}: ConversationInfoDrawerProps) {
  const t = useTranslations("Chat.Detail.infoDrawer");
  const currentUserId = useAuthStore((s) => s.currentAccount?.user?.id);

  const {
    conversationDetails,
    sharedAssets,
    fetchConversationDetails,
    fetchSharedAssets,
    updateNickname,
    updateConversationSettings,
    updateDisappearingMessages,
    deleteConversation,
    toggleBlockUser,
    updateGroupMemberRole,
    removeGroupMember,
  } = useChatStore();

  const details = conversationDetails[conversationId];
  const assets = sharedAssets[conversationId] || {
    media: [],
    files: [],
    links: [],
  };

  const [activeVaultTab, setActiveVaultTab] = useState<
    "MEDIA" | "FILES" | "LINKS"
  >("MEDIA");
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [nicknameDraft, setNicknameDraft] = useState("");
  const [isDeleteConvModalOpen, setIsDeleteConvModalOpen] = useState(false);
  const [isLeaveGroupModalOpen, setIsLeaveGroupModalOpen] = useState(false);

  const [vaultLightboxIndex, setVaultLightboxIndex] = useState<number | null>(
    null,
  );
  const [memberToRemove, setMemberToRemove] = useState<{
    userId: string;
    name: string;
  } | null>(null);
  const [memberToTransferOwner, setMemberToTransferOwner] = useState<{
    userId: string;
    name: string;
  } | null>(null);

  const vaultSectionRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (open && conversationId) {
      fetchConversationDetails(conversationId);
      fetchSharedAssets(conversationId);
      if (initialSection === "MEDIA") {
        setTimeout(() => {
          vaultSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 150);
      }
    }
  }, [
    open,
    conversationId,
    initialSection,
    fetchConversationDetails,
    fetchSharedAssets,
  ]);

  const myMemberRecord = (details?.members || []).find(
    (m) => m.userId === currentUserId,
  );
  const myRole =
    myMemberRecord?.role ||
    (myMemberRecord?.isAdmin ? GroupRoleEnum.ADMIN : GroupRoleEnum.MEMBER);
  const isMeOwner = myRole === GroupRoleEnum.OWNER;
  const isMeAdminOrOwner =
    myRole === GroupRoleEnum.OWNER || myRole === GroupRoleEnum.ADMIN;

  const vaultImageItems: LightboxImageItem[] = (assets.media || [])
    .filter((m) => m.type === "IMAGE" || m.mimeType?.startsWith("image/"))
    .map((m) => ({
      url: m.url,
      thumbnailUrl: m.thumbnailUrl || m.url,
      fileName: m.fileName,
      size: m.size,
    }));

  useEffect(() => {
    if (open && conversationId) {
      fetchConversationDetails(conversationId);
      fetchSharedAssets(conversationId);
    }
  }, [open, conversationId, fetchConversationDetails, fetchSharedAssets]);

  const isGroup = details?.type === ConversationTypeEnum.GROUP;
  const mySettings = details?.mySettings;
  const blockState = details?.blockState;

  const handleSaveNickname = async (targetUserId: string) => {
    await updateNickname({
      conversationId,
      targetUserId,
      nickname: nicknameDraft.trim() || null,
    });
    setEditingMemberId(null);
  };

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="w-full sm:max-w-md h-dvh max-h-dvh overflow-hidden p-0 flex flex-col gap-0"
        >
          <SheetHeader className="px-5 py-4 border-b shrink-0">
            <SheetTitle className="text-base font-bold truncate">
              {t("title")}
            </SheetTitle>
            <SheetDescription className="text-xs break-words">
              {t("description")}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1 min-h-0 w-full">
            <div className="p-5 space-y-6">
              {/* Danh sách Thành viên, Biệt danh & Phân quyền Nhóm */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center justify-between gap-1.5">
                  <span className="flex items-center gap-1.5 truncate">
                    <Pencil className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{t("nicknamesTitle")}</span>
                  </span>
                  {isGroup && (
                    <Badge variant="secondary" className="text-[10px] shrink-0">
                      {(details?.members || []).length}
                    </Badge>
                  )}
                </h4>

                <div className="space-y-2">
                  {(details?.members || []).map((member) => {
                    const isEditing = editingMemberId === member.userId;
                    const memberRole =
                      member.role ||
                      (member.isAdmin
                        ? GroupRoleEnum.ADMIN
                        : GroupRoleEnum.MEMBER);
                    const canManageMember =
                      isGroup &&
                      member.userId !== currentUserId &&
                      (isMeOwner ||
                        (isMeAdminOrOwner &&
                          memberRole === GroupRoleEnum.MEMBER));

                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50 min-w-0"
                      >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <Avatar className="h-8 w-8 border shrink-0">
                            <AvatarImage src={member.avatar || undefined} />
                            <AvatarFallback className="text-[10px] font-bold bg-primary/10 text-primary">
                              {getInitials(member.nickname || member.name)}
                            </AvatarFallback>
                          </Avatar>

                          {isEditing ? (
                            <Input
                              value={nicknameDraft}
                              onChange={(e) => setNicknameDraft(e.target.value)}
                              placeholder={member.name}
                              className="h-8 text-xs min-w-0 flex-1"
                              autoFocus
                            />
                          ) : (
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <p className="text-xs font-semibold truncate">
                                  {member.nickname || member.name}
                                </p>
                                {isGroup &&
                                  memberRole === GroupRoleEnum.OWNER && (
                                    <Badge className="h-4 px-1.5 text-[9px] bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30 shrink-0 gap-0.5">
                                      <Crown className="w-2.5 h-2.5" />
                                      {t("roles.owner")}
                                    </Badge>
                                  )}
                                {isGroup &&
                                  memberRole === GroupRoleEnum.ADMIN && (
                                    <Badge className="h-4 px-1.5 text-[9px] bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border-indigo-500/30 shrink-0 gap-0.5">
                                      <ShieldCheck className="w-2.5 h-2.5" />
                                      {t("roles.admin")}
                                    </Badge>
                                  )}
                              </div>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {member.nickname
                                  ? `${t("originalName")}: ${member.name}`
                                  : t("noNickname")}
                              </p>
                            </div>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-emerald-600"
                              onClick={() => handleSaveNickname(member.userId)}
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground"
                              onClick={() => setEditingMemberId(null)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-0.5 shrink-0">
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 px-2 text-xs text-primary shrink-0"
                              onClick={() => {
                                setEditingMemberId(member.userId);
                                setNicknameDraft(member.nickname || "");
                              }}
                            >
                              <Pencil className="w-3.5 h-3.5 mr-1" />
                              {t("editBtn")}
                            </Button>

                            {canManageMember && (
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 rounded-full"
                                  >
                                    <MoreVertical className="w-3.5 h-3.5" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContentCus
                                  align="end"
                                  className="w-52"
                                >
                                  {isMeOwner &&
                                    memberRole === GroupRoleEnum.MEMBER && (
                                      <ItemMenu
                                        onClick={() =>
                                          updateGroupMemberRole({
                                            conversationId,
                                            memberId: member.userId,
                                            role: GroupRoleEnum.ADMIN,
                                          })
                                        }
                                        icon={
                                          <ShieldCheck className="w-4 h-4 mr-2 text-indigo-500" />
                                        }
                                      >
                                        {t("roles.promoteAdmin")}
                                      </ItemMenu>
                                    )}

                                  {isMeOwner &&
                                    memberRole === GroupRoleEnum.ADMIN && (
                                      <ItemMenu
                                        onClick={() =>
                                          updateGroupMemberRole({
                                            conversationId,
                                            memberId: member.userId,
                                            role: GroupRoleEnum.MEMBER,
                                          })
                                        }
                                        icon={
                                          <UserCheck className="w-4 h-4 mr-2" />
                                        }
                                      >
                                        {t("roles.demoteAdmin")}
                                      </ItemMenu>
                                    )}

                                  {isMeOwner && (
                                    <ItemMenu
                                      onClick={() =>
                                        setMemberToTransferOwner({
                                          userId: member.userId,
                                          name: member.nickname || member.name,
                                        })
                                      }
                                      icon={
                                        <Crown className="w-4 h-4 mr-2 text-amber-500" />
                                      }
                                    >
                                      {t("roles.transferOwnership")}
                                    </ItemMenu>
                                  )}

                                  <ItemMenu
                                    onClick={() =>
                                      setMemberToRemove({
                                        userId: member.userId,
                                        name: member.nickname || member.name,
                                      })
                                    }
                                    className="text-red-600 focus:text-red-600"
                                    icon={
                                      <UserMinus className="w-4 h-4 mr-2 text-red-600" />
                                    }
                                  >
                                    {t("roles.removeMember")}
                                  </ItemMenu>
                                </DropdownMenuContentCus>
                              </DropdownMenu>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div className="space-y-3.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("privacyAndNotifTitle")}
                </h4>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Bell className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">
                        {t("muteNotifications")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("muteNotificationsDesc")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={Boolean(mySettings?.isMuted)}
                    onCheckedChange={(checked) =>
                      updateConversationSettings({
                        conversationId,
                        isMuted: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Volume2 className="w-4 h-4 text-indigo-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">
                        {t("soundNotification")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("soundNotificationDesc")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={mySettings?.soundEnabled ?? true}
                    onCheckedChange={(checked) =>
                      updateConversationSettings({
                        conversationId,
                        soundEnabled: checked,
                      })
                    }
                  />
                </div>

                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">
                        {t("readReceipts")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("readReceiptsDesc")}
                      </p>
                    </div>
                  </div>
                  <Switch
                    checked={mySettings?.readReceiptsEnabled ?? true}
                    onCheckedChange={(checked) =>
                      updateConversationSettings({
                        conversationId,
                        readReceiptsEnabled: checked,
                      })
                    }
                  />
                </div>

                <div className="space-y-2 pt-1">
                  <div className="flex items-center gap-2.5">
                    <Timer className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold">
                        {t("disappearingTitle")}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {t("disappearingDesc")}
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-5 gap-1.5 pt-1">
                    {DISAPPEARING_OPTIONS.map((opt) => {
                      const currentTtl = details?.disappearingTtl || 0;
                      const active = currentTtl === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() =>
                            updateDisappearingMessages(
                              conversationId,
                              opt.value === 0 ? null : opt.value,
                            )
                          }
                          className={cn(
                            "py-1.5 px-2 rounded-lg text-[11px] font-medium border transition-all cursor-pointer",
                            active
                              ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                              : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted",
                          )}
                        >
                          {t(`disappearingOptions.${opt.labelKey}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <Separator />

              <div ref={vaultSectionRef} className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("sharedVaultTitle")}
                </h4>

                <div className="grid grid-cols-3 gap-1.5 p-1 bg-muted/50 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveVaultTab("MEDIA")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                      activeVaultTab === "MEDIA"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>
                      {t("tabs.media")} ({assets.media.length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVaultTab("FILES")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                      activeVaultTab === "FILES"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>
                      {t("tabs.files")} ({assets.files.length})
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveVaultTab("LINKS")}
                    className={cn(
                      "flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer",
                      activeVaultTab === "LINKS"
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground",
                    )}
                  >
                    <Link2 className="w-3.5 h-3.5" />
                    <span>
                      {t("tabs.links")} ({assets.links.length})
                    </span>
                  </button>
                </div>

                {activeVaultTab === "MEDIA" && (
                  <div className="max-h-60 overflow-y-auto pr-1">
                    {assets.media.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        {t("emptyMedia")}
                      </p>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {assets.media.map((item) => {
                          const galleryIdx = vaultImageItems.findIndex(
                            (img) => img.url === item.url,
                          );
                          return (
                            <div
                              key={`${item.messageId}-${item.fileId}`}
                              className="group relative aspect-square rounded-xl overflow-hidden border bg-muted"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  if (galleryIdx !== -1) {
                                    setVaultLightboxIndex(galleryIdx);
                                  }
                                }}
                                className="w-full h-full block cursor-zoom-in"
                              >
                                <img
                                  src={sanitizeMediaUrl(
                                    item.thumbnailUrl || item.url,
                                  )}
                                  alt={item.fileName}
                                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                  loading="lazy"
                                />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  downloadMediaFile(item.url, item.fileName);
                                }}
                                className="absolute bottom-1.5 right-1.5 p-1.5 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                title={t("downloadFile")}
                              >
                                <Download className="w-3 h-3" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {activeVaultTab === "FILES" && (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {assets.files.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        {t("emptyFiles")}
                      </p>
                    ) : (
                      assets.files.map((file) => (
                        <button
                          key={`${file.messageId}-${file.fileId}`}
                          type="button"
                          onClick={() =>
                            downloadMediaFile(file.url, file.fileName)
                          }
                          className="w-full text-left flex items-center justify-between gap-2.5 p-2.5 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer min-w-0"
                        >
                          <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1 overflow-hidden">
                              <p className="text-xs font-semibold truncate">
                                {file.fileName}
                              </p>
                              <p className="text-[10px] text-muted-foreground truncate">
                                {formatFileSize(file.size)} • {file.senderName}
                              </p>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                )}

                {activeVaultTab === "LINKS" && (
                  <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
                    {assets.links.length === 0 ? (
                      <p className="text-xs text-muted-foreground text-center py-6">
                        {t("emptyLinks")}
                      </p>
                    ) : (
                      assets.links.map((link, idx) => (
                        <a
                          key={`${link.messageId}-${idx}`}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-500 shrink-0">
                              <Link2 className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-primary truncate">
                                {link.hostname}
                              </p>
                              <p className="text-[11px] text-muted-foreground truncate">
                                {link.url}
                              </p>
                            </div>
                          </div>
                          <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                        </a>
                      ))
                    )}
                  </div>
                )}
              </div>

              <Separator />

              <div className="space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  {t("securityActionsTitle")}
                </h4>

                {!isGroup && (
                  <div className="flex items-center justify-between gap-3 p-2.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
                    <div className="flex items-center gap-2.5">
                      <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs font-semibold">
                          {t("restrictUser")}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {t("restrictUserDesc")}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={Boolean(mySettings?.isRestricted)}
                      onCheckedChange={(checked) =>
                        updateConversationSettings({
                          conversationId,
                          isRestricted: checked,
                        })
                      }
                    />
                  </div>
                )}

                {!isGroup && blockState?.partnerId && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2.5 text-xs text-red-600 border-red-500/30 hover:bg-red-500/10 rounded-xl"
                    onClick={() =>
                      toggleBlockUser(
                        conversationId,
                        blockState.partnerId!,
                        !blockState.blockedByMe,
                      )
                    }
                  >
                    <Ban className="w-4 h-4" />
                    <span>
                      {blockState.blockedByMe
                        ? t("unblockUser")
                        : t("blockUser")}
                    </span>
                  </Button>
                )}

                {isGroup && onLeaveGroup && (
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2.5 text-xs text-amber-600 border-amber-500/30 hover:bg-amber-500/10 rounded-xl"
                    onClick={() => setIsLeaveGroupModalOpen(true)}
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t("leaveGroup")}</span>
                  </Button>
                )}

                <Button
                  type="button"
                  variant="destructive"
                  className="w-full justify-start gap-2.5 text-xs rounded-xl"
                  onClick={() => setIsDeleteConvModalOpen(true)}
                >
                  <Trash2 className="w-4 h-4" />
                  <span>{t("deleteConversation")}</span>
                </Button>
              </div>
            </div>
          </ScrollArea>
        </SheetContent>
      </Sheet>

      <ConfirmDeleteModal
        open={isDeleteConvModalOpen}
        onOpenChange={setIsDeleteConvModalOpen}
        title={t("deleteConversationConfirmTitle")}
        description={t("deleteConversationConfirmDesc")}
        onConfirm={async () => {
          const ok = await deleteConversation(conversationId);
          if (ok) {
            onOpenChange(false);
            onDeletedConversation?.();
          }
        }}
      />

      <ConfirmDeleteModal
        open={isLeaveGroupModalOpen}
        onOpenChange={setIsLeaveGroupModalOpen}
        title={t("leaveGroupConfirmTitle")}
        description={t("leaveGroupConfirmDesc")}
        confirmText={t("leaveGroup")}
        onConfirm={async () => {
          onOpenChange(false);
          onLeaveGroup?.();
        }}
      />
    <ImageLightboxModal
        open={vaultLightboxIndex !== null}
        onOpenChange={(open) => !open && setVaultLightboxIndex(null)}
        images={vaultImageItems}
        initialIndex={vaultLightboxIndex ?? 0}
      />

      <ConfirmDeleteModal
        open={Boolean(memberToRemove)}
        onOpenChange={(open) => !open && setMemberToRemove(null)}
        title={t("roles.removeMemberConfirmTitle")}
        description={t("roles.removeMemberConfirmDesc", {
          name: memberToRemove?.name || "",
        })}
        confirmText={t("roles.removeMember")}
        onConfirm={async () => {
          if (memberToRemove) {
            await removeGroupMember({
              conversationId,
              memberId: memberToRemove.userId,
            });
            await fetchConversationDetails(conversationId);
            setMemberToRemove(null);
          }
        }}
      />

      <ConfirmDeleteModal
        open={Boolean(memberToTransferOwner)}
        onOpenChange={(open) => !open && setMemberToTransferOwner(null)}
        title={t("roles.transferConfirmTitle")}
        description={t("roles.transferConfirmDesc", {
          name: memberToTransferOwner?.name || "",
        })}
        confirmText={t("roles.transferOwnership")}
        onConfirm={async () => {
          if (memberToTransferOwner) {
            await updateGroupMemberRole({
              conversationId,
              memberId: memberToTransferOwner.userId,
              role: GroupRoleEnum.OWNER,
            });
            setMemberToTransferOwner(null);
          }
        }}
      />
    </>
  );
}
