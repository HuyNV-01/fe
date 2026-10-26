"use client";

import type React from "react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { UserPlus, UsersRound } from "lucide-react";

import { ChatSearch } from "./chat-search";
import { CreateGroupModal } from "./create-group-modal";
import { PatternButton } from "@/components/button/button-patterns";
import { BaseTooltip } from "@/components/tooltip/base-tooltip";

import { useChatStore } from "@/lib/stores/chat/use-chat-store";
import { cn } from "@/lib/utils";
import type { TSidebarViewMode } from "@/types/common";
import { VIEW_CONFIG } from "@/constant/chat";
import { useRouter } from "@/i18n/navigation";
import config from "@/config";
import { TruncatedText } from "../common/truncated-text";

export default function ChatSidebar({
  children,
  handleSwitchMode,
  viewMode,
}: {
  children: React.ReactNode;
  handleSwitchMode: () => void;
  viewMode: TSidebarViewMode;
}) {
  const t = useTranslations("Chat.Sidebar.header.title");
  const router = useRouter();
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  const { conversations, isSocketConnected } = useChatStore(
    useShallow((state) => ({
      conversations: state.conversations,
      isSocketConnected: state.isSocketConnected,
    })),
  );

  const currentConfig = VIEW_CONFIG[viewMode];

  const handleAddNew = () => {
    router.push(`${config.routes.private.addNew}`);
  };

  return (
    <div
      className={cn(
        "w-full h-full flex flex-col items-start overflow-hidden border-r transition-all duration-300",
      )}
    >
      <div className="w-full flex-none px-4 pt-4 pb-3 z-20">
        <div className="flex items-center justify-between gap-2 mb-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 rounded-xl bg-primary/10 text-primary shrink-0">
              <currentConfig.icon className="size-5" />
            </div>
            <TruncatedText
              className="text-lg font-bold tracking-tight text-slate-900 dark:text-white"
              text={t(currentConfig.labelKey)}
            />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <BaseTooltip content={t("createNew")}>
              <PatternButton
                variant="ghost"
                size="icon"
                rounded="full"
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={handleAddNew}
              >
                <UserPlus className="size-4" />
              </PatternButton>
            </BaseTooltip>

            <BaseTooltip content="Tạo nhóm trò chuyện">
              <PatternButton
                variant="ghost"
                size="icon"
                rounded="full"
                className="size-8 text-muted-foreground hover:text-foreground"
                onClick={() => setIsGroupModalOpen(true)}
              >
                <UsersRound className="size-4" />
              </PatternButton>
            </BaseTooltip>

            <BaseTooltip content={t(currentConfig.switchLabelKey)}>
              <PatternButton
                variant="glass"
                size="sm"
                rounded="full"
                color="primary"
                icon={<currentConfig.switchIcon className="size-3.5" />}
                iconPosition="right"
                onClick={handleSwitchMode}
                className="shadow-xs px-2.5"
              >
                {t(currentConfig.switchLabelKey)}
              </PatternButton>
            </BaseTooltip>
          </div>
        </div>

        <div className="relative z-30 group">
          <ChatSearch />
        </div>
      </div>

      <div className="h-full w-full flex-1 min-h-0 overflow-hidden relative z-10">
        {children}
      </div>

      <div className="w-full flex-none px-4 py-2 border-t border-border/50 bg-background/40 backdrop-blur-sm text-[11px] text-muted-foreground flex items-center justify-between">
        <span>{conversations.length} cuộc trò chuyện</span>
        <span className="inline-flex items-center gap-1.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              isSocketConnected
                ? "bg-emerald-500"
                : "bg-amber-500 animate-pulse",
            )}
          />
          {isSocketConnected ? "Trực tuyến" : "Đang đồng bộ..."}
        </span>
      </div>

      <CreateGroupModal
        open={isGroupModalOpen}
        onOpenChange={setIsGroupModalOpen}
        mode="create"
      />
    </div>
  );
}
