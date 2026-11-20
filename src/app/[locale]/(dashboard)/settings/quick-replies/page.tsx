/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
/** biome-ignore-all lint/performance/noImgElement: <explanation> */
/** biome-ignore-all lint/a11y/useMediaCaption: <explanation> */
"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Braces,
  Eye,
  Film,
  ImageIcon,
  Pencil,
  Pin,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Upload,
  X,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GlassBadge,
  GlassEmptyState,
  GlassIconButton,
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassTabs,
  PatternButton,
  Switch,
} from "@/components/toolkit";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import { cn } from "@/lib/utils";
import type {
  IQuickReplyAttachmentItem,
  IQuickReplyTemplate,
  IQuickReplyVariableItem,
  QuickReplyInteractionType,
  QuickReplyScopeType,
  QuickReplyToneStyle,
  QuickReplyVariableSourceType,
} from "@/types/chat";

const INTERACTION_TYPES: QuickReplyInteractionType[] = [
  "INBOX",
  "COMMENT",
  "LIVESTREAM",
  "MARKETPLACE",
];

const CHANNEL_TYPES = [
  "FACEBOOK_PAGE",
  "INSTAGRAM",
  "ZALO_OA",
  "TIKTOK_SHOP",
  "SHOPEE",
  "WEBSITE_LIVECHAT",
];

const TONE_STYLES: QuickReplyToneStyle[] = [
  "FRIENDLY",
  "PROFESSIONAL",
  "URGENT",
  "VIP_CARE",
  "CUSTOM",
];

const TEMPLATE_CATEGORIES = [
  "GENERAL",
  "GREETING",
  "CONSULTING",
  "CLOSING",
  "PAYMENT",
  "ORDER_TRACKING",
  "DELIVERY_RESCUE",
  "WARRANTY",
];

export default function SettingsQuickRepliesPage() {
  const t = useTranslations("QuickReplies");
  const activeShopId = usePermissionStore((s) => s.activeShopId);

  const templates = useTagStore((s) => s.quickReplyTemplates);
  const tags = useTagStore((s) => s.tags);
  const variablesCatalog = useTagStore((s) => s.quickReplyVariablesCatalog);

  const fetchQuickReplies = useTagStore((s) => s.fetchQuickReplies);
  const fetchShopTags = useTagStore((s) => s.fetchShopTags);
  const fetchQuickReplyVariables = useTagStore(
    (s) => s.fetchQuickReplyVariables,
  );
  const createQuickReply = useTagStore((s) => s.createQuickReply);
  const updateQuickReply = useTagStore((s) => s.updateQuickReply);
  const deleteQuickReply = useTagStore((s) => s.deleteQuickReply);
  const createQuickReplyVariable = useTagStore(
    (s) => s.createQuickReplyVariable,
  );
  const updateQuickReplyVariable = useTagStore(
    (s) => s.updateQuickReplyVariable,
  );
  const deleteQuickReplyVariable = useTagStore(
    (s) => s.deleteQuickReplyVariable,
  );
  const uploadQuickReplyMedia = useTagStore((s) => s.uploadQuickReplyMedia);

  const [activeTab, setActiveTab] = useState<string>("templates");

  // --- Form State: Mẫu câu trả lời nhanh ---
  const [editingItem, setEditingItem] = useState<IQuickReplyTemplate | null>(
    null,
  );
  const [shortcut, setShortcut] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("GENERAL");
  const [scope, setScope] = useState<QuickReplyScopeType>("SHOP");
  const [isPinned, setIsPinned] = useState(false);
  const [contentTemplate, setContentTemplate] = useState("");
  const [attachments, setAttachments] = useState<IQuickReplyAttachmentItem[]>(
    [],
  );
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [selectedInteractions, setSelectedInteractions] = useState<
    QuickReplyInteractionType[]
  >(["INBOX", "COMMENT"]);
  const [selectedChannels, setSelectedChannels] = useState<string[]>([]);
  const [toneStyle, setToneStyle] = useState<QuickReplyToneStyle>("FRIENDLY");
  const [contextTagsInput, setContextTagsInput] = useState("");
  const [applicableTagIds, setApplicableTagIds] = useState<string[]>([]);
  const [autoAssignTagIds, setAutoAssignTagIds] = useState<string[]>([]);

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // --- Form State: Trường / Biến Động Tùy Chỉnh ---
  const [editingVariable, setEditingVariable] =
    useState<IQuickReplyVariableItem | null>(null);
  const [varKey, setVarKey] = useState("");
  const [varLabel, setVarLabel] = useState("");
  const [varDesc, setVarDesc] = useState("");
  const [varSourceType, setVarSourceType] =
    useState<QuickReplyVariableSourceType>("STATIC_TEXT");
  const [varDefaultValue, setVarDefaultValue] = useState("");
  const [varSampleValue, setVarSampleValue] = useState("");
  const [varDynamicPath, setVarDynamicPath] = useState("customer.tier");

  useEffect(() => {
    if (!activeShopId) return;
    fetchQuickReplies(activeShopId);
    fetchQuickReplyVariables(activeShopId);
    fetchShopTags(activeShopId);
  }, [
    activeShopId,
    fetchQuickReplies,
    fetchQuickReplyVariables,
    fetchShopTags,
  ]);

  const allVariables = useMemo(
    () => variablesCatalog?.allVariables || [],
    [variablesCatalog],
  );

  const livePreviewText = useMemo(() => {
    if (!contentTemplate.trim()) return "";
    const sampleMap: Record<string, string> = {};
    for (const v of allVariables) {
      sampleMap[v.key.toLowerCase()] =
        v.sample || v.defaultValue || `{{${v.key}}}`;
    }
    return contentTemplate.replace(
      /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g,
      (match, key) => sampleMap[String(key).toLowerCase()] ?? match,
    );
  }, [contentTemplate, allVariables]);

  const resetTemplateForm = () => {
    setEditingItem(null);
    setShortcut("");
    setTitle("");
    setCategory("GENERAL");
    setScope("SHOP");
    setIsPinned(false);
    setContentTemplate("");
    setAttachments([]);
    setSelectedInteractions(["INBOX", "COMMENT"]);
    setSelectedChannels([]);
    setToneStyle("FRIENDLY");
    setContextTagsInput("");
    setApplicableTagIds([]);
    setAutoAssignTagIds([]);
  };

  const resetVariableForm = () => {
    setEditingVariable(null);
    setVarKey("");
    setVarLabel("");
    setVarDesc("");
    setVarSourceType("STATIC_TEXT");
    setVarDefaultValue("");
    setVarSampleValue("");
    setVarDynamicPath("customer.tier");
  };

  const handleInsertVariableAtCursor = (variableKey: string) => {
    const token = `{{${variableKey}}}`;
    const el = textareaRef.current;
    if (!el) {
      setContentTemplate((prev) => `${prev}${token}`);
      return;
    }
    const start = el.selectionStart ?? contentTemplate.length;
    const end = el.selectionEnd ?? contentTemplate.length;
    const nextText =
      contentTemplate.slice(0, start) + token + contentTemplate.slice(end);
    setContentTemplate(nextText);
    setTimeout(() => {
      el.focus();
      const nextPos = start + token.length;
      el.setSelectionRange(nextPos, nextPos);
    }, 10);
  };

  const handleMediaFileSelected = async (
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFiles = Array.from(e.target.files || []);
    if (!selectedFiles.length) return;
    setIsUploadingMedia(true);
    try {
      const uploaded = await uploadQuickReplyMedia(selectedFiles);
      if (uploaded.length > 0) {
        setAttachments((prev) => [...prev, ...uploaded]);
      }
    } finally {
      setIsUploadingMedia(false);
      e.target.value = "";
    }
  };

  const toggleSelection = <T extends string>(
    list: T[],
    value: T,
    setter: React.Dispatch<React.SetStateAction<T[]>>,
  ) => {
    setter(
      list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value],
    );
  };

  const handleStartEditTemplate = (tpl: IQuickReplyTemplate) => {
    setEditingItem(tpl);
    setShortcut(tpl.shortcut);
    setTitle(tpl.title);
    setCategory(tpl.category || "GENERAL");
    setScope(tpl.scope || "SHOP");
    setIsPinned(Boolean(tpl.isPinned));
    setContentTemplate(tpl.contentTemplate);
    setAttachments(tpl.attachmentsJson || []);
    setSelectedInteractions(
      tpl.usageContextJson?.interactionTypes || ["INBOX", "COMMENT"],
    );
    setSelectedChannels(tpl.usageContextJson?.channelTypes || []);
    setToneStyle(tpl.usageContextJson?.toneStyle || "FRIENDLY");
    setContextTagsInput((tpl.usageContextJson?.contextTags || []).join(", "));
    setApplicableTagIds(tpl.usageContextJson?.applicableTagIds || []);
    setAutoAssignTagIds(tpl.autoAssignTagIdsJson || []);
  };

  const handleSaveTemplate = async () => {
    if (
      !activeShopId ||
      !shortcut.trim() ||
      !title.trim() ||
      !contentTemplate.trim()
    ) {
      return;
    }

    const payload = {
      shortcut: shortcut.trim(),
      title: title.trim(),
      category,
      scope,
      isPinned,
      contentTemplate: contentTemplate.trim(),
      attachmentsJson: attachments,
      autoAssignTagIdsJson: autoAssignTagIds,
      usageContextJson: {
        interactionTypes: selectedInteractions,
        channelTypes: selectedChannels,
        toneStyle,
        contextTags: contextTagsInput
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        applicableTagIds,
      },
    };

    const ok = editingItem
      ? await updateQuickReply(activeShopId, editingItem.id, payload)
      : await createQuickReply(activeShopId, payload);

    if (ok) {
      resetTemplateForm();
    }
  };

  const handleSaveVariable = async () => {
    if (!activeShopId || !varKey.trim() || !varLabel.trim()) return;

    const payload = {
      variableKey: varKey.trim(),
      label: varLabel.trim(),
      description: varDesc.trim() || null,
      sourceType: varSourceType,
      defaultValue: varDefaultValue.trim() || null,
      sampleValue: varSampleValue.trim() || varDefaultValue.trim() || null,
      dynamicPath:
        varSourceType === "DYNAMIC_EXPRESSION" ? varDynamicPath : null,
    };

    const ok =
      editingVariable && editingVariable.id
        ? await updateQuickReplyVariable(
            activeShopId,
            editingVariable.id,
            payload,
          )
        : await createQuickReplyVariable(activeShopId, payload);

    if (ok) {
      resetVariableForm();
    }
  };

  return (
    <ScrollArea className="h-full w-full flex-1">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        <GlassSectionHeader
          icon={<Zap className="w-5 h-5" />}
          title={t("pageTitle")}
          subtitle={t("pageSubtitle")}
        />

        <GlassTabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={[
            {
              key: "templates",
              label: t("tabs.templates"),
              badge: templates.length,
            },
            {
              key: "variables",
              label: t("tabs.variables"),
              badge: allVariables.length,
            },
          ]}
        />

        {activeTab === "templates" ? (
          <div className="space-y-5">
            <GlassSurfaceCard className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-primary" />
                  <span>
                    {editingItem
                      ? t("editor.editHeading")
                      : t("editor.createHeading")}
                  </span>
                </h3>
                {editingItem && (
                  <PatternButton
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    onClick={resetTemplateForm}
                  >
                    {t("editor.cancelEditBtn")}
                  </PatternButton>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold">
                    {t("titleLabel")}
                  </label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder={t("titlePlaceholder")}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Ngữ cảnh sử dụng linh hoạt */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 p-3 rounded-xl border border-border/50 bg-muted/20">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    {t("context.interactionLabel")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {INTERACTION_TYPES.map((item) => {
                      const active = selectedInteractions.includes(item);
                      return (
                        <button
                          key={item}
                          type="button"
                          onClick={() =>
                            toggleSelection(
                              selectedInteractions,
                              item,
                              setSelectedInteractions,
                            )
                          }
                          className={cn(
                            "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer",
                            active
                              ? "border-primary bg-primary/15 text-primary font-semibold"
                              : "border-border/60 text-muted-foreground",
                          )}
                        >
                          {t(`context.interactions.${item}`)}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    {t("context.toneLabel")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TONE_STYLES.map((tone) => (
                      <button
                        key={tone}
                        type="button"
                        onClick={() => setToneStyle(tone)}
                        className={cn(
                          "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-colors cursor-pointer",
                          toneStyle === tone
                            ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-300 font-semibold"
                            : "border-border/60 text-muted-foreground",
                        )}
                      >
                        {t(`context.tones.${tone}`)}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    {t("context.channelsLabel")}
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {CHANNEL_TYPES.map((ch) => {
                      const active = selectedChannels.includes(ch);
                      return (
                        <button
                          key={ch}
                          type="button"
                          onClick={() =>
                            toggleSelection(
                              selectedChannels,
                              ch,
                              setSelectedChannels,
                            )
                          }
                          className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-medium border transition-colors cursor-pointer",
                            active
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                              : "border-border/60 text-muted-foreground",
                          )}
                        >
                          {ch}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    {t("context.categoryAndScopeLabel")}
                  </label>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
                    >
                      {TEMPLATE_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                    <select
                      value={scope}
                      onChange={(e) =>
                        setScope(e.target.value as QuickReplyScopeType)
                      }
                      className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
                    >
                      <option value="SHOP">{t("context.scopes.SHOP")}</option>
                      <option value="CHANNEL">
                        {t("context.scopes.CHANNEL")}
                      </option>
                      <option value="PERSONAL">
                        {t("context.scopes.PERSONAL")}
                      </option>
                    </select>
                    <div className="flex items-center gap-1.5 ml-auto">
                      <Pin className="w-3.5 h-3.5 text-amber-500" />
                      <span className="text-xs">{t("editor.pinLabel")}</span>
                      <Switch
                        checked={isPinned}
                        onCheckedChange={setIsPinned}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold">
                    {t("context.contextTagsLabel")}
                  </label>
                  <Input
                    value={contextTagsInput}
                    onChange={(e) => setContextTagsInput(e.target.value)}
                    placeholder={t("context.contextTagsPlaceholder")}
                    className="h-8 text-xs"
                  />
                </div>
              </div>

              {/* Thanh chèn nhanh Biến động (14 biến hệ thống + biến tùy chỉnh) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold flex items-center gap-1.5">
                    <Braces className="w-3.5 h-3.5 text-primary" />
                    <span>{t("editor.insertVariablesLabel")}</span>
                  </label>
                  <PatternButton
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    onClick={() => setActiveTab("variables")}
                  >
                    {t("editor.manageVariablesBtn")}
                  </PatternButton>
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-2 rounded-xl border border-border/50 bg-muted/15">
                  {allVariables.map((v) => (
                    <button
                      key={v.key}
                      type="button"
                      onClick={() => handleInsertVariableAtCursor(v.key)}
                      title={`${v.label} (VD: ${v.sample})`}
                      className={cn(
                        "px-2 py-0.5 rounded-lg text-[11px] font-mono border transition-colors cursor-pointer",
                        v.isSystem
                          ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                          : "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20",
                      )}
                    >
                      {`{{${v.key}}}`}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {t("contentTemplateLabel")}
                  </label>
                  <Textarea
                    ref={textareaRef}
                    value={contentTemplate}
                    onChange={(e) => setContentTemplate(e.target.value)}
                    placeholder={t("contentTemplatePlaceholder")}
                    rows={5}
                    className="text-xs"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-semibold flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t("editor.livePreviewLabel")}</span>
                  </label>
                  <div className="min-h-[116px] p-3 rounded-xl border border-border/50 bg-muted/20 text-xs whitespace-pre-wrap text-foreground/90">
                    {livePreviewText || t("editor.livePreviewEmpty")}
                  </div>
                </div>
              </div>

              {/* Bộ chọn Hình ảnh & Video gửi kèm */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <label className="text-xs font-semibold flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-primary" />
                    <Film className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t("media.sectionLabel")}</span>
                  </label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*,video/*"
                    multiple
                    className="hidden"
                    onChange={handleMediaFileSelected}
                  />
                  <PatternButton
                    variant="outline"
                    size="sm"
                    rounded="full"
                    disabled={isUploadingMedia}
                    icon={<Upload className="w-3.5 h-3.5" />}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {isUploadingMedia
                      ? t("media.uploadingBtn")
                      : t("media.addMediaBtn")}
                  </PatternButton>
                </div>

                {attachments.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {attachments.map((att, idx) => {
                      const isVideo =
                        att.mediaType === "VIDEO" ||
                        (att.mimeType || "").startsWith("video/");
                      return (
                        <div
                          key={`${att.url}-${idx}`}
                          className="relative group rounded-xl overflow-hidden border border-border/60 bg-muted/30"
                        >
                          {isVideo ? (
                            <video
                              src={att.url}
                              controls
                              className="w-full h-28 object-cover bg-black"
                            />
                          ) : (
                            <img
                              src={att.thumbnailUrl || att.url}
                              alt={att.fileName}
                              className="w-full h-28 object-cover"
                            />
                          )}
                          <div className="px-2 py-1 flex items-center justify-between gap-1 text-[10px]">
                            <span className="truncate font-medium">
                              {att.fileName}
                            </span>
                            <GlassBadge
                              variant={isVideo ? "warning" : "primary"}
                              size="sm"
                            >
                              {isVideo ? "VIDEO" : "IMAGE"}
                            </GlassBadge>
                          </div>
                          <button
                            type="button"
                            onClick={() =>
                              setAttachments((prev) =>
                                prev.filter((_, i) => i !== idx),
                              )
                            }
                            className="absolute top-1.5 right-1.5 h-6 w-6 rounded-full bg-destructive text-white flex items-center justify-center shadow cursor-pointer"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Tự động gắn Tag khi gửi mẫu câu */}
              {tags.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold flex items-center gap-1.5">
                    <Tag className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{t("editor.autoAssignTagsLabel")}</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => {
                      const active = autoAssignTagIds.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() =>
                            toggleSelection(
                              autoAssignTagIds,
                              tag.id,
                              setAutoAssignTagIds,
                            )
                          }
                          className={cn(
                            "px-2.5 py-0.5 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
                            active
                              ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                              : "border-border/60 text-muted-foreground",
                          )}
                        >
                          {tag.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                  onClick={handleSaveTemplate}
                >
                  {editingItem ? t("saveUpdateBtn") : t("createBtn")}
                </PatternButton>
              </div>
            </GlassSurfaceCard>

            {/* Danh sách Mẫu câu hiện có */}
            <div className="space-y-2.5">
              {templates.map((tpl) => {
                const imgs = (tpl.attachmentsJson || []).filter(
                  (a) =>
                    a.mediaType === "IMAGE" ||
                    (a.mimeType || "").startsWith("image/"),
                );
                const vids = (tpl.attachmentsJson || []).filter(
                  (a) =>
                    a.mediaType === "VIDEO" ||
                    (a.mimeType || "").startsWith("video/"),
                );
                return (
                  <GlassSurfaceCard key={tpl.id} className="p-4 space-y-2.5">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2 flex-wrap">
                        {tpl.isPinned && (
                          <Pin className="w-3.5 h-3.5 text-amber-500" />
                        )}
                        <GlassBadge
                          variant="primary"
                          size="sm"
                          className="font-mono"
                        >
                          /{tpl.shortcut}
                        </GlassBadge>
                        <span className="text-sm font-bold">{tpl.title}</span>
                        <GlassBadge variant="secondary" size="sm">
                          {tpl.category}
                        </GlassBadge>
                        {tpl.usageContextJson?.toneStyle && (
                          <GlassBadge variant="info" size="sm">
                            {t(
                              `context.tones.${tpl.usageContextJson.toneStyle}`,
                            )}
                          </GlassBadge>
                        )}
                        {imgs.length > 0 && (
                          <GlassBadge variant="primary" size="sm">
                            <ImageIcon className="w-3 h-3 mr-1 inline" />
                            {imgs.length}
                          </GlassBadge>
                        )}
                        {vids.length > 0 && (
                          <GlassBadge variant="warning" size="sm">
                            <Film className="w-3 h-3 mr-1 inline" />
                            {vids.length}
                          </GlassBadge>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        <GlassIconButton
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7"
                          icon={<Pencil className="w-3.5 h-3.5" />}
                          onClick={() => handleStartEditTemplate(tpl)}
                        />
                        {activeShopId && (
                          <GlassIconButton
                            size="sm"
                            variant="ghost"
                            color="danger"
                            className="h-7 w-7 text-destructive"
                            icon={<Trash2 className="w-3.5 h-3.5" />}
                            onClick={() =>
                              deleteQuickReply(activeShopId, tpl.id)
                            }
                          />
                        )}
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                      {tpl.contentTemplate}
                    </p>
                  </GlassSurfaceCard>
                );
              })}
            </div>
          </div>
        ) : (
          /* Tab 2: Quản lý Trường / Biến Động Tùy Chỉnh */
          <div className="space-y-5">
            <GlassSurfaceCard className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Braces className="w-4 h-4 text-primary" />
                  <span>
                    {editingVariable
                      ? t("variables.editHeading")
                      : t("variables.createHeading")}
                  </span>
                </h3>
                {editingVariable && (
                  <PatternButton
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    onClick={resetVariableForm}
                  >
                    {t("editor.cancelEditBtn")}
                  </PatternButton>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {t("variables.keyLabel")}
                  </label>
                  <Input
                    value={varKey}
                    onChange={(e) => setVarKey(e.target.value)}
                    placeholder="hotline"
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {t("variables.labelField")}
                  </label>
                  <Input
                    value={varLabel}
                    onChange={(e) => setVarLabel(e.target.value)}
                    placeholder={t("variables.labelPlaceholder")}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {t("variables.sourceTypeLabel")}
                  </label>
                  <select
                    value={varSourceType}
                    onChange={(e) =>
                      setVarSourceType(
                        e.target.value as QuickReplyVariableSourceType,
                      )
                    }
                    className="w-full h-9 rounded-lg border border-border/60 bg-background px-2.5 text-xs"
                  >
                    <option value="STATIC_TEXT">
                      {t("variables.sourceTypes.STATIC_TEXT")}
                    </option>
                    <option value="DYNAMIC_EXPRESSION">
                      {t("variables.sourceTypes.DYNAMIC_EXPRESSION")}
                    </option>
                    <option value="PROMPT_ON_USE">
                      {t("variables.sourceTypes.PROMPT_ON_USE")}
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {t("variables.defaultValueLabel")}
                  </label>
                  <Input
                    value={varDefaultValue}
                    onChange={(e) => setVarDefaultValue(e.target.value)}
                    placeholder={t("variables.defaultValuePlaceholder")}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {t("variables.sampleValueLabel")}
                  </label>
                  <Input
                    value={varSampleValue}
                    onChange={(e) => setVarSampleValue(e.target.value)}
                    placeholder={t("variables.sampleValuePlaceholder")}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {varSourceType === "DYNAMIC_EXPRESSION" && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {t("variables.dynamicPathLabel")}
                  </label>
                  <select
                    value={varDynamicPath}
                    onChange={(e) => setVarDynamicPath(e.target.value)}
                    className="w-full h-9 rounded-lg border border-border/60 bg-background px-2.5 text-xs"
                  >
                    {(variablesCatalog?.allowedDynamicPaths || []).map((p) => (
                      <option key={p.path} value={p.path}>
                        {p.label} ({p.path} — VD: {p.sample})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-semibold">
                  {t("variables.descriptionLabel")}
                </label>
                <Input
                  value={varDesc}
                  onChange={(e) => setVarDesc(e.target.value)}
                  placeholder={t("variables.descriptionPlaceholder")}
                  className="h-9 text-xs"
                />
              </div>

              <div className="flex justify-end">
                <PatternButton
                  variant="solid"
                  color="primary"
                  size="sm"
                  rounded="full"
                  disabled={!varKey.trim() || !varLabel.trim()}
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleSaveVariable}
                >
                  {editingVariable
                    ? t("variables.saveUpdateBtn")
                    : t("variables.createBtn")}
                </PatternButton>
              </div>
            </GlassSurfaceCard>

            {/* Biến tùy chỉnh của Shop */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("variables.customSectionHeading", {
                  count: variablesCatalog?.customVariables.length || 0,
                })}
              </h4>
              {(variablesCatalog?.customVariables.length || 0) === 0 ? (
                <GlassEmptyState
                  icon={<Braces className="w-6 h-6" />}
                  title={t("variables.emptyCustomTitle")}
                  description={t("variables.emptyCustomDesc")}
                />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {(variablesCatalog?.customVariables || []).map((v) => (
                    <GlassSurfaceCard key={v.key} className="p-3.5 space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <GlassBadge
                            variant="success"
                            size="sm"
                            className="font-mono"
                          >
                            {`{{${v.key}}}`}
                          </GlassBadge>
                          <span className="text-xs font-bold truncate">
                            {v.label}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <GlassIconButton
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7"
                            icon={<Pencil className="w-3.5 h-3.5" />}
                            onClick={() => {
                              setEditingVariable(v);
                              setVarKey(v.key);
                              setVarLabel(v.label);
                              setVarDesc(v.description || "");
                              setVarSourceType(
                                v.sourceType === "SYSTEM"
                                  ? "STATIC_TEXT"
                                  : v.sourceType,
                              );
                              setVarDefaultValue(v.defaultValue || "");
                              setVarSampleValue(v.sample || "");
                              setVarDynamicPath(
                                v.dynamicPath || "customer.tier",
                              );
                            }}
                          />
                          {activeShopId && v.id && (
                            <GlassIconButton
                              size="sm"
                              variant="ghost"
                              color="danger"
                              className="h-7 w-7 text-destructive"
                              icon={<Trash2 className="w-3.5 h-3.5" />}
                              onClick={() =>
                                deleteQuickReplyVariable(activeShopId, v.id!)
                              }
                            />
                          )}
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground">
                        {v.defaultValue
                          ? `${t("variables.valuePrefix")}: ${v.defaultValue}`
                          : v.dynamicPath || v.sample}
                      </p>
                    </GlassSurfaceCard>
                  ))}
                </div>
              )}
            </div>

            {/* 14 Biến mặc định hệ thống */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                {t("variables.systemSectionHeading", {
                  count: variablesCatalog?.systemVariables.length || 14,
                })}
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {(variablesCatalog?.systemVariables || []).map((v) => (
                  <GlassSurfaceCard key={v.key} className="p-3 space-y-1">
                    <div className="flex items-center justify-between gap-2">
                      <GlassBadge
                        variant="primary"
                        size="sm"
                        className="font-mono"
                      >
                        {`{{${v.key}}}`}
                      </GlassBadge>
                      <span className="text-[10px] text-muted-foreground">
                        {v.sample}
                      </span>
                    </div>
                    <p className="text-xs font-semibold">{v.label}</p>
                  </GlassSurfaceCard>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
