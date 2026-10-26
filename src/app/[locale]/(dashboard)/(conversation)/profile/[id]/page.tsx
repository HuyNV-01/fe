"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
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
  LiquidGlass,
  LiquidGlassCard,
} from "@/components/liquid-glass/liquid-glass";
import { ContactStatusEnum } from "@/common/enum";

export default function UserProfilePage() {
  const params = useParams();
  const router = useRouter();
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
    if (profile.isMe) return "Tài khoản cá nhân của bạn";
    switch (profile.relationship) {
      case ContactStatusEnum.FRIEND:
        return "Đã là bạn bè";
      case ContactStatusEnum.PENDING_SENT:
        return "Đã gửi lời mời kết bạn";
      case ContactStatusEnum.PENDING_RECEIVED:
        return "Đang chờ bạn xác nhận kết bạn";
      default:
        return "Chưa kết bạn";
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
          <LiquidGlass
            interactive
            hover
            rounded="full"
            fluid={false}
            className="p-2 text-white"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </LiquidGlass>
        </div>

        <div className="max-w-5xl mx-auto pb-16">
          <ProfileHeader profile={profile} />

          {/* Thông tin chi tiết hồ sơ */}
          <div className="px-6 md:px-10 mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
            <LiquidGlassCard className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-primary" />
                <span>Thông tin tài khoản</span>
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Họ và tên</span>
                  <span className="font-semibold">{profile.name}</span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Email liên hệ</span>
                  <span className="font-mono text-xs">{profile.email}</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Mối quan hệ</span>
                  <span className="font-medium text-primary">
                    {getRelationshipLabel()}
                  </span>
                </div>
              </div>
            </LiquidGlassCard>

            <LiquidGlassCard className="p-5 space-y-3">
              <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Bảo mật & Trạng thái</span>
              </h3>
              <div className="space-y-2 text-xs sm:text-sm">
                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Trạng thái</span>
                  <span className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Đã kích hoạt
                  </span>
                </div>
                <div className="flex items-center justify-between py-1.5 border-b border-border/40">
                  <span className="text-muted-foreground">Mã hóa tin nhắn</span>
                  <span className="font-medium">AES-256-GCM / ECDH-P256</span>
                </div>
                <div className="flex items-center justify-between py-1.5">
                  <span className="text-muted-foreground">Xác thực</span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <Mail className="w-3.5 h-3.5" />
                    Email đã xác minh
                  </span>
                </div>
              </div>
            </LiquidGlassCard>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
