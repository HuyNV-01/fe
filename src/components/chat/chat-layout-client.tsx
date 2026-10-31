"use client";

import { useParams, useRouter } from "next/navigation";
import ChatSidebar from "@/components/chat/chat-sidebar";
import type React from "react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePathname } from "@/i18n/navigation";
import type { TSidebarViewMode } from "@/types/common";
import { VIEW_CONFIG } from "@/constant/chat";
import config from "@/config";
import { LiquidGlassCard } from "@/components/toolkit";
import { STATIC_DETAIL_ROUTES } from "@/constant";

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
    const config = VIEW_CONFIG[viewMode];
    router.push(config.targetRoute);
    setViewMode(config.targetMode);
  }, [viewMode, router]);

  return (
    <div className="h-full w-full p-0 sm:p-1 sm:pt-0 overflow-hidden">
      <LiquidGlassCard
        texture="grid"
        rounded="2xl"
        className="h-full w-full overflow-hidden rounded-none sm:rounded-2xl border-0 sm:border"
      >
        <div className="h-full w-full flex flex-row items-stretch overflow-hidden">
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
