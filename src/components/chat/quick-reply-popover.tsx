"use client";

import React, { useMemo } from "react";
import { Zap, ShoppingBag, Settings2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  LiquidGlass,
  GlassBadge,
  GlassIconButton,
  ScrollArea,
} from "@/components/toolkit";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import type { IQuickReplyProductCard, IQuickReplyTemplate } from "@/types/chat";

export interface QuickReplyPopoverProps {
  open: boolean;
  query: string;
  shopId: string;
  customerName?: string;
  agentName?: string;
  pageName?: string;
  onSelectQuickReply: (
    interpolatedText: string,
    template: IQuickReplyTemplate,
    productCards?: IQuickReplyProductCard[],
  ) => void;
  onOpenManageModal?: () => void;
}

export const QuickReplyPopover = ({
  open,
  query,
  shopId,
  customerName,
  agentName,
  pageName,
  onSelectQuickReply,
  onOpenManageModal,
}: QuickReplyPopoverProps) => {
  const t = useTranslations("QuickReplies");
  const templates = useTagStore((s) => s.quickReplyTemplates);
  const interpolateQuickReply = useTagStore((s) => s.interpolateQuickReply);

  const filteredTemplates = useMemo(() => {
    const cleanQ = query.replace(/^\/+/, "").trim().toLowerCase();
    if (!cleanQ) return templates;
    return templates.filter(
      (tpl) =>
        tpl.shortcut.toLowerCase().includes(cleanQ) ||
        tpl.title.toLowerCase().includes(cleanQ) ||
        tpl.contentTemplate.toLowerCase().includes(cleanQ),
    );
  }, [templates, query]);

  if (!open || filteredTemplates.length === 0) return null;

  const handlePick = async (tpl: IQuickReplyTemplate) => {
    const res = await interpolateQuickReply(shopId, tpl.id, {
      customerName: customerName || "anh/chị",
      salutation: "anh/chị",
      agentName: agentName || "Tư vấn viên",
      pageName: pageName || "Fanpage",
    });

    const resolvedContent =
      res?.interpolatedContent ||
      tpl.contentTemplate
        .replace(/\{\{\s*customer_name\s*\}\}/gi, customerName || "anh/chị")
        .replace(/\{\{\s*salutation\s*\}\}/gi, "anh/chị")
        .replace(/\{\{\s*agent_name\s*\}\}/gi, agentName || "Tư vấn viên")
        .replace(/\{\{\s*page_name\s*\}\}/gi, pageName || "Fanpage");

    onSelectQuickReply(resolvedContent, tpl, tpl.productCardsJson || undefined);
  };

  return (
    <LiquidGlass
      variant="primary"
      blur="xl"
      opacity="95"
      rounded="2xl"
      isolate={false}
      className="absolute bottom-full left-0 mb-2 w-80 sm:w-96 max-w-[calc(100vw-2rem)] p-2 border shadow-xl z-40"
    >
      <div className="flex items-center justify-between px-2 pb-1.5 mb-1 border-b border-border/40">
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
          <Zap className="w-3.5 h-3.5" />
          <span>{t("popoverTitle")}</span>
        </div>
        {onOpenManageModal && (
          <GlassIconButton
            size="sm"
            variant="ghost"
            className="h-6 w-6"
            icon={<Settings2 className="w-3.5 h-3.5" />}
            onClick={onOpenManageModal}
          />
        )}
      </div>

      <ScrollArea className="max-h-56 pr-1">
        <div className="space-y-1">
          {filteredTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handlePick(tpl)}
              className="w-full text-left p-2 rounded-xl hover:bg-primary/10 transition-colors cursor-pointer space-y-1"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs font-bold text-primary">
                  /{tpl.shortcut}
                </span>
                <div className="flex items-center gap-1">
                  {tpl.productCardsJson && tpl.productCardsJson.length > 0 && (
                    <GlassBadge variant="info" size="sm">
                      <ShoppingBag className="w-2.5 h-2.5 mr-1 inline" />
                      {tpl.productCardsJson.length}
                    </GlassBadge>
                  )}
                  <span className="text-[11px] font-semibold text-foreground truncate max-w-36">
                    {tpl.title}
                  </span>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground line-clamp-2">
                {tpl.contentTemplate}
              </p>
            </button>
          ))}
        </div>
      </ScrollArea>
    </LiquidGlass>
  );
};
