// File: src/components/chat/chat-layout-client.tsx
"use client";

import { useParams, useRouter } from "next/navigation";
import ChatSidebar from "@/components/chat/chat-sidebar";
import { ChannelShopRail } from "@/components/chat/channel-shop-rail";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import type { TSidebarViewMode } from "@/types/common";
import { VIEW_CONFIG } from "@/constant/chat";
import config from "@/config";
import { LiquidGlassCard } from "@/components/toolkit";
import { STATIC_DETAIL_ROUTES } from "@/constant";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useChannelWorkspaceStore } from "@/lib/stores/channel/use-channel-workspace-store";

export default function ChatLayoutClient({
  children,
  sidebar,
  option,
}: {
  children: React.ReactNode;
  sidebar: React.ReactNode;
  option: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const router = useRouter();

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const channels = useChannelWorkspaceStore((s) => s.channels);
  const selectedChannelIds = useChannelWorkspaceStore(
    (s) => s.selectedChannelIds,
  );
  const isMergeMode = useChannelWorkspaceStore((s) => s.isMergeMode);
  const fetchShopChannels = useChannelWorkspaceStore(
    (s) => s.fetchShopChannels,
  );
  const selectSingleChannel = useChannelWorkspaceStore(
    (s) => s.selectSingleChannel,
  );
  const toggleMergeChannel = useChannelWorkspaceStore(
    (s) => s.toggleMergeChannel,
  );
  const selectAllChannelsMerge = useChannelWorkspaceStore(
    (s) => s.selectAllChannelsMerge,
  );

  useEffect(() => {
    if (activeShopId) {
      fetchShopChannels(activeShopId);
    }
  }, [activeShopId, fetchShopChannels]);

  const isDetailPage = useMemo(() => {
    if (params.id) return true;

    if (pathname) {
      return STATIC_DETAIL_ROUTES.some((route) =>
        pathname.includes(`/${route}`),
      );
    }

    return false;
  }, [params.id, pathname]);

  const [viewMode, setViewMode] = useState<TSidebarViewMode>(() => {
    if (pathname?.includes(`${config.routes.private.contacts}`))
      return "CONTACTS";
    return "CHAT";
  });

  useEffect(() => {
    if (pathname?.includes(`${config.routes.private.contacts}`))
      setViewMode("CONTACTS");
    else if (pathname?.includes(`${config.routes.private.chat}`))
      setViewMode("CHAT");
  }, [pathname]);

  const handleSwitchMode = useCallback(() => {
    const cfg = VIEW_CONFIG[viewMode];
    router.push(cfg.targetRoute);
    setViewMode(cfg.targetMode);
  }, [viewMode, router]);

  return (
    <div className="h-full w-full p-0 sm:p-1 sm:pt-0 overflow-hidden">
      <LiquidGlassCard
        texture="grid"
        rounded="2xl"
        className="h-full w-full overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border"
      >
        <div className="h-full w-full flex flex-row items-stretch overflow-hidden">
          {activeShopId && channels.length > 0 && (
            <ChannelShopRail
              channels={channels}
              selectedChannelIds={selectedChannelIds}
              isMergeMode={isMergeMode}
              onSelectSingleChannel={selectSingleChannel}
              onToggleMergeChannel={toggleMergeChannel}
              onSelectAllChannelsMerge={selectAllChannelsMerge}
            />
          )}

          <aside
            className={`
              h-full flex-none border-r border-white/15 dark:border-white/5
              w-full md:w-[320px] lg:w-[350px] xl:w-[380px]
              ${isDetailPage ? "hidden md:flex" : "flex"}
            `}
          >
            <ChatSidebar
              handleSwitchMode={handleSwitchMode}
              viewMode={viewMode}
            >
              {viewMode === "CHAT" && sidebar}
              {viewMode === "CONTACTS" && option}
            </ChatSidebar>
          </aside>

          <div
            className={`
              flex-1 h-full min-w-0 min-h-0 overflow-hidden relative
              ${isDetailPage ? "flex" : "hidden md:flex"}
            `}
          >
            {children}
          </div>
        </div>
      </LiquidGlassCard>
    </div>
  );
}
