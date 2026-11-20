/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";

import React, { useEffect, useState } from "react";
import { Pencil, Plus, Sparkles, Tag, Trash2, Zap } from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import {
  GlassBadge,
  GlassIconButton,
  GlassModal,
  GlassSurfaceCard,
  PatternButton,
  Switch,
} from "@/components/toolkit";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import type {
  IAutoTagRuleConfig,
  ICustomTag,
  ITagWorkflowActionItem,
  TagApplicableScopeType,
  TagCategoryType,
  TagWorkflowActionType,
} from "@/types/chat";
import { cn } from "@/lib/utils";

const OKLCH_PRESETS = [
  { hex: "#3B82F6", oklch: "oklch(0.62 0.19 259)" },
  { hex: "#8B5CF6", oklch: "oklch(0.60 0.22 293)" },
  { hex: "#10B981", oklch: "oklch(0.69 0.17 162)" },
  { hex: "#EF4444", oklch: "oklch(0.63 0.24 29)" },
  { hex: "#0EA5E9", oklch: "oklch(0.68 0.16 237)" },
  { hex: "#F59E0B", oklch: "oklch(0.76 0.18 70)" },
  { hex: "#EC4899", oklch: "oklch(0.65 0.21 354)" },
  { hex: "#F97316", oklch: "oklch(0.70 0.19 48)" },
  { hex: "#EAB308", oklch: "oklch(0.79 0.18 86)" },
];

const CATEGORIES: TagCategoryType[] = [
  "CONSULTATION_STATUS",
  "CUSTOMER_TIER",
  "MESSAGE_BOOKMARK",
  "DELIVERY_ISSUE",
  "MARKETING_SOURCE",
];

const SCOPES: TagApplicableScopeType[] = [
  "CONVERSATION",
  "MESSAGE",
  "CUSTOMER",
  "ORDER",
];

const AUTO_TRIGGERS: Array<IAutoTagRuleConfig["triggerEvent"] | "NONE"> = [
  "NONE",
  "NER_PHONE_EXTRACTED",
  "NER_ADDRESS_EXTRACTED",
  "POS_DRAFT_CREATED",
  "POS_ORDER_CONFIRMED",
  "VIETQR_PAID",
  "CARRIER_DELIVERY_FAILED",
  "KEYWORD_MATCH",
  "CUSTOM_EVENT",
];

const TAG_APPLY_ACTION_TYPES: TagWorkflowActionType[] = [
  "SEND_QUICK_REPLY",
  "ADD_INTERNAL_NOTE",
  "SET_SNOOZE",
  "ADD_LOYALTY_POINTS",
  "UPDATE_CUSTOMER_TIER",
  "CALL_WEBHOOK",
  "EMIT_SOCKET_ALERT",
];

export interface CustomTagManagerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shopId: string;
}

export const CustomTagManagerModal = ({
  open,
  onOpenChange,
  shopId,
}: CustomTagManagerModalProps) => {
  const t = useTranslations("TaggingSystem");
  const tags = useTagStore((s) => s.tags);
  const tagEvents = useTagStore((s) => s.tagEvents);
  const quickReplies = useTagStore((s) => s.quickReplyTemplates);
  const fetchTagEvents = useTagStore((s) => s.fetchTagEvents);
  const fetchQuickReplies = useTagStore((s) => s.fetchQuickReplies);
  const createTag = useTagStore((s) => s.createTag);
  const updateTag = useTagStore((s) => s.updateTag);
  const deleteTag = useTagStore((s) => s.deleteTag);

  const [editingTag, setEditingTag] = useState<ICustomTag | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [colorHex, setColorHex] = useState(OKLCH_PRESETS[0].hex);
  const [colorOklch, setColorOklch] = useState(OKLCH_PRESETS[0].oklch);
  const [category, setCategory] = useState<TagCategoryType>(
    "CONSULTATION_STATUS",
  );
  const [isMutuallyExclusive, setIsMutuallyExclusive] = useState(true);
  const [selectedScopes, setSelectedScopes] = useState<
    TagApplicableScopeType[]
  >(["CONVERSATION"]);
  const [shortcutKey, setShortcutKey] = useState<string>("");
  const [autoTrigger, setAutoTrigger] = useState<
    IAutoTagRuleConfig["triggerEvent"] | "NONE"
  >("NONE");
  const [autoKeywords, setAutoKeywords] = useState("");
  const [autoCustomEventKey, setAutoCustomEventKey] = useState("");
  const [linkedEventKeys, setLinkedEventKeys] = useState<string[]>([]);
  const [onApplyActions, setOnApplyActions] = useState<
    ITagWorkflowActionItem[]
  >([]);

  useEffect(() => {
    if (!open || !shopId) return;
    fetchTagEvents(shopId);
    fetchQuickReplies(shopId);
  }, [open, shopId, fetchTagEvents, fetchQuickReplies]);

  const resetForm = () => {
    setEditingTag(null);
    setName("");
    setDescription("");
    setColorHex(OKLCH_PRESETS[0].hex);
    setColorOklch(OKLCH_PRESETS[0].oklch);
    setCategory("CONSULTATION_STATUS");
    setIsMutuallyExclusive(true);
    setSelectedScopes(["CONVERSATION"]);
    setShortcutKey("");
    setAutoTrigger("NONE");
    setAutoKeywords("");
    setAutoCustomEventKey("");
    setLinkedEventKeys([]);
    setOnApplyActions([]);
  };

  const handleStartEdit = (tag: ICustomTag) => {
    setEditingTag(tag);
    setName(tag.name);
    setDescription(tag.description || "");
    setColorHex(tag.colorHex);
    setColorOklch(tag.colorOklch);
    setCategory(tag.category);
    setIsMutuallyExclusive(Boolean(tag.isMutuallyExclusiveGroup));
    setSelectedScopes(
      tag.applicableScopesJson?.length
        ? tag.applicableScopesJson
        : ["CONVERSATION"],
    );
    setShortcutKey(tag.shortcutKey || "");
    setAutoTrigger(tag.autoRuleConfigJson?.triggerEvent || "NONE");
    setAutoKeywords((tag.autoRuleConfigJson?.keywords || []).join(", "));
    setAutoCustomEventKey(tag.autoRuleConfigJson?.customEventKey || "");
    setLinkedEventKeys(tag.linkedEventKeysJson || []);
    setOnApplyActions(tag.onApplyActionsJson || []);
  };

  const toggleScope = (scope: TagApplicableScopeType) => {
    setSelectedScopes((prev) =>
      prev.includes(scope)
        ? prev.length > 1
          ? prev.filter((s) => s !== scope)
          : prev
        : [...prev, scope],
    );
  };

  const toggleLinkedEvent = (eventKey: string) => {
    setLinkedEventKeys((prev) =>
      prev.includes(eventKey)
        ? prev.filter((k) => k !== eventKey)
        : [...prev, eventKey],
    );
  };

  const handleAddOnApplyAction = (actionType: TagWorkflowActionType) => {
    setOnApplyActions((prev) => [
      ...prev,
      {
        id: `tag_act_${Date.now()}_${prev.length}`,
        actionType,
        isEnabled: true,
        snoozeMinutes: actionType === "SET_SNOOZE" ? 60 : undefined,
        loyaltyPointsDelta:
          actionType === "ADD_LOYALTY_POINTS" ? 10 : undefined,
        customerTier: actionType === "UPDATE_CUSTOMER_TIER" ? "VIP" : undefined,
      },
    ]);
  };

  const handleUpdateOnApplyAction = (
    id: string,
    patch: Partial<ITagWorkflowActionItem>,
  ) => {
    setOnApplyActions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const handleRemoveOnApplyAction = (id: string) => {
    setOnApplyActions((prev) => prev.filter((item) => item.id !== id));
  };

  const handleSave = async () => {
    if (!name.trim() || !shopId) return;

    const autoRuleConfigJson: IAutoTagRuleConfig | null =
      autoTrigger === "NONE"
        ? null
        : {
            triggerEvent: autoTrigger,
            customEventKey:
              autoTrigger === "CUSTOM_EVENT"
                ? autoCustomEventKey.trim() || undefined
                : undefined,
            keywords:
              autoTrigger === "KEYWORD_MATCH"
                ? autoKeywords
                    .split(",")
                    .map((k) => k.trim())
                    .filter(Boolean)
                : undefined,
          };

    const payload = {
      name: name.trim(),
      description: description.trim() || null,
      colorHex,
      colorOklch,
      category,
      isMutuallyExclusiveGroup: isMutuallyExclusive,
      applicableScopesJson: selectedScopes,
      shortcutKey: shortcutKey.trim() || null,
      autoRuleConfigJson,
      linkedEventKeysJson: linkedEventKeys,
      onApplyActionsJson: onApplyActions,
    };

    if (editingTag) {
      await updateTag(shopId, editingTag.id, payload);
    } else {
      await createTag(shopId, payload);
    }

    resetForm();
  };

  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      size="xl"
      title={t("managerModal.title")}
      description={t("managerModal.description")}
    >
      <div className="space-y-4">
        <GlassSurfaceCard className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {editingTag
                ? t("managerModal.editSectionTitle")
                : t("managerModal.createSectionTitle")}
            </h4>
            {editingTag && (
              <PatternButton
                variant="ghost"
                size="sm"
                rounded="full"
                onClick={resetForm}
              >
                {t("managerModal.cancelEditBtn")}
              </PatternButton>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                {t("managerModal.nameLabel")}
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("managerModal.namePlaceholder")}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">
                {t("managerModal.shortcutLabel")}
              </label>
              <Input
                value={shortcutKey}
                onChange={(e) =>
                  setShortcutKey(
                    e.target.value.replace(/[^1-9]/g, "").slice(0, 1),
                  )
                }
                placeholder="1 - 9"
                className="h-9 text-xs font-mono"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold">
              {t("managerModal.descriptionLabel")}
            </label>
            <Input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("managerModal.descriptionPlaceholder")}
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold">
              {t("managerModal.colorOklchLabel")}
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {OKLCH_PRESETS.map((preset) => {
                const isSelected = colorOklch === preset.oklch;
                return (
                  <button
                    key={preset.oklch}
                    type="button"
                    onClick={() => {
                      setColorHex(preset.hex);
                      setColorOklch(preset.oklch);
                    }}
                    style={{ backgroundColor: preset.oklch }}
                    className={cn(
                      "w-7 h-7 rounded-full transition-transform cursor-pointer border-2",
                      isSelected
                        ? "scale-115 border-foreground ring-2 ring-primary/40"
                        : "border-transparent opacity-80 hover:opacity-100",
                    )}
                  />
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                {t("managerModal.categoryLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={cn(
                      "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
                      category === cat
                        ? "border-primary bg-primary/15 text-primary font-semibold"
                        : "border-border/60 text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {t(`categories.${cat}`)}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold">
                {t("managerModal.scopesLabel")}
              </label>
              <div className="flex flex-wrap gap-1.5">
                {SCOPES.map((sc) => {
                  const active = selectedScopes.includes(sc);
                  return (
                    <button
                      key={sc}
                      type="button"
                      onClick={() => toggleScope(sc)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all cursor-pointer",
                        active
                          ? "border-emerald-500 bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-semibold"
                          : "border-border/60 text-muted-foreground",
                      )}
                    >
                      {t(`scopes.${sc}`)}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between p-2.5 rounded-xl bg-muted/40 border border-border/50">
            <div className="min-w-0 pr-3">
              <p className="text-xs font-semibold">
                {t("managerModal.mutuallyExclusiveLabel")}
              </p>
              <p className="text-[11px] text-muted-foreground">
                {t("managerModal.mutuallyExclusiveDesc")}
              </p>
            </div>
            <Switch
              checked={isMutuallyExclusive}
              onCheckedChange={setIsMutuallyExclusive}
            />
          </div>

          {/* Chiều 1: Sự kiện xảy ra -> Tự động gắn Tag */}
          <div className="space-y-2 pt-1 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>{t("managerModal.autoRuleLabel")}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {AUTO_TRIGGERS.map((trig) => (
                <button
                  key={trig}
                  type="button"
                  onClick={() => setAutoTrigger(trig)}
                  className={cn(
                    "px-2.5 py-1 rounded-full text-[11px] border transition-all cursor-pointer",
                    autoTrigger === trig
                      ? "border-amber-500 bg-amber-500/15 text-amber-600 dark:text-amber-300 font-semibold"
                      : "border-border/60 text-muted-foreground",
                  )}
                >
                  {t(`autoTriggers.${trig}`)}
                </button>
              ))}
            </div>

            {autoTrigger === "KEYWORD_MATCH" && (
              <Input
                value={autoKeywords}
                onChange={(e) => setAutoKeywords(e.target.value)}
                placeholder={t("managerModal.keywordsPlaceholder")}
                className="h-8 text-xs"
              />
            )}

            {autoTrigger === "CUSTOM_EVENT" && (
              <select
                value={autoCustomEventKey}
                onChange={(e) => setAutoCustomEventKey(e.target.value)}
                className="w-full h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
              >
                <option value="">
                  {t("managerModal.selectCustomEventPlaceholder")}
                </option>
                {tagEvents.map((evt) => (
                  <option key={evt.id} value={evt.eventKey}>
                    {evt.name} ({evt.eventKey})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Chiều 2: Ấn gắn Tag -> Kích hoạt Sự kiện tùy chỉnh đã cấu hình */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center gap-1.5 text-xs font-semibold">
              <Zap className="w-3.5 h-3.5 text-primary" />
              <span>{t("managerModal.linkedEventsOnApplyLabel")}</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {tagEvents
                .filter((e) => e.direction !== "EVENT_TO_TAG")
                .map((evt) => {
                  const active = linkedEventKeys.includes(evt.eventKey);
                  return (
                    <button
                      key={evt.id}
                      type="button"
                      onClick={() => toggleLinkedEvent(evt.eventKey)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[11px] border transition-all cursor-pointer",
                        active
                          ? "border-primary bg-primary/15 text-primary font-semibold"
                          : "border-border/60 text-muted-foreground",
                      )}
                    >
                      ⚡ {evt.name}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Hành động trực tiếp khi ấn gắn Tag */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <span className="text-xs font-semibold">
                {t("managerModal.directActionsOnApplyLabel")}
              </span>
              <div className="flex flex-wrap gap-1">
                {TAG_APPLY_ACTION_TYPES.map((actType) => (
                  <button
                    key={actType}
                    type="button"
                    onClick={() => handleAddOnApplyAction(actType)}
                    className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                  >
                    + {t(`events.actionTypes.${actType}`)}
                  </button>
                ))}
              </div>
            </div>

            {onApplyActions.map((act) => (
              <div
                key={act.id}
                className="flex flex-col sm:flex-row sm:items-center gap-2 p-2 rounded-lg border border-border/60 bg-background/70"
              >
                <GlassBadge variant="info" size="sm">
                  {t(`events.actionTypes.${act.actionType}`)}
                </GlassBadge>

                {act.actionType === "SEND_QUICK_REPLY" && (
                  <select
                    value={act.quickReplyTemplateId || ""}
                    onChange={(e) =>
                      handleUpdateOnApplyAction(act.id, {
                        quickReplyTemplateId: e.target.value,
                      })
                    }
                    className="flex-1 h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
                  >
                    <option value="">
                      {t("events.selectQuickReplyPlaceholder")}
                    </option>
                    {quickReplies.map((qr) => (
                      <option key={qr.id} value={qr.id}>
                        /{qr.shortcut} — {qr.title}
                      </option>
                    ))}
                  </select>
                )}

                {act.actionType === "ADD_INTERNAL_NOTE" && (
                  <Input
                    value={act.internalNoteText || ""}
                    onChange={(e) =>
                      handleUpdateOnApplyAction(act.id, {
                        internalNoteText: e.target.value,
                      })
                    }
                    placeholder={t("events.internalNotePlaceholder")}
                    className="flex-1 h-8 text-xs"
                  />
                )}

                {act.actionType === "SET_SNOOZE" && (
                  <Input
                    type="number"
                    min={5}
                    value={act.snoozeMinutes || 60}
                    onChange={(e) =>
                      handleUpdateOnApplyAction(act.id, {
                        snoozeMinutes: Number(e.target.value),
                      })
                    }
                    className="w-28 h-8 text-xs"
                  />
                )}

                {act.actionType === "ADD_LOYALTY_POINTS" && (
                  <Input
                    type="number"
                    value={act.loyaltyPointsDelta || 10}
                    onChange={(e) =>
                      handleUpdateOnApplyAction(act.id, {
                        loyaltyPointsDelta: Number(e.target.value),
                      })
                    }
                    className="w-28 h-8 text-xs"
                  />
                )}

                {act.actionType === "UPDATE_CUSTOMER_TIER" && (
                  <select
                    value={act.customerTier || "VIP"}
                    onChange={(e) =>
                      handleUpdateOnApplyAction(act.id, {
                        customerTier: e.target.value as
                          | "NEW"
                          | "SILVER"
                          | "GOLD"
                          | "VIP"
                          | "BLACKLIST",
                      })
                    }
                    className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
                  >
                    <option value="NEW">NEW</option>
                    <option value="SILVER">SILVER</option>
                    <option value="GOLD">GOLD</option>
                    <option value="VIP">VIP</option>
                    <option value="BLACKLIST">BLACKLIST</option>
                  </select>
                )}

                {act.actionType === "CALL_WEBHOOK" && (
                  <Input
                    value={act.webhookUrl || ""}
                    onChange={(e) =>
                      handleUpdateOnApplyAction(act.id, {
                        webhookUrl: e.target.value,
                      })
                    }
                    placeholder="https://hooks.example.com/tag-trigger"
                    className="flex-1 h-8 text-xs font-mono"
                  />
                )}

                {act.actionType === "EMIT_SOCKET_ALERT" && (
                  <Input
                    value={act.alertMessage || ""}
                    onChange={(e) =>
                      handleUpdateOnApplyAction(act.id, {
                        alertMessage: e.target.value,
                      })
                    }
                    placeholder={t("events.alertMessagePlaceholder")}
                    className="flex-1 h-8 text-xs"
                  />
                )}

                <GlassIconButton
                  size="sm"
                  variant="ghost"
                  color="danger"
                  className="h-7 w-7 text-destructive shrink-0"
                  icon={<Trash2 className="w-3.5 h-3.5" />}
                  onClick={() => handleRemoveOnApplyAction(act.id)}
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-1">
            <PatternButton
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              disabled={!name.trim()}
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={handleSave}
            >
              {editingTag
                ? t("managerModal.saveUpdateBtn")
                : t("managerModal.createTagBtn")}
            </PatternButton>
          </div>
        </GlassSurfaceCard>

        <div className="space-y-2">
          <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
            {t("managerModal.existingTagsHeading", { count: tags.length })}
          </h4>
          <div className="space-y-1.5">
            {tags.map((tag) => {
              const triggerCount =
                (tag.linkedEventKeysJson || []).length +
                (tag.onApplyActionsJson || []).length;
              return (
                <div
                  key={tag.id}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl border border-border/50 bg-background/60"
                >
                  <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                    <span
                      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold text-white"
                      style={{
                        backgroundColor: tag.colorOklch || tag.colorHex,
                      }}
                    >
                      <Tag className="w-3 h-3" />
                      <span>{tag.name}</span>
                    </span>
                    <GlassBadge variant="secondary" size="sm">
                      {t(`categories.${tag.category}`)}
                    </GlassBadge>
                    {tag.shortcutKey && (
                      <GlassBadge variant="info" size="sm">
                        Alt+{tag.shortcutKey}
                      </GlassBadge>
                    )}
                    {tag.isMutuallyExclusiveGroup && (
                      <GlassBadge variant="warning" size="sm">
                        {t("managerModal.exclusiveBadge")}
                      </GlassBadge>
                    )}
                    {tag.autoRuleConfigJson?.triggerEvent && (
                      <GlassBadge variant="success" size="sm">
                        <Sparkles className="w-2.5 h-2.5 mr-1 inline" />
                        {t(
                          `autoTriggers.${tag.autoRuleConfigJson.triggerEvent}`,
                        )}
                      </GlassBadge>
                    )}
                    {triggerCount > 0 && (
                      <GlassBadge variant="primary" size="sm">
                        <Zap className="w-2.5 h-2.5 mr-1 inline" />
                        {t("events.tagTriggersCount", { count: triggerCount })}
                      </GlassBadge>
                    )}
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <GlassIconButton
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7"
                      icon={<Pencil className="w-3.5 h-3.5" />}
                      onClick={() => handleStartEdit(tag)}
                    />
                    <GlassIconButton
                      size="sm"
                      variant="ghost"
                      color="danger"
                      className="h-7 w-7 text-destructive"
                      icon={<Trash2 className="w-3.5 h-3.5" />}
                      onClick={() => deleteTag(shopId, tag.id)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </GlassModal>
  );
};
