/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";

import React, { useEffect, useState } from "react";
import { Zap, Plus, Trash2, Pencil } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassBadge,
  GlassIconButton,
  PatternButton,
} from "@/components/toolkit";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import type { IQuickReplyTemplate } from "@/types/chat";

export default function SettingsQuickRepliesPage() {
  const t = useTranslations("QuickReplies");
  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const templates = useTagStore((s) => s.quickReplyTemplates);
  const fetchQuickReplies = useTagStore((s) => s.fetchQuickReplies);
  const createQuickReply = useTagStore((s) => s.createQuickReply);
  const updateQuickReply = useTagStore((s) => s.updateQuickReply);
  const deleteQuickReply = useTagStore((s) => s.deleteQuickReply);

  const [editingItem, setEditingItem] = useState<IQuickReplyTemplate | null>(
    null,
  );
  const [shortcut, setShortcut] = useState("");
  const [title, setTitle] = useState("");
  const [contentTemplate, setContentTemplate] = useState("");

  useEffect(() => {
    if (activeShopId) {
      fetchQuickReplies(activeShopId);
    }
  }, [activeShopId, fetchQuickReplies]);

  const handleSave = async () => {
    if (
      !activeShopId ||
      !shortcut.trim() ||
      !title.trim() ||
      !contentTemplate.trim()
    ) {
      return;
    }
    if (editingItem) {
      await updateQuickReply(activeShopId, editingItem.id, {
        shortcut: shortcut.trim(),
        title: title.trim(),
        contentTemplate: contentTemplate.trim(),
      });
    } else {
      await createQuickReply(activeShopId, {
        shortcut: shortcut.trim(),
        title: title.trim(),
        contentTemplate: contentTemplate.trim(),
      });
    }
    setEditingItem(null);
    setShortcut("");
    setTitle("");
    setContentTemplate("");
  };

  return (
    <ScrollArea className="h-full w-full flex-1">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <GlassSectionHeader
          icon={<Zap className="w-5 h-5" />}
          title={t("pageTitle")}
          subtitle={t("pageSubtitle")}
        />

        <GlassSurfaceCard className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                {t("shortcutLabel")}
              </label>
              <Input
                value={shortcut}
                onChange={(e) => setShortcut(e.target.value)}
                placeholder="xin-chao"
                className="h-9 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">{t("titleLabel")}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">
              {t("contentTemplateLabel")}
            </label>
            <Textarea
              value={contentTemplate}
              onChange={(e) => setContentTemplate(e.target.value)}
              placeholder={t("contentTemplatePlaceholder")}
              rows={3}
              className="text-xs"
            />
          </div>

          <div className="flex justify-end">
            <PatternButton
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              disabled={
                !shortcut.trim() || !title.trim() || !contentTemplate.trim()
              }
              icon={<Plus className="w-4 h-4" />}
              onClick={handleSave}
            >
              {editingItem ? t("saveUpdateBtn") : t("createBtn")}
            </PatternButton>
          </div>
        </GlassSurfaceCard>

        <div className="space-y-2.5">
          {templates.map((tpl) => (
            <GlassSurfaceCard key={tpl.id} className="p-4 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <GlassBadge variant="primary" size="sm" className="font-mono">
                    /{tpl.shortcut}
                  </GlassBadge>
                  <span className="text-sm font-bold">{tpl.title}</span>
                </div>
                <div className="flex items-center gap-1">
                  <GlassIconButton
                    size="sm"
                    variant="ghost"
                    className="h-7 w-7"
                    icon={<Pencil className="w-3.5 h-3.5" />}
                    onClick={() => {
                      setEditingItem(tpl);
                      setShortcut(tpl.shortcut);
                      setTitle(tpl.title);
                      setContentTemplate(tpl.contentTemplate);
                    }}
                  />
                  {activeShopId && (
                    <GlassIconButton
                      size="sm"
                      variant="ghost"
                      color="danger"
                      className="h-7 w-7 text-destructive"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => deleteQuickReply(activeShopId, tpl.id)}
                    />
                  )}
                </div>
              </div>
              <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                {tpl.contentTemplate}
              </p>
            </GlassSurfaceCard>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
