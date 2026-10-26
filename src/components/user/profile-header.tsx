"use client";

import Image from "next/image";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Mail, Shield, Calendar } from "lucide-react";
import type { IUserProfile } from "@/types/profile";
import { ProfileActions } from "./profile-actions";
import { getInitials } from "@/utils/helper";
import { useLocale, useTranslations } from "next-intl";

interface ProfileHeaderProps {
  profile: IUserProfile;
}

export const ProfileHeader = ({ profile }: ProfileHeaderProps) => {
  const t = useTranslations("Profile");
  const locale = useLocale();

  const DEFAULT_COVER =
    "https://images.unsplash.com/photo-1614850523060-8da1d56ae167?q=80&w=2070&auto=format&fit=crop";

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

  return (
    <div className="relative w-full">
      {/* Cover Image Area */}
      <div className="h-44 sm:h-60 md:h-68 w-full overflow-hidden relative shadow-xs">
        <div className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent z-10" />
        <Image
          src={DEFAULT_COVER}
          alt="Cover"
          fill
          priority
          className="object-cover"
        />
      </div>

      {/* Khu vực Avatar + Thông tin + Nút hành động nằm trên cùng một bố cục chuẩn */}
      <div className="px-4 sm:px-6 md:px-10 -mt-14 sm:-mt-20 relative z-20 flex flex-col md:flex-row items-center md:items-end justify-between gap-4 sm:gap-5 pb-6 border-b border-border/50">
        <div className="flex flex-col md:flex-row items-center md:items-end gap-4 sm:gap-5 min-w-0 w-full md:w-auto">
          <div className="relative shrink-0">
            <div className="p-1.5 rounded-full bg-background/60 backdrop-blur-xl border border-white/20 shadow-xl">
              <Avatar className="h-24 w-24 sm:h-34 sm:w-34 border-4 border-background shadow-inner">
                <AvatarImage
                  src={profile.avatar || undefined}
                  alt={profile.name}
                  className="object-cover"
                />
                <AvatarFallback className="text-2xl sm:text-3xl font-bold bg-primary/10 text-primary">
                  {getInitials(profile.name || "U")}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>

          <div className="flex flex-col items-center md:items-start text-center md:text-left min-w-0 space-y-1.5 pb-1 w-full">
            <div className="flex items-center gap-2 flex-wrap justify-center md:justify-start max-w-full">
              <h1 className="text-xl sm:text-3xl font-bold text-foreground tracking-tight truncate max-w-full">
                {profile.name}
              </h1>
              {profile.isMe && (
                <Badge variant="secondary" className="text-[11px] rounded-full">
                  {t("youBadge")}
                </Badge>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-x-4 gap-y-1 text-xs sm:text-sm text-muted-foreground">
              {profile.email && (
                <span className="inline-flex items-center gap-1.5 break-all">
                  <Mail className="w-3.5 h-3.5 text-primary/80 shrink-0" />
                  <span>{profile.email}</span>
                </span>
              )}
              {profile.role && (
                <span className="inline-flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                  <span>{profile.role}</span>
                </span>
              )}
              {joinedDate && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>{t("joinedAt", { date: joinedDate })}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="shrink-0 w-full md:w-auto flex justify-center md:justify-end">
          <ProfileActions profile={profile} />
        </div>
      </div>
    </div>
  );
};
