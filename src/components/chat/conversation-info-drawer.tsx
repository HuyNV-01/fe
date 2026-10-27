"use client";

import { useEffect, useState } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
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
} from "lucide-react";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { ConfirmDeleteModal } from "@/components/common/confirm-delete-modal";
import { formatFileSize, sanitizeMediaUrl } from "@/utils/crypto-e2ee";
import { getInitials } from "@/utils/helper";
import { ConversationTypeEnum } from "@/common/enum";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

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
          className="w-full sm:max-w-md p-0 flex flex-col"
        >
          <SheetHeader className="px-5 py-4 border-b">
            <SheetTitle className="text-base font-bold">
              {t("title")}
            </SheetTitle>
            <SheetDescription className="text-xs">
              {t("description")}
            </SheetDescription>
          </SheetHeader>

          <ScrollArea className="flex-1">
            <div className="p-5 space-y-6">
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Pencil className="w-3.5 h-3.5 text-primary" />
                  <span>{t("nicknamesTitle")}</span>
                </h4>

                <div className="space-y-2">
                  {(details?.members || []).map((member) => {
                    const isEditing = editingMemberId === member.userId;
                    return (
                      <div
                        key={member.userId}
                        className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-muted/40 border border-border/50"
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
                              className="h-8 text-xs"
                              autoFocus
                            />
                          ) : (
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-semibold truncate">
                                {member.nickname || member.name}
                              </p>
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

              <div className="space-y-3">
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
                        {assets.media.map((item) => (
                          <a
                            key={`${item.messageId}-${item.fileId}`}
                            href={sanitizeMediaUrl(item.url)}
                            target="_blank"
                            rel="noreferrer"
                            className="group relative aspect-square rounded-xl overflow-hidden border bg-muted"
                          >
                            <img
                              src={sanitizeMediaUrl(
                                item.thumbnailUrl || item.url,
                              )}
                              alt={item.fileName}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                              loading="lazy"
                            />
                          </a>
                        ))}
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
                        <a
                          key={`${file.messageId}-${file.fileId}`}
                          href={sanitizeMediaUrl(file.url)}
                          target="_blank"
                          rel="noreferrer"
                          download={file.fileName}
                          className="flex items-center justify-between gap-2.5 p-2.5 rounded-xl border bg-muted/30 hover:bg-muted/60 transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                              <FileText className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold truncate">
                                {file.fileName}
                              </p>
                              <p className="text-[10px] text-muted-foreground">
                                {formatFileSize(file.size)} • {file.senderName}
                              </p>
                            </div>
                          </div>
                          <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                        </a>
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
    </>
  );
}
