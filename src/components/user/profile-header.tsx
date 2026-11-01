"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
  GlassBadge,
  GlassConfirmDialog,
  PatternButton,
} from "@/components/toolkit";
import {
  Mail,
  Shield,
  Calendar,
  Camera,
  Trash2,
  Users,
  Sparkles,
  ImagePlus,
} from "lucide-react";
import type { IUserProfile } from "@/types/profile";
import { ProfileActions } from "./profile-actions";
import { getInitials } from "@/utils/helper";
import { useLocale, useTranslations } from "next-intl";
import { useProfileActions } from "@/utils/hooks/use-profile-actions";
import { ImageLightboxModal } from "@/components/chat/image-lightbox-modal";

interface ProfileHeaderProps {
  profile: IUserProfile;
  onOpenEditModal?: () => void;
  onOpenPrivacyModal?: () => void;
}

export const ProfileHeader = ({
  profile,
  onOpenEditModal,
  onOpenPrivacyModal,
}: ProfileHeaderProps) => {
  const t = useTranslations("Profile");
  const locale = useLocale();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { isUploadingCover, onUploadCover, onDeleteCover } =
    useProfileActions(profile);

  const [isConfirmDeleteCover, setIsConfirmDeleteCover] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const DEFAULT_COVER =
    "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=2070&auto=format&fit=crop";

  const coverUrl = profile.coverImage || DEFAULT_COVER;
  const accessLevel =
    profile.accessLevel ||
    (profile.isMe
      ? "SELF"
      : profile.relationship === "FRIEND"
        ? "FRIEND"
        : "STRANGER");

  const showOnlineBadge =
    accessLevel === "SELF" ||
    (accessLevel === "FRIEND" && Boolean(profile.isOnline));

  const joinedDate = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString(
        locale === "vi" ? "vi-VN" : "en-US",
        {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        },
      )
    : null;

  const handleCoverFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUploadCover(file);
    }
    e.target.value = "";
  };

  return (
    <div className="relative w-full">
      {/* Cover Image Area (Chuẩn Meta/Facebook) */}
      <div className="h-48 sm:h-64 md:h-76 w-full overflow-hidden relative shadow-sm rounded-b-none sm:rounded-b-3xl group/cover">
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent z-10 pointer-events-none" />
        <Image
          src={coverUrl}
          alt="Cover"
          fill
          priority
          unoptimized={Boolean(profile.coverImage)}
          onClick={() => setLightboxImage(coverUrl)}
          className="object-cover cursor-zoom-in transition-transform duration-500 group-hover/cover:scale-[1.01]"
        />

        {profile.isMe && (
          <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-6 z-20 flex items-center gap-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleCoverFileChange}
            />
            <PatternButton
              size="sm"
              variant="glass"
              rounded="full"
              isLoading={isUploadingCover}
              icon={<ImagePlus className="w-3.5 h-3.5" />}
              onClick={() => coverInputRef.current?.click()}
              className="bg-black/45 text-white border-white/30 hover:bg-black/65 text-xs"
            >
              {t("actions.changeCover")}
            </PatternButton>
            {profile.coverImage && (
              <PatternButton
                size="icon"
                variant="glass"
                color="danger"
                rounded="full"
                disabled={isUploadingCover}
                onClick={() => setIsConfirmDeleteCover(true)}
                className="h-8 w-8 bg-black/45 text-red-300 border-red-400/30 hover:bg-red-600/80 hover:text-white"
                title={t("actions.deleteCover")}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </PatternButton>
            )}
          </div>
        )}
      </div>

      {/* Khu vực Avatar + Thông tin + Nút hành động */}
      <div className="px-4 sm:px-6 md:px-10 -mt-14 sm:-mt-20 relative z-20 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 sm:gap-5 pb-6 border-b border-border/50">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 sm:gap-5 min-w-0 w-full md:w-auto">
          <div className="relative shrink-0">
            <button
              type="button"
              onClick={() =>
                profile.avatar && setLightboxImage(profile.avatar)
              }
              className="p-1.5 rounded-full bg-background/70 backdrop-blur-xl border border-white/20 shadow-xl block cursor-pointer relative"
            >
              <Avatar className="h-28 w-28 sm:h-36 sm:w-36 border-4 border-background shadow-inner">
                <AvatarImage
                  src={profile.avatar || undefined}
                  alt={profile.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-primary/10 text-primary">
                  {getInitials(profile.name || "U")}
                </AvatarFallback>
              </Avatar>

              {showOnlineBadge && (
                <span
                  title={t("onlineStatus.active")}
                  className="absolute bottom-2.5 right-2.5 h-4 w-4 sm:h-4.5 sm:w-4.5 rounded-full bg-emerald-500 ring-4 ring-background"
                />
              )}
            </button>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0 space-y-1.5 pb-1 w-full">
            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start max-w-full">
              <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight truncate max-w-full">
                {profile.name}
              </h1>
              {profile.alias && accessLevel === "FRIEND" && (
                <GlassBadge variant="accent" size="sm">
                  <Sparkles className="w-3 h-3" />
                  <span>({profile.alias})</span>
                </GlassBadge>
              )}
              {profile.isMe && (
                <GlassBadge variant="secondary" size="sm">
                  {t("youBadge")}
                </GlassBadge>
              )}
              {showOnlineBadge && !profile.isMe && (
                <GlassBadge variant="success" size="sm" dot pulse>
                  {t("onlineStatus.active")}
                </GlassBadge>
              )}
            </div>

            {/* Tiểu sử (Bio) cho Self và Friend */}
            {profile.bio && accessLevel !== "STRANGER" && (
              <p className="text-xs sm:text-sm text-foreground/85 max-w-xl leading-relaxed">
                {profile.bio}
              </p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
              {typeof profile.friendCount === "number" && (
                <span className="inline-flex items-center gap-1.5 font-medium text-foreground/80">
                  <Users className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span>
                    {t("friendCountLabel", { count: profile.friendCount })}
                  </span>
                </span>
              )}

              {accessLevel !== "STRANGER" && profile.email && (
                <span className="inline-flex items-center gap-1.5 break-all">
                  <Mail className="w-3.5 h-3.5 text-primary/80 shrink-0" />
                  <span>{profile.email}</span>
                </span>
              )}

              {accessLevel !== "STRANGER" && profile.role && (
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{profile.role}</span>
                </span>
              )}

              {accessLevel !== "STRANGER" && joinedDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t("joinedAt", { date: joinedDate })}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto flex justify-center md:justify-end">
          <ProfileActions
            profile={profile}
            onOpenEditModal={onOpenEditModal}
            onOpenPrivacyModal={onOpenPrivacyModal}
          />
        </div>
      </div>

      <GlassConfirmDialog
        open={isConfirmDeleteCover}
        onOpenChange={setIsConfirmDeleteCover}
        itemName={t("actions.deleteCover")}
        isLoading={isUploadingCover}
        onConfirm={async () => {
          await onDeleteCover();
          setIsConfirmDeleteCover(false);
        }}
      />

      <ImageLightboxModal
        open={Boolean(lightboxImage)}
        onOpenChange={(open) => !open && setLightboxImage(null)}
        images={
          lightboxImage
            ? [
                {
                  url: lightboxImage,
                  fileName: `${profile.name || "profile"}.jpg`,
                },
              ]
            : []
        }
        initialIndex={0}
      />
    </div>
  );
};
