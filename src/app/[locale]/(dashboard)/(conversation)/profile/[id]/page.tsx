"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import {
  CheckCircle2,
  Mail,
  ShieldCheck,
  UserCheck,
} from "lucide-react";
import { motion } from "framer-motion";

import { useUserStore } from "@/lib/stores/user/use-user-store";
import { useStoreWait } from "@/utils/hooks/use-store-wait";

import { ProfileHeader } from "@/components/user/profile-header";
import { ProfileSkeleton } from "@/components/skeleton/profile-skeleton";
import {
  GlassSurfaceCard,
  ButtonBack,
} from "@/components/toolkit";
import { ContactStatusEnum } from "@/common/enum";
import { useTranslations } from "next-intl";

export default function UserProfilePage() {
  const params = useParams();
  const t = useTranslations("Profile");
  const { profile, fetchProfile, status, resetProfile } = useUserStore();

  const userId = params.id as string;
  const isStoreLoading = useStoreWait(status);

  useEffect(() => {
    if (userId) {
      fetchProfile(userId);
    }
    return () => resetProfile();
  }, [userId, fetchProfile, resetProfile]);

  if (isStoreLoading || !profile) {
    return <ProfileSkeleton />;
  }

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

  return (
    <div className="h-full w-full relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="relative z-20 h-full w-full overflow-y-auto custom-scrollbar"
      >
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-30 md:hidden">
          <ButtonBack />
        </div>

        <div className="max-w-5xl mx-auto pb-16">
          <ProfileHeader profile={profile} />

          {/* Thông tin chi tiết hồ sơ */}
          <div className="px-4 sm:px-6 md:px-10 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <GlassSurfaceCard
              header={
                <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-primary" />
                  <span>{t("accountInfo.title")}</span>
                </h3>
              }
            >
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground shrink-0">
                    {t("accountInfo.fullName")}
                  </span>
                  <span className="font-semibold truncate">{profile.name}</span>
                </div>
                <div className="flex items-center justify-between gap-2 py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground shrink-0">
                    {t("accountInfo.email")}
                  </span>
                  <span className="font-mono text-xs truncate">
                    {profile.email}
                  </span>
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
        </div>
      </motion.div>
    </div>
  );
}
