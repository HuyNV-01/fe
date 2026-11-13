"use client";

import React, { useEffect } from "react";
import { Bookmark, Settings2, Tag } from "lucide-react";
import { useTranslations } from "next-intl";
import { BaseTooltip, GlassIconButton } from "@/components/toolkit";
import { PermissionGate } from "@/components/iam/permission-gate";
import { cn } from "@/lib/utils";
import type { ICustomTag } from "@/types/chat";

export interface QuickTagShortcutBarProps {
  tags: ICustomTag[];
  activeTagIds: string[];
  bookmarkedCount?: number;
  onToggleTag: (tagId: string) => void;
  onOpenTagManager?: () => void;
  onOpenBookmarksSheet?: () => void;
}

export const QuickTagShortcutBar = ({
  tags,
  activeTagIds,
  bookmarkedCount = 0,
  onToggleTag,
  onOpenTagManager,
  onOpenBookmarksSheet,
}: QuickTagShortcutBarProps) => {
  const t = useTranslations("TaggingSystem");

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      const isInputFocused =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      if (e.key >= "1" && e.key <= "9") {
        if (e.altKey || !isInputFocused) {
          const matched = tags.find((tag) => tag.shortcutKey === e.key);
          if (matched) {
            e.preventDefault();
            onToggleTag(matched.id);
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [tags, onToggleTag]);

  const conversationTags = tags.filter(
    (tag) =>
      !tag.applicableScopesJson ||
      tag.applicableScopesJson.length === 0 ||
      tag.applicableScopesJson.includes("CONVERSATION"),
  );

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-1.5 border-b border-border/40 bg-muted/15">
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide min-w-0 flex-1">
        <Tag className="w-3.5 h-3.5 text-muted-foreground shrink-0 mr-1" />
        {conversationTags.map((tag) => {
          const isActive = activeTagIds.includes(tag.id);
          const buttonNode = (
            <button
              key={tag.id}
              type="button"
              onClick={() => onToggleTag(tag.id)}
              style={
                isActive
                  ? {
                      backgroundColor: tag.colorOklch || tag.colorHex,
                      color: "#fff",
                    }
                  : {
                      borderColor: tag.colorOklch || tag.colorHex,
                    }
              }
              className={cn(
                "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap select-none border",
                isActive
                  ? "border-transparent shadow-2xs scale-105"
                  : "border-border/60 text-muted-foreground hover:text-foreground bg-background/60",
              )}
            >
              <span
                className="w-1.5 h-1.5 rounded-full shrink-0"
                style={{
                  backgroundColor: isActive
                    ? "#fff"
                    : tag.colorOklch || tag.colorHex,
                }}
              />
              <span>{tag.name}</span>
              {tag.shortcutKey && (
                <kbd className="text-[9px] opacity-80 font-mono">
                  Alt+{tag.shortcutKey}
                </kbd>
              )}
            </button>
          );

          return tag.shortcutKey ? (
            <BaseTooltip
              key={tag.id}
              content={t("shortcutHint", { key: tag.shortcutKey })}
            >
              {buttonNode}
            </BaseTooltip>
          ) : (
            buttonNode
          );
        })}
      </div>

      <div className="flex items-center gap-1 shrink-0">
        {onOpenBookmarksSheet && (
          <GlassIconButton
            size="sm"
            variant="ghost"
            badgeCount={bookmarkedCount}
            tooltip={t("bookmarksDrawer.openTooltip")}
            className="h-7 w-7 text-sky-500 hover:bg-sky-500/10"
            icon={<Bookmark className="w-3.5 h-3.5" />}
            onClick={onOpenBookmarksSheet}
          />
        )}

        {onOpenTagManager && (
          <PermissionGate can="TAG_SCHEMA_CREATE_EDIT" mode="hide">
            <GlassIconButton
              size="sm"
              variant="ghost"
              tooltip={t("managerModal.openTooltip")}
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              icon={<Settings2 className="w-3.5 h-3.5" />}
              onClick={onOpenTagManager}
            />
          </PermissionGate>
        )}
      </div>
    </div>
  );
};
