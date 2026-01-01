"use client";

import type React from "react";
import { useTranslations } from "next-intl";
import { useShallow } from "zustand/react/shallow";
import { Plus } from "lucide-react";

import { ChatSearch } from "./chat-search";
import { LiquidSearch } from "@/components/input/liquid-search";
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

  const { conversations } = useChatStore(
    useShallow((state) => ({
      conversations: state.conversations,
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
      <div className="w-full flex-none px-4 pt-5 pb-3 z-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-2 text-primary shrink-0">
              <currentConfig.icon className="size-5" />
            </div>
            <TruncatedText
              className="text-xl font-bold tracking-tight text-slate-900 dark:text-white"
              text={t(currentConfig.labelKey)}
            />
          </div>

          <div className="flex items-center gap-1">
            <BaseTooltip content={t("createNew")}>
              <PatternButton
                variant="ghost"
                size="icon"
                rounded="full"
                className="size-8 text-muted-foreground"
                onClick={handleAddNew}
              >
                <Plus className="size-4" />
              </PatternButton>
            </BaseTooltip>

            <BaseTooltip content={t(currentConfig.switchLabelKey)}>
              <PatternButton
                variant="glass"
                size="sm"
                rounded="full"
                color="primary"
                icon={<currentConfig.switchIcon className="size-4" />}
                iconPosition="right"
                onClick={handleSwitchMode}
                className="shadow-sm"
              >
                {t(currentConfig.switchLabelKey)}
              </PatternButton>
            </BaseTooltip>
          </div>
        </div>

        <div className="relative z-50 group">
          <ChatSearch />
        </div>
      </div>
      <LiquidSearch mode="command" />
      <div className="h-full w-full flex-1 min-h-0 overflow-hidden relative">
        {children}
      </div>

      <div className="flex-none px-4 py-2 border-t border-white/10 bg-white/5 backdrop-blur-sm text-[10px] text-muted-foreground flex justify-between rounded-tr-2xl">
        <span>{conversations.length} conversations</span>
        <span>Synced</span>
      </div>
    </div>
  );
}
