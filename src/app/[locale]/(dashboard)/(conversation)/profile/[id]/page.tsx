"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Info, Users, Image as ImageIcon } from "lucide-react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { useUserStore } from "@/lib/stores/user/use-user-store";
import { useStoreWait } from "@/utils/hooks/use-store-wait";

import { ProfileHeader } from "@/components/user/profile-header";
import { ProfileActions } from "@/components/user/profile-actions";
import { ProfileSkeleton } from "@/components/skeleton/profile-skeleton";

import { LiquidGlass } from "@/components/liquid-glass/liquid-glass";

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

  return (
    <div className="h-full w-full relative overflow-hidden">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="relative z-20 h-full w-full overflow-y-auto custom-scrollbar"
      >
        {/* Back Button */}
        <div className="absolute top-4 left-4 z-50 md:hidden">
          <LiquidGlass
            interactive
            hover
            rounded="full"
            className="p-2 text-white"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-5 h-5" />
          </LiquidGlass>
        </div>

        <div className="max-w-7xl mx-auto pb-20">
          <ProfileHeader profile={profile} />

          {/* Action Bar Wrapper */}
          <div className="px-6 md:px-12 relative z-30 mt-6 md:-mt-14 pointer-events-none flex justify-center md:justify-end">
            <div className="pointer-events-auto">
              <ProfileActions profile={profile} />
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
