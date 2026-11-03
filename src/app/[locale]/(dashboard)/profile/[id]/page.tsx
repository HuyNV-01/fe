"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import {
  Ban,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  Image as ImageIcon,
  Lock,
  Mail,
  Pencil,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  Sparkles,
  UserCheck,
} from "lucide-react";
import { motion } from "framer-motion";

import { useUserStore } from "@/lib/stores/user/use-user-store";
import { useContactStore } from "@/lib/stores/contact/use-contact-store";
import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { useStoreWait } from "@/utils/hooks/use-store-wait";
import { useProfileActions } from "@/utils/hooks/use-profile-actions";

import { ProfileHeader } from "@/components/user/profile-header";
import { BlockManagement } from "@/components/user/block-management";
import { ProfileSkeleton } from "@/components/skeleton/profile-skeleton";
import {
  ImageLightboxModal,
  type LightboxImageItem,
} from "@/components/chat/image-lightbox-modal";
import {
  GlassSurfaceCard,
  GlassTabs,
  GlassModal,
  GlassEmptyState,
  GlassBadge,
  PatternButton,
  ButtonBack,
  Switch,
} from "@/components/toolkit";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ContactStatusEnum } from "@/common/enum";
import {
  downloadMediaFile,
  formatFileSize,
  sanitizeMediaUrl,
} from "@/utils/crypto-e2ee";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { IUserPrivacySettings, ProfileAccessLevel } from "@/types/profile";

/**
 * Trang cá nhân (Profile) độc lập khỏi giao diện hội thoại, thiết kế theo chuẩn Meta/Facebook:
 * - Tích hợp Routing Guard / 404 "Nội dung không khả dụng" khi có quan hệ chặn (Block).
 * - Phân quyền hiển thị có điều kiện (Conditional Rendering) theo 3 cấp độ: SELF | FRIEND | STRANGER.
 * - Hỗ trợ Ảnh bìa, Avatar, Bio, Danh sách truyền thông (Ảnh/Video & File đã chia sẻ), Chỉnh sửa hồ sơ, Cài đặt quyền riêng tư & Quản lý chặn.
 */
export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const t = useTranslations("Profile");

  const {
    profile,
    fetchProfile,
    status,
    isProfileBlocked,
    profileBlockedByMe,
    resetProfile,
  } = useUserStore();
  const { blockedUsers, unblockUser, isRequest } = useContactStore();
  const { syncBlockStateForUser } = useChatStore();

  const userId = params.id as string;
  const isStoreLoading = useStoreWait(status);

  const [activeMediaTab, setActiveMediaTab] = useState<"MEDIA" | "FILES">(
    "MEDIA",
  );
  const [activeSelfSection, setActiveSelfSection] = useState<
    "OVERVIEW" | "BLOCK_MANAGEMENT"
  >("OVERVIEW");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);

  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [privacyDraft, setPrivacyDraft] = useState<IUserPrivacySettings>({
    showEmail: true,
    showPhone: true,
    showAlias: true,
    showOnlineStatus: true,
    showSharedMedia: true,
  });

  const { isSavingProfile, onSaveProfile } = useProfileActions(
    profile || { id: userId },
  );

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
    return () => resetProfile();
  }, [userId, fetchProfile, resetProfile]);

  useEffect(() => {
    if (profile) {
      setEditName(profile.name || "");
      setEditBio(profile.bio || "");
      setEditPhone(profile.phone || "");
      setPrivacyDraft({
        showEmail: profile.privacySettings?.showEmail ?? true,
        showPhone: profile.privacySettings?.showPhone ?? true,
        showAlias: profile.privacySettings?.showAlias ?? true,
        showOnlineStatus: profile.privacySettings?.showOnlineStatus ?? true,
        showSharedMedia: profile.privacySettings?.showSharedMedia ?? true,
      });
    }
  }, [profile]);

  const isBlockedInLocalStore = useMemo(
    () =>
      blockedUsers.some(
        (b) => b.contactId === userId || b.contactUser?.id === userId,
      ),
    [blockedUsers, userId],
  );

  if (isStoreLoading) {
    return <ProfileSkeleton />;
  }

  // Routing Guard: Khi User A chặn User B (hoặc ngược lại) -> Hiển thị màn hình 404 "Nội dung không khả dụng"
  if (
    isProfileBlocked ||
    isBlockedInLocalStore ||
    profile?.isBlocked ||
    !profile
  ) {
    const canUnblockHere =
      profileBlockedByMe || isBlockedInLocalStore || profile?.blockedByMe;

    return (
      <div className="h-full w-full flex flex-col items-center justify-center px-4 py-12">
        <GlassSurfaceCard className="max-w-md w-full text-center p-6 sm:p-8">
          <GlassEmptyState
            icon={<ShieldAlert className="w-8 h-8 text-amber-500" />}
            title={t("unavailable.title")}
            description={t("unavailable.description")}
            action={
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <PatternButton
                  variant="glass"
                  color="primary"
                  size="sm"
                  rounded="full"
                  onClick={() => router.push(config.routes.private.chat)}
                >
                  {t("unavailable.backToChat")}
                </PatternButton>

                {canUnblockHere && (
                  <PatternButton
                    variant="outline"
                    color="danger"
                    size="sm"
                    rounded="full"
                    isLoading={isRequest}
                    icon={<ShieldOff className="w-3.5 h-3.5" />}
                    onClick={async () => {
                      const ok = await unblockUser(userId);
                      if (ok) {
                        syncBlockStateForUser(userId, { blockedByMe: false });
                        toast.success(t("actions.toast.userUnblocked"));
                        fetchProfile(userId);
                      }
                    }}
                  >
                    {t("actions.unblockUser")}
                  </PatternButton>
                )}
              </div>
            }
          />
        </GlassSurfaceCard>
      </div>
    );
  }

  const accessLevel: ProfileAccessLevel =
    profile.accessLevel ||
    (profile.isMe
      ? "SELF"
      : profile.relationship === ContactStatusEnum.FRIEND
        ? "FRIEND"
        : "STRANGER");

  const sharedMedia = profile.sharedMedia || [];
  const sharedFiles = profile.sharedFiles || [];

  const lightboxImages: LightboxImageItem[] = sharedMedia
    .filter((m) => m.type === "IMAGE" || m.mimeType?.startsWith("image/"))
    .map((m) => ({
      url: m.url,
      thumbnailUrl: m.thumbnailUrl || m.url,
      fileName: m.fileName,
      size: m.size,
    }));

  const getRelationshipLabel = () => {
    if (profile.isMe) return t("accountInfo.relationships.me");
    switch (profile.relationship) {
      case ContactStatusEnum.FRIEND:
        return t("accountInfo.relationships.friend");
      case ContactStatusEnum.PENDING_SENT:
        return t("accountInfo.relationships.pendingSent");
      case ContactStatusEnum.PENDING_RECEIVED:
        return t("accountInfo.relationships.pendingReceived");
      default:
        return t("accountInfo.relationships.none");
    }
  };

  const handleSubmitEditProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) {
      toast.warning(t("editModal.nameRequired"));
      return;
    }
    const ok = await onSaveProfile({
      name: editName.trim(),
      bio: editBio.trim() || null,
      phone: editPhone.trim() || null,
    });
    if (ok) {
      setIsEditModalOpen(false);
    }
  };

  const handleTogglePrivacy = async (
    key: keyof IUserPrivacySettings,
    checked: boolean,
  ) => {
    const nextPrivacy: IUserPrivacySettings = {
      ...privacyDraft,
      [key]: checked,
    };
    setPrivacyDraft(nextPrivacy);
    await onSaveProfile({
      privacySettings: nextPrivacy,
    });
  };

  return (
    <ScrollArea className="relative z-20 h-full w-full">
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full"
      >
        {/* Nút quay lại nổi trên đầu */}
        <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-3 pb-1 flex items-center justify-between">
          <ButtonBack />
          {accessLevel === "SELF" && (
            <GlassTabs
              size="sm"
              value={activeSelfSection}
              onValueChange={setActiveSelfSection}
              items={[
                {
                  key: "OVERVIEW",
                  label: t("tabs.overview"),
                  icon: <UserCheck className="w-3.5 h-3.5" />,
                },
                {
                  key: "BLOCK_MANAGEMENT",
                  label: t("tabs.blockManagement"),
                  icon: <Ban className="w-3.5 h-3.5" />,
                  badge: blockedUsers.length,
                },
              ]}
            />
          )}
        </div>

        <div className="max-w-6xl mx-auto pb-20">
          <ProfileHeader
            profile={profile}
            onOpenEditModal={() => setIsEditModalOpen(true)}
            onOpenPrivacyModal={() => setIsPrivacyModalOpen(true)}
          />

          {/* CẤP ĐỘ 3: NGƯỜI LẠ (STRANGER) -> Chỉ hiển thị Avatar, Tên hiển thị công khai và Ảnh bìa */}
          {accessLevel === "STRANGER" && (
            <div className="px-4 sm:px-6 md:px-10 mt-6">
              <GlassSurfaceCard className="p-6 sm:p-8">
                <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
                  <div className="p-3.5 rounded-2xl bg-primary/10 text-primary shrink-0">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div className="space-y-1 flex-1">
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      {t("strangerNotice.title", { name: profile.name || "" })}
                    </h3>
                    <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                      {t("strangerNotice.description")}
                    </p>
                  </div>
                  <GlassBadge variant="secondary" size="md">
                    {getRelationshipLabel()}
                  </GlassBadge>
                </div>
              </GlassSurfaceCard>
            </div>
          )}

          {/* CẤP ĐỘ 1 (SELF) - TAB QUẢN LÝ CHẶN */}
          {accessLevel === "SELF" &&
            activeSelfSection === "BLOCK_MANAGEMENT" && (
              <div className="px-4 sm:px-6 md:px-10 mt-6">
                <BlockManagement />
              </div>
            )}

          {/* CẤP ĐỘ 1 (SELF - OVERVIEW) & CẤP ĐỘ 2 (FRIEND) */}
          {accessLevel !== "STRANGER" &&
            (accessLevel !== "SELF" || activeSelfSection === "OVERVIEW") && (
              <div className="px-4 sm:px-6 md:px-10 mt-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Cột trái: Giới thiệu, Liên hệ, Bảo mật & Quyền riêng tư */}
                <div className="lg:col-span-5 space-y-6">
                  <GlassSurfaceCard
                    header={
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <UserCheck className="w-4 h-4 text-primary" />
                          <span>{t("accountInfo.title")}</span>
                        </h3>
                        {accessLevel === "SELF" && (
                          <PatternButton
                            size="sm"
                            variant="ghost"
                            color="primary"
                            rounded="full"
                            className="h-7 px-2.5 text-xs"
                            icon={<Pencil className="w-3 h-3" />}
                            onClick={() => setIsEditModalOpen(true)}
                          >
                            {t("actions.editProfile")}
                          </PatternButton>
                        )}
                      </div>
                    }
                  >
                    <div className="space-y-2.5 text-xs sm:text-sm">
                      {profile.bio && (
                        <div className="pb-2.5 border-b border-border/40 text-muted-foreground italic">
                          &ldquo;{profile.bio}&rdquo;
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40">
                        <span className="text-muted-foreground shrink-0">
                          {t("accountInfo.fullName")}
                        </span>
                        <span className="font-semibold truncate">
                          {profile.name}
                        </span>
                      </div>

                      {accessLevel === "FRIEND" && profile.alias && (
                        <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40">
                          <span className="text-muted-foreground shrink-0">
                            {t("accountInfo.nickname")}
                          </span>
                          <span className="inline-flex items-center gap-1 font-medium text-indigo-600 dark:text-indigo-400 truncate">
                            <Sparkles className="w-3.5 h-3.5 shrink-0" />
                            {profile.alias}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40">
                        <span className="text-muted-foreground shrink-0">
                          {t("accountInfo.email")}
                        </span>
                        {profile.email ? (
                          <span className="font-mono text-xs truncate">
                            {profile.email}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {t("accountInfo.hiddenByPrivacy")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40">
                        <span className="text-muted-foreground shrink-0">
                          {t("accountInfo.phone")}
                        </span>
                        {profile.phone ? (
                          <span className="inline-flex items-center gap-1.5 font-mono text-xs">
                            <Phone className="w-3 h-3 text-primary" />
                            {profile.phone}
                          </span>
                        ) : accessLevel === "SELF" ? (
                          <span className="text-xs text-muted-foreground italic">
                            {t("accountInfo.notUpdated")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">
                            {t("accountInfo.hiddenByPrivacy")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40">
                        <span className="text-muted-foreground shrink-0">
                          {t("onlineStatus.label")}
                        </span>
                        {accessLevel === "SELF" || profile.isOnline ? (
                          <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                            {t("onlineStatus.active")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {t("onlineStatus.offlineOrHidden")}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2 py-1.5">
                        <span className="text-muted-foreground shrink-0">
                          {t("accountInfo.relationship")}
                        </span>
                        <span className="font-medium text-primary text-right">
                          {getRelationshipLabel()}
                        </span>
                      </div>
                    </div>
                  </GlassSurfaceCard>

                  <GlassSurfaceCard
                    header={
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" />
                        <span>{t("security.title")}</span>
                      </h3>
                    }
                  >
                    <div className="space-y-2 text-xs sm:text-sm">
                      <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40">
                        <span className="text-muted-foreground shrink-0">
                          {t("security.statusLabel")}
                        </span>
                        <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {t("security.statusActive")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40">
                        <span className="text-muted-foreground shrink-0">
                          {t("security.encryptionLabel")}
                        </span>
                        <span className="font-medium text-right">
                          {t("security.encryptionValue")}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-2 py-1.5">
                        <span className="text-muted-foreground shrink-0">
                          {t("security.verificationLabel")}
                        </span>
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          {t("security.verificationValue")}
                        </span>
                      </div>
                    </div>
                  </GlassSurfaceCard>
                </div>

                {/* Cột phải: Danh sách truyền thông (Ảnh/Video & File đã chia sẻ) + Quản lý chặn nhanh */}
                <div className="lg:col-span-7 space-y-6">
                  <GlassSurfaceCard
                    header={
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                            <ImageIcon className="w-4 h-4 text-primary" />
                            <span>{t("sharedAssets.title")}</span>
                          </h3>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {accessLevel === "SELF"
                              ? t("sharedAssets.selfDesc")
                              : t("sharedAssets.friendDesc", {
                                  name: profile.name || "",
                                })}
                          </p>
                        </div>

                        <GlassTabs
                          size="sm"
                          value={activeMediaTab}
                          onValueChange={setActiveMediaTab}
                          items={[
                            {
                              key: "MEDIA",
                              label: t("sharedAssets.mediaTab"),
                              icon: <ImageIcon className="w-3.5 h-3.5" />,
                              badge: sharedMedia.length,
                            },
                            {
                              key: "FILES",
                              label: t("sharedAssets.filesTab"),
                              icon: <FileText className="w-3.5 h-3.5" />,
                              badge: sharedFiles.length,
                            },
                          ]}
                        />
                      </div>
                    }
                  >
                    {activeMediaTab === "MEDIA" ? (
                      sharedMedia.length === 0 ? (
                        <GlassEmptyState
                          icon={
                            <ImageIcon className="w-6 h-6 text-muted-foreground" />
                          }
                          title={t("sharedAssets.emptyMediaTitle")}
                          description={t("sharedAssets.emptyMediaDesc")}
                          className="py-10"
                        />
                      ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
                          {sharedMedia.map((item) => {
                            const galleryIdx = lightboxImages.findIndex(
                              (img) => img.url === item.url,
                            );
                            return (
                              <div
                                key={`${item.messageId}-${item.fileId}`}
                                className="group relative aspect-square rounded-xl overflow-hidden border border-border/60 bg-muted"
                              >
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (galleryIdx !== -1) {
                                      setLightboxIndex(galleryIdx);
                                    }
                                  }}
                                  className="w-full h-full block cursor-zoom-in"
                                >
                                  <img
                                    src={sanitizeMediaUrl(
                                      item.thumbnailUrl || item.url,
                                    )}
                                    alt={item.fileName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    loading="lazy"
                                  />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    downloadMediaFile(item.url, item.fileName);
                                  }}
                                  className="absolute bottom-2 right-2 p-1.5 rounded-full bg-black/65 text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                  title={t("sharedAssets.download")}
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )
                    ) : sharedFiles.length === 0 ? (
                      <GlassEmptyState
                        icon={
                          <FileText className="w-6 h-6 text-muted-foreground" />
                        }
                        title={t("sharedAssets.emptyFilesTitle")}
                        description={t("sharedAssets.emptyFilesDesc")}
                        className="py-10"
                      />
                    ) : (
                      <div className="space-y-2">
                        {sharedFiles.map((file) => (
                          <button
                            key={`${file.messageId}-${file.fileId}`}
                            type="button"
                            onClick={() =>
                              downloadMediaFile(file.url, file.fileName)
                            }
                            className="w-full text-left flex items-center justify-between gap-3 p-3 rounded-xl border border-border/50 bg-muted/30 hover:bg-muted/60 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              <div className="p-2 rounded-lg bg-primary/10 text-primary shrink-0">
                                <FileText className="w-4 h-4" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-xs sm:text-sm font-semibold truncate">
                                  {file.fileName}
                                </p>
                                <p className="text-[11px] text-muted-foreground truncate">
                                  {formatFileSize(file.size)} •{" "}
                                  {file.senderName}
                                </p>
                              </div>
                            </div>
                            <Download className="w-4 h-4 text-muted-foreground shrink-0" />
                          </button>
                        ))}
                      </div>
                    )}
                  </GlassSurfaceCard>

                  {/* Hiển thị luôn Khu vực Quản lý chặn cho Chính mình (Self) */}
                  {accessLevel === "SELF" && <BlockManagement />}
                </div>
              </div>
            )}
        </div>
      </motion.div>

      {/* Modal Chỉnh sửa Hồ sơ (Chỉ dành cho Self) */}
      <GlassModal
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        size="md"
        title={
          <span className="flex items-center gap-2">
            <Pencil className="w-4 h-4 text-primary" />
            <span>{t("editModal.title")}</span>
          </span>
        }
        description={t("editModal.description")}
        footer={
          <>
            <PatternButton
              type="button"
              variant="ghost"
              size="sm"
              rounded="full"
              onClick={() => setIsEditModalOpen(false)}
            >
              {t("editModal.cancel")}
            </PatternButton>
            <PatternButton
              type="submit"
              form="edit-profile-form"
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              isLoading={isSavingProfile}
            >
              {t("editModal.save")}
            </PatternButton>
          </>
        }
      >
        <form
          id="edit-profile-form"
          onSubmit={handleSubmitEditProfile}
          className="space-y-4"
        >
          <div className="space-y-1.5">
            <label
              htmlFor="profile-name"
              className="text-xs font-semibold text-foreground"
            >
              {t("editModal.nameLabel")}
            </label>
            <Input
              id="profile-name"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              placeholder={t("editModal.namePlaceholder")}
              maxLength={100}
              className="rounded-xl bg-background/60"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-phone"
              className="text-xs font-semibold text-foreground"
            >
              {t("editModal.phoneLabel")}
            </label>
            <Input
              id="profile-phone"
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder={t("editModal.phonePlaceholder")}
              maxLength={32}
              className="rounded-xl bg-background/60"
            />
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="profile-bio"
              className="text-xs font-semibold text-foreground"
            >
              {t("editModal.bioLabel")}
            </label>
            <Textarea
              id="profile-bio"
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
              placeholder={t("editModal.bioPlaceholder")}
              maxLength={500}
              rows={3}
              className="rounded-xl bg-background/60 resize-none"
            />
            <p className="text-[11px] text-muted-foreground text-right">
              {editBio.length}/500
            </p>
          </div>
        </form>
      </GlassModal>

      {/* Modal Cài đặt Quyền riêng tư (Chỉ dành cho Self) */}
      <GlassModal
        open={isPrivacyModalOpen}
        onOpenChange={setIsPrivacyModalOpen}
        size="md"
        title={
          <span className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span>{t("privacyModal.title")}</span>
          </span>
        }
        description={t("privacyModal.description")}
      >
        <div className="space-y-4 py-1">
          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-xs font-semibold">
                  {t("privacyModal.showEmailLabel")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("privacyModal.showEmailDesc")}
                </p>
              </div>
            </div>
            <Switch
              checked={privacyDraft.showEmail !== false}
              onCheckedChange={(checked) =>
                handleTogglePrivacy("showEmail", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold">
                  {t("privacyModal.showPhoneLabel")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("privacyModal.showPhoneDesc")}
                </p>
              </div>
            </div>
            <Switch
              checked={privacyDraft.showPhone !== false}
              onCheckedChange={(checked) =>
                handleTogglePrivacy("showPhone", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold">
                  {t("privacyModal.showAliasLabel")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("privacyModal.showAliasDesc")}
                </p>
              </div>
            </div>
            <Switch
              checked={privacyDraft.showAlias !== false}
              onCheckedChange={(checked) =>
                handleTogglePrivacy("showAlias", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
            <div className="flex items-center gap-2.5">
              <Eye className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold">
                  {t("privacyModal.showOnlineLabel")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("privacyModal.showOnlineDesc")}
                </p>
              </div>
            </div>
            <Switch
              checked={privacyDraft.showOnlineStatus !== false}
              onCheckedChange={(checked) =>
                handleTogglePrivacy("showOnlineStatus", checked)
              }
            />
          </div>

          <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-muted/40 border border-border/50">
            <div className="flex items-center gap-2.5">
              <ImageIcon className="w-4 h-4 text-sky-500 shrink-0" />
              <div>
                <p className="text-xs font-semibold">
                  {t("privacyModal.showSharedMediaLabel")}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {t("privacyModal.showSharedMediaDesc")}
                </p>
              </div>
            </div>
            <Switch
              checked={privacyDraft.showSharedMedia !== false}
              onCheckedChange={(checked) =>
                handleTogglePrivacy("showSharedMedia", checked)
              }
            />
          </div>
        </div>
      </GlassModal>

      <ImageLightboxModal
        open={lightboxIndex !== null}
        onOpenChange={(open) => !open && setLightboxIndex(null)}
        images={lightboxImages}
        initialIndex={lightboxIndex ?? 0}
      />
    </ScrollArea>
  );
}
