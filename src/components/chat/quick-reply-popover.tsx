/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Film,
  ImageIcon,
  Layers,
  Pin,
  Settings2,
  ShoppingBag,
  Tag,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  GlassBadge,
  GlassIconButton,
  LiquidGlass,
  ScrollArea,
} from "@/components/toolkit";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import { cn } from "@/lib/utils";
import type {
  IQuickReplyAttachmentItem,
  IQuickReplyProductCard,
  IQuickReplyTemplate,
  QuickReplyInteractionType,
} from "@/types/chat";

export interface QuickReplyPopoverProps {
  open: boolean;
  query: string;
  shopId: string;
  conversationId?: string;
  customerName?: string;
  agentName?: string;
  pageName?: string;
  interactionType?: QuickReplyInteractionType;
  channelType?: string;
  activeTagIds?: string[];
  onSelectQuickReply: (
    interpolatedText: string,
    template: IQuickReplyTemplate,
    productCards?: IQuickReplyProductCard[],
    extra?: {
      attachments?: IQuickReplyAttachmentItem[];
      interpolatedSequence?: Array<{
        order: number;
        content: string;
        delayMs: number;
        attachments?: IQuickReplyAttachmentItem[];
      }>;
      autoAssignTagIds?: string[];
    },
  ) => void;
  onOpenManageModal?: () => void;
  onClose?: () => void;
}

export const QuickReplyPopover = ({
  open,
  query,
  shopId,
  conversationId,
  customerName,
  agentName,
  pageName,
  interactionType,
  channelType,
  activeTagIds,
  onSelectQuickReply,
  onOpenManageModal,
  onClose,
}: QuickReplyPopoverProps) => {
  const t = useTranslations("QuickReplies");
  const templates = useTagStore((s) => s.quickReplyTemplates);
  const interpolateQuickReply = useTagStore((s) => s.interpolateQuickReply);

  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [highlightedIndex, setHighlightedIndex] = useState<number>(0);

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const tpl of templates) {
      if (tpl.category) set.add(tpl.category);
    }
    return ["ALL", ...Array.from(set)];
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const cleanQ = query.replace(/^\/+/, "").trim().toLowerCase();
    const activeTagsSet = new Set(activeTagIds || []);

    return templates
      .filter((tpl) => {
        if (selectedCategory !== "ALL" && tpl.category !== selectedCategory) {
          return false;
        }
        const ctx = tpl.usageContextJson;
        if (
          interactionType &&
          ctx?.interactionTypes?.length &&
          !ctx.interactionTypes.includes(interactionType)
        ) {
          return false;
        }
        if (
          channelType &&
          ctx?.channelTypes?.length &&
          !ctx.channelTypes.includes(channelType)
        ) {
          return false;
        }
        if (!cleanQ) return true;
        const contextTagsJoined = (ctx?.contextTags || [])
          .join(" ")
          .toLowerCase();
        return (
          tpl.shortcut.toLowerCase().includes(cleanQ) ||
          tpl.title.toLowerCase().includes(cleanQ) ||
          tpl.contentTemplate.toLowerCase().includes(cleanQ) ||
          contextTagsJoined.includes(cleanQ)
        );
      })
      .sort((a, b) => {
        const tagScoreA = (a.usageContextJson?.applicableTagIds || []).filter(
          (id) => activeTagsSet.has(id),
        ).length;
        const tagScoreB = (b.usageContextJson?.applicableTagIds || []).filter(
          (id) => activeTagsSet.has(id),
        ).length;
        if (tagScoreB !== tagScoreA) return tagScoreB - tagScoreA;
        return Number(Boolean(b.isPinned)) - Number(Boolean(a.isPinned));
      });
  }, [
    templates,
    query,
    selectedCategory,
    interactionType,
    channelType,
    activeTagIds,
  ]);

  useEffect(() => {
    setHighlightedIndex(0);
  }, [query, selectedCategory, open]);

  const handlePick = async (tpl: IQuickReplyTemplate) => {
    const res = await interpolateQuickReply(shopId, tpl.id, {
      conversationId,
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

    onSelectQuickReply(
      resolvedContent,
      tpl,
      tpl.productCardsJson || undefined,
      {
        attachments: res?.attachments || tpl.attachmentsJson || [],
        interpolatedSequence: res?.interpolatedSequence,
        autoAssignTagIds: res?.autoAssignTagIds,
      },
    );
  };

  useEffect(() => {
    if (!open || filteredTemplates.length === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % filteredTemplates.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setHighlightedIndex(
          (prev) =>
            (prev - 1 + filteredTemplates.length) % filteredTemplates.length,
        );
      } else if (e.key === "Enter" && !e.shiftKey) {
        const picked = filteredTemplates[highlightedIndex];
        if (picked) {
          e.preventDefault();
          void handlePick(picked);
        }
      } else if (e.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, filteredTemplates, highlightedIndex]);

  if (!open || filteredTemplates.length === 0) return null;

  return (
    <LiquidGlass
      variant="primary"
      blur="xl"
      opacity="95"
      rounded="2xl"
      isolate={false}
      className="absolute bottom-full left-0 mb-2 w-88 sm:w-[460px] max-w-[calc(100vw-2rem)] p-2.5 border shadow-xl z-40"
    >
      <div className="flex items-center justify-between px-1.5 pb-1.5 mb-1.5 border-b border-border/40">
        <div className="flex items-center gap-1.5 text-xs font-bold text-primary">
          <Zap className="w-3.5 h-3.5" />
          <span>{t("popoverTitle")}</span>
          <span className="text-[10px] font-normal text-muted-foreground">
            (↑↓ / Enter)
          </span>
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

      {categories.length > 2 && (
        <div className="flex items-center gap-1 overflow-x-auto pb-1.5 mb-1 no-scrollbar">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                "px-2 py-0.5 rounded-lg text-[10px] font-semibold whitespace-nowrap transition-colors cursor-pointer",
                selectedCategory === cat
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted/60 text-muted-foreground hover:bg-muted",
              )}
            >
              {cat === "ALL" ? t("categories.all") : cat}
            </button>
          ))}
        </div>
      )}

      <ScrollArea className="max-h-72 pr-1">
        <div className="space-y-1">
          {filteredTemplates.map((tpl, idx) => {
            const seqCount = Array.isArray(tpl.messageSequenceJson)
              ? tpl.messageSequenceJson.length
              : 0;
            const autoTagCount = Array.isArray(tpl.autoAssignTagIdsJson)
              ? tpl.autoAssignTagIdsJson.length
              : 0;
            const imageCount = (tpl.attachmentsJson || []).filter(
              (a) =>
                a.mediaType === "IMAGE" ||
                (a.mimeType || "").startsWith("image/"),
            ).length;
            const videoCount = (tpl.attachmentsJson || []).filter(
              (a) =>
                a.mediaType === "VIDEO" ||
                (a.mimeType || "").startsWith("video/"),
            ).length;

            return (
              <button
                key={tpl.id}
                type="button"
                onMouseEnter={() => setHighlightedIndex(idx)}
                onClick={() => handlePick(tpl)}
                className={cn(
                  "w-full text-left p-2 rounded-xl transition-colors cursor-pointer space-y-1",
                  idx === highlightedIndex
                    ? "bg-primary/15 ring-1 ring-primary/30"
                    : "hover:bg-primary/10",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 min-w-0">
                    {tpl.isPinned && (
                      <Pin className="w-3 h-3 text-amber-500 shrink-0" />
                    )}
                    <span className="font-mono text-xs font-bold text-primary">
                      /{tpl.shortcut}
                    </span>
                    <span className="text-[11px] font-semibold text-foreground truncate">
                      {tpl.title}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    {imageCount > 0 && (
                      <GlassBadge variant="primary" size="sm">
                        <ImageIcon className="w-2.5 h-2.5 mr-0.5 inline" />
                        {imageCount}
                      </GlassBadge>
                    )}
                    {videoCount > 0 && (
                      <GlassBadge variant="warning" size="sm">
                        <Film className="w-2.5 h-2.5 mr-0.5 inline" />
                        {videoCount}
                      </GlassBadge>
                    )}
                    {seqCount > 1 && (
                      <GlassBadge variant="info" size="sm">
                        <Layers className="w-2.5 h-2.5 mr-0.5 inline" />
                        {seqCount}
                      </GlassBadge>
                    )}
                    {tpl.productCardsJson &&
                      tpl.productCardsJson.length > 0 && (
                        <GlassBadge variant="info" size="sm">
                          <ShoppingBag className="w-2.5 h-2.5 mr-0.5 inline" />
                          {tpl.productCardsJson.length}
                        </GlassBadge>
                      )}
                    {autoTagCount > 0 && (
                      <GlassBadge variant="success" size="sm">
                        <Tag className="w-2.5 h-2.5 mr-0.5 inline" />
                        {autoTagCount}
                      </GlassBadge>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground line-clamp-2">
                  {tpl.contentTemplate}
                </p>
              </button>
            );
          })}
        </div>
      </ScrollArea>
    </LiquidGlass>
  );
};
