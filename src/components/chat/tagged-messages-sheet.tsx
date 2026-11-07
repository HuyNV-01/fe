"use client";

import React, { useEffect, useState } from "react";
import { Bookmark, CornerDownRight, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  GlassSheet,
  GlassSurfaceCard,
  GlassTabs,
  GlassBadge,
  GlassEmptyState,
  GlassIconButton,
  PatternButton,
} from "@/components/toolkit";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import { useDateFormat } from "@/utils/hooks/use-date-format";

export interface TaggedMessagesSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
  conversationId: string;
  onJumpToMessage?: (messageId: string) => void;
}

export const TaggedMessagesSheet = ({
  open,
  onOpenChange,
  shopId,
  conversationId,
  onJumpToMessage,
}: TaggedMessagesSheetProps) => {
  const t = useTranslations("TaggingSystem");
  const { toFullDateTime } = useDateFormat();
  const [selectedTagId, setSelectedTagId] = useState<string>("ALL");

  const tags = useTagStore((s) => s.tags);
  const bookmarkedMessagesByConv = useTagStore(
    (s) => s.bookmarkedMessagesByConv,
  );
  const fetchBookmarkedMessages = useTagStore((s) => s.fetchBookmarkedMessages);
  const toggleMessageBookmarkTag = useTagStore(
    (s) => s.toggleMessageBookmarkTag,
  );

  useEffect(() => {
    if (open && shopId && conversationId) {
      fetchBookmarkedMessages(
        shopId,
        conversationId,
        selectedTagId === "ALL" ? undefined : selectedTagId,
      );
    }
  }, [open, shopId, conversationId, selectedTagId, fetchBookmarkedMessages]);

  const bookmarkTags = tags.filter(
    (tag) =>
      tag.category === "MESSAGE_BOOKMARK" ||
      tag.applicableScopesJson?.includes("MESSAGE"),
  );

  const allItems = bookmarkedMessagesByConv[conversationId] || [];
  const filteredItems =
    selectedTagId === "ALL"
      ? allItems
      : allItems.filter((item) => item.tagId === selectedTagId);

  return (
    <GlassSheet
      open={open}
      onOpenChange={onOpenChange}
      side="right"
      title={t("bookmarksDrawer.title")}
      description={t("bookmarksDrawer.description")}
      headerExtra={
        <div className="pt-2">
          <GlassTabs
            size="sm"
            value={selectedTagId}
            onValueChange={setSelectedTagId}
            items={[
              {
                key: "ALL",
                label: t("bookmarksDrawer.allFilter"),
                badge: allItems.length,
              },
              ...bookmarkTags.map((bTag) => ({
                key: bTag.id,
                label: bTag.name,
                badge: allItems.filter((i) => i.tagId === bTag.id).length,
              })),
            ]}
          />
        </div>
      }
    >
      <div className="space-y-2.5">
        {filteredItems.length === 0 ? (
          <GlassEmptyState
            icon={<Bookmark className="w-6 h-6" />}
            title={t("bookmarksDrawer.emptyTitle")}
            description={t("bookmarksDrawer.emptyDesc")}
          />
        ) : (
          filteredItems.map((item) => (
            <GlassSurfaceCard key={item.assignmentId} className="p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold text-white"
                  style={{
                    backgroundColor: item.colorOklch || item.colorHex,
                  }}
                >
                  <Bookmark className="w-3 h-3" />
                  <span>{item.tagName}</span>
                </span>
                <span className="text-[10px] text-muted-foreground">
                  {toFullDateTime(item.createdAt)}
                </span>
              </div>

              <p className="text-xs text-foreground leading-relaxed bg-muted/40 p-2.5 rounded-xl border border-border/40 break-words">
                {item.messageSnippetPreview || ""}
              </p>

              {item.noteText && (
                <GlassBadge variant="warning" size="sm">
                  {item.noteText}
                </GlassBadge>
              )}

              <div className="flex items-center justify-between pt-1">
                {onJumpToMessage && (
                  <PatternButton
                    variant="ghost"
                    color="primary"
                    size="sm"
                    rounded="full"
                    className="h-7 px-2.5 text-xs"
                    icon={<CornerDownRight className="w-3.5 h-3.5" />}
                    onClick={() => {
                      onJumpToMessage(item.messageId);
                      onOpenChange(false);
                    }}
                  >
                    {t("bookmarksDrawer.jumpToMessageBtn")}
                  </PatternButton>
                )}

                <GlassIconButton
                  size="sm"
                  variant="ghost"
                  color="danger"
                  className="h-7 w-7 text-destructive"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() =>
                    toggleMessageBookmarkTag({
                      shopId,
                      conversationId: item.conversationId,
                      messageId: item.messageId,
                      tagId: item.tagId,
                    })
                  }
                />
              </div>
            </GlassSurfaceCard>
          ))
        )}
      </div>
    </GlassSheet>
  );
};
