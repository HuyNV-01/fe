/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowLeftRight,
  ArrowRight,
  Pencil,
  Plus,
  Sparkles,
  Tag,
  Trash2,
  Workflow,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GlassBadge,
  GlassIconButton,
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassTabs,
  PatternButton,
} from "@/components/toolkit";
import { CustomTagManagerModal } from "@/components/chat/custom-tag-manager-modal";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";
import { cn } from "@/lib/utils";
import type {
  ITagEventDefinition,
  ITagEventTagBinding,
  ITagWorkflowActionItem,
  TagEventCategoryType,
  TagEventDirectionType,
  TagWorkflowActionType,
} from "@/types/chat";

const EVENT_TOPICS = [
  {
    value: "chat.message.inbound",
    label: "Tin nhắn / Bình luận mới (chat.message.inbound)",
  },
  {
    value: "ner.phone.extracted",
    label: "Bóc tách được SĐT (ner.phone.extracted)",
  },
  {
    value: "ner.address.extracted",
    label: "Bóc tách được địa chỉ (ner.address.extracted)",
  },
  {
    value: "pos.draft.created",
    label: "Tạo giỏ hàng nháp (pos.draft.created)",
  },
  {
    value: "pos.order.created",
    label: "Chốt đơn POS thành công (pos.order.created)",
  },
  {
    value: "payment.vietqr.confirmed",
    label: "Nhận chuyển khoản VietQR (payment.vietqr.confirmed)",
  },
  {
    value: "carrier.delivery.failed",
    label: "ĐVVC báo giao thất bại (carrier.delivery.failed)",
  },
  {
    value: "CUSTOM_TOPIC",
    label: "Sự kiện tùy chỉnh riêng (Kích hoạt từ Tag hoặc API)",
  },
];

const OUTBOUND_ACTION_TYPES: TagWorkflowActionType[] = [
  "SEND_QUICK_REPLY",
  "ADD_INTERNAL_NOTE",
  "SET_SNOOZE",
  "ADD_LOYALTY_POINTS",
  "UPDATE_CUSTOMER_TIER",
  "CALL_WEBHOOK",
  "EMIT_SOCKET_ALERT",
];

export default function SettingsTagsPage() {
  const t = useTranslations("TaggingSystem");
  const activeShopId = usePermissionStore((s) => s.activeShopId);

  const tags = useTagStore((s) => s.tags);
  const tagEvents = useTagStore((s) => s.tagEvents);
  const quickReplies = useTagStore((s) => s.quickReplyTemplates);

  const fetchShopTags = useTagStore((s) => s.fetchShopTags);
  const fetchTagEvents = useTagStore((s) => s.fetchTagEvents);
  const fetchQuickReplies = useTagStore((s) => s.fetchQuickReplies);
  const createTagEvent = useTagStore((s) => s.createTagEvent);
  const updateTagEvent = useTagStore((s) => s.updateTagEvent);
  const deleteTagEvent = useTagStore((s) => s.deleteTagEvent);

  const [activeTab, setActiveTab] = useState<string>("tags");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // --- Form State: Sự kiện Tùy chỉnh Hai chiều ---
  const [editingEvent, setEditingEvent] = useState<ITagEventDefinition | null>(
    null,
  );
  const [eventKey, setEventKey] = useState("");
  const [eventName, setEventName] = useState("");
  const [eventDesc, setEventDesc] = useState("");
  const [eventCategory, setEventCategory] =
    useState<TagEventCategoryType>("CUSTOM_MANUAL");
  const [direction, setDirection] =
    useState<TagEventDirectionType>("BIDIRECTIONAL");
  const [selectedTopic, setSelectedTopic] = useState("chat.message.inbound");
  const [keywordsInput, setKeywordsInput] = useState("");
  const [keywordMode, setKeywordMode] = useState<"ANY" | "ALL" | "REGEX">(
    "ANY",
  );
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [cooldownSeconds, setCooldownSeconds] = useState("0");
  const [tagBindings, setTagBindings] = useState<ITagEventTagBinding[]>([]);
  const [outboundActions, setOutboundActions] = useState<
    ITagWorkflowActionItem[]
  >([]);

  useEffect(() => {
    if (!activeShopId) return;
    fetchShopTags(activeShopId);
    fetchTagEvents(activeShopId);
    fetchQuickReplies(activeShopId);
  }, [activeShopId, fetchShopTags, fetchTagEvents, fetchQuickReplies]);

  const resetEventForm = () => {
    setEditingEvent(null);
    setEventKey("");
    setEventName("");
    setEventDesc("");
    setEventCategory("CUSTOM_MANUAL");
    setDirection("BIDIRECTIONAL");
    setSelectedTopic("chat.message.inbound");
    setKeywordsInput("");
    setKeywordMode("ANY");
    setMinOrderAmount("");
    setCooldownSeconds("0");
    setTagBindings([]);
    setOutboundActions([]);
  };

  const handleStartEditEvent = (evt: ITagEventDefinition) => {
    setEditingEvent(evt);
    setEventKey(evt.eventKey);
    setEventName(evt.name);
    setEventDesc(evt.description || "");
    setEventCategory(evt.category);
    setDirection(evt.direction);
    setSelectedTopic(
      EVENT_TOPICS.some((tItem) => tItem.value === evt.systemEventTopic)
        ? evt.systemEventTopic || "CUSTOM_TOPIC"
        : "CUSTOM_TOPIC",
    );
    setKeywordsInput((evt.matchConditionsJson?.keywords || []).join(", "));
    setKeywordMode(evt.matchConditionsJson?.keywordMatchMode || "ANY");
    setMinOrderAmount(
      evt.matchConditionsJson?.minOrderAmount
        ? String(evt.matchConditionsJson.minOrderAmount)
        : "",
    );
    setCooldownSeconds(String(evt.cooldownSeconds || 0));
    setTagBindings(evt.linkedTagBindingsJson || []);
    setOutboundActions(evt.outboundActionsJson || []);
  };

  const handleToggleTagBinding = (
    tagId: string,
    operation: "ADD" | "REMOVE",
  ) => {
    setTagBindings((prev) => {
      const exists = prev.find((b) => b.tagId === tagId);
      if (exists && exists.operation === operation) {
        return prev.filter((b) => b.tagId !== tagId);
      }
      if (exists) {
        return prev.map((b) => (b.tagId === tagId ? { ...b, operation } : b));
      }
      return [...prev, { tagId, operation, priority: prev.length + 1 }];
    });
  };

  const handleAddOutboundAction = (actionType: TagWorkflowActionType) => {
    setOutboundActions((prev) => [
      ...prev,
      {
        id: `act_${Date.now()}_${prev.length}`,
        actionType,
        isEnabled: true,
        snoozeMinutes: actionType === "SET_SNOOZE" ? 60 : undefined,
        loyaltyPointsDelta:
          actionType === "ADD_LOYALTY_POINTS" ? 10 : undefined,
        customerTier: actionType === "UPDATE_CUSTOMER_TIER" ? "VIP" : undefined,
      },
    ]);
  };

  const handleUpdateOutboundAction = (
    id: string,
    patch: Partial<ITagWorkflowActionItem>,
  ) => {
    setOutboundActions((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  };

  const handleSaveEvent = async () => {
    if (!activeShopId || !eventName.trim()) return;
    const normalizedKey =
      eventKey.trim() ||
      eventName
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_");

    const keywords = keywordsInput
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean);

    const payload = {
      eventKey: normalizedKey,
      name: eventName.trim(),
      description: eventDesc.trim() || null,
      category: eventCategory,
      direction,
      systemEventTopic:
        selectedTopic === "CUSTOM_TOPIC"
          ? `custom.event.${normalizedKey}`
          : selectedTopic,
      matchConditionsJson: {
        keywords: keywords.length > 0 ? keywords : undefined,
        keywordMatchMode: keywords.length > 0 ? keywordMode : undefined,
        minOrderAmount: minOrderAmount ? Number(minOrderAmount) : null,
      },
      linkedTagBindingsJson: tagBindings,
      outboundActionsJson: outboundActions,
      cooldownSeconds: Math.max(0, Number(cooldownSeconds || 0)),
    };

    const ok = editingEvent
      ? await updateTagEvent(activeShopId, editingEvent.id, payload)
      : Boolean(await createTagEvent(activeShopId, payload));

    if (ok) {
      resetEventForm();
    }
  };

  return (
    <ScrollArea className="h-full w-full flex-1">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-5">
        <GlassSectionHeader
          icon={<Tag className="w-5 h-5" />}
          title={t("managerModal.title")}
          subtitle={t("managerModal.description")}
          actions={
            <PatternButton
              variant="solid"
              color="primary"
              size="sm"
              rounded="full"
              icon={<Plus className="w-4 h-4" />}
              onClick={() => setIsModalOpen(true)}
            >
              {t("managerModal.createTagBtn")}
            </PatternButton>
          }
        />

        <GlassTabs
          value={activeTab}
          onValueChange={setActiveTab}
          items={[
            {
              key: "tags",
              label: t("tabs.tags"),
              badge: tags.length,
            },
            {
              key: "events",
              label: t("tabs.events"),
              badge: tagEvents.length,
            },
          ]}
        />

        {activeTab === "tags" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {tags.map((tag) => {
              const onApplyCount = (tag.onApplyActionsJson || []).length;
              const linkedEventsCount = (tag.linkedEventKeysJson || []).length;
              return (
                <GlassSurfaceCard key={tag.id} className="p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      style={{
                        backgroundColor: tag.colorOklch || tag.colorHex,
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white shadow-xs"
                    >
                      <Tag className="w-3.5 h-3.5" />
                      <span>{tag.name}</span>
                    </span>
                    <div className="flex items-center gap-1.5">
                      {tag.shortcutKey && (
                        <GlassBadge variant="info" size="sm">
                          Alt+{tag.shortcutKey}
                        </GlassBadge>
                      )}
                      <GlassIconButton
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7"
                        icon={<Pencil className="w-3.5 h-3.5" />}
                        onClick={() => setIsModalOpen(true)}
                      />
                    </div>
                  </div>

                  {tag.description && (
                    <p className="text-xs text-muted-foreground">
                      {tag.description}
                    </p>
                  )}

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <GlassBadge variant="secondary" size="sm">
                      {t(`categories.${tag.category}`)}
                    </GlassBadge>
                    {tag.isMutuallyExclusiveGroup && (
                      <GlassBadge variant="warning" size="sm">
                        {t("managerModal.exclusiveBadge")}
                      </GlassBadge>
                    )}
                    {tag.autoRuleConfigJson?.triggerEvent && (
                      <GlassBadge variant="success" size="sm">
                        <Sparkles className="w-3 h-3 mr-1 inline" />
                        {t(
                          `autoTriggers.${tag.autoRuleConfigJson.triggerEvent}`,
                        )}
                      </GlassBadge>
                    )}
                    {(onApplyCount > 0 || linkedEventsCount > 0) && (
                      <GlassBadge variant="primary" size="sm">
                        <Zap className="w-3 h-3 mr-1 inline" />
                        {t("events.tagTriggersCount", {
                          count: onApplyCount + linkedEventsCount,
                        })}
                      </GlassBadge>
                    )}
                  </div>
                </GlassSurfaceCard>
              );
            })}
          </div>
        ) : (
          /* Tab 2: Quản lý Sự Kiện Tùy Chỉnh & Kết Nối Hai Chiều Tag <-> Event */
          <div className="space-y-5">
            <GlassSurfaceCard className="p-4 sm:p-5 space-y-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Workflow className="w-4 h-4 text-primary" />
                  <span>
                    {editingEvent
                      ? t("events.editHeading")
                      : t("events.createHeading")}
                  </span>
                </h3>
                {editingEvent && (
                  <PatternButton
                    variant="ghost"
                    size="sm"
                    rounded="full"
                    onClick={resetEventForm}
                  >
                    {t("managerModal.cancelEditBtn")}
                  </PatternButton>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {t("events.nameLabel")}
                  </label>
                  <Input
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                    placeholder={t("events.namePlaceholder")}
                    className="h-9 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {t("events.keyLabel")}
                  </label>
                  <Input
                    value={eventKey}
                    onChange={(e) => setEventKey(e.target.value)}
                    disabled={Boolean(editingEvent?.isSystemEvent)}
                    placeholder="wholesale_inquiry"
                    className="h-9 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {t("events.directionLabel")}
                  </label>
                  <select
                    value={direction}
                    onChange={(e) =>
                      setDirection(e.target.value as TagEventDirectionType)
                    }
                    className="w-full h-9 rounded-lg border border-border/60 bg-background px-2.5 text-xs"
                  >
                    <option value="BIDIRECTIONAL">
                      {t("events.directions.BIDIRECTIONAL")}
                    </option>
                    <option value="EVENT_TO_TAG">
                      {t("events.directions.EVENT_TO_TAG")}
                    </option>
                    <option value="TAG_TO_EVENT">
                      {t("events.directions.TAG_TO_EVENT")}
                    </option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold">
                    {t("events.topicLabel")}
                  </label>
                  <select
                    value={selectedTopic}
                    onChange={(e) => setSelectedTopic(e.target.value)}
                    disabled={Boolean(editingEvent?.isSystemEvent)}
                    className="w-full h-9 rounded-lg border border-border/60 bg-background px-2.5 text-xs"
                  >
                    {EVENT_TOPICS.map((topic) => (
                      <option key={topic.value} value={topic.value}>
                        {topic.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-semibold">
                    {t("events.cooldownLabel")}
                  </label>
                  <Input
                    type="number"
                    min={0}
                    value={cooldownSeconds}
                    onChange={(e) => setCooldownSeconds(e.target.value)}
                    className="h-9 text-xs"
                  />
                </div>
              </div>

              {/* Điều kiện kích hoạt (Chiều Sự kiện -> Tag) */}
              {direction !== "TAG_TO_EVENT" && (
                <div className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                  <p className="text-xs font-bold text-primary">
                    {t("events.conditionsHeading")}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <Input
                      value={keywordsInput}
                      onChange={(e) => setKeywordsInput(e.target.value)}
                      placeholder={t("events.keywordsPlaceholder")}
                      className="h-8 text-xs sm:col-span-2"
                    />
                    <select
                      value={keywordMode}
                      onChange={(e) =>
                        setKeywordMode(
                          e.target.value as "ANY" | "ALL" | "REGEX",
                        )
                      }
                      className="h-8 rounded-lg border border-border/60 bg-background px-2 text-xs"
                    >
                      <option value="ANY">
                        {t("events.keywordModes.ANY")}
                      </option>
                      <option value="ALL">
                        {t("events.keywordModes.ALL")}
                      </option>
                      <option value="REGEX">
                        {t("events.keywordModes.REGEX")}
                      </option>
                    </select>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <Input
                      type="number"
                      min={0}
                      value={minOrderAmount}
                      onChange={(e) => setMinOrderAmount(e.target.value)}
                      placeholder={t("events.minOrderAmountPlaceholder")}
                      className="h-8 text-xs"
                    />
                    <Input
                      value={eventDesc}
                      onChange={(e) => setEventDesc(e.target.value)}
                      placeholder={t("events.descriptionPlaceholder")}
                      className="h-8 text-xs"
                    />
                  </div>

                  {/* Chọn các Tag sẽ tự động Gắn / Gỡ khi sự kiện xảy ra */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">
                      {t("events.linkedTagsLabel")}
                    </label>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.map((tag) => {
                        const binding = tagBindings.find(
                          (b) => b.tagId === tag.id,
                        );
                        return (
                          <div
                            key={tag.id}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full border border-border/60 bg-background/60 text-[11px]"
                          >
                            <span
                              className="w-2 h-2 rounded-full"
                              style={{
                                backgroundColor: tag.colorOklch || tag.colorHex,
                              }}
                            />
                            <span className="font-medium">{tag.name}</span>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleTagBinding(tag.id, "ADD")
                              }
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer",
                                binding?.operation === "ADD"
                                  ? "bg-emerald-500 text-white"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              +Gắn
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                handleToggleTagBinding(tag.id, "REMOVE")
                              }
                              className={cn(
                                "px-1.5 py-0.5 rounded text-[10px] font-bold cursor-pointer",
                                binding?.operation === "REMOVE"
                                  ? "bg-destructive text-white"
                                  : "bg-muted text-muted-foreground",
                              )}
                            >
                              -Gỡ
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* Hành động thực thi khi Sự kiện được kích hoạt (từ Tag hoặc hệ thống) */}
              <div className="p-3 rounded-xl border border-border/50 bg-muted/20 space-y-3">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <p className="text-xs font-bold text-amber-600 dark:text-amber-300">
                    {t("events.outboundActionsHeading")}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {OUTBOUND_ACTION_TYPES.map((actType) => (
                      <button
                        key={actType}
                        type="button"
                        onClick={() => handleAddOutboundAction(actType)}
                        className="px-2 py-0.5 rounded-full text-[10px] font-semibold border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 cursor-pointer"
                      >
                        + {t(`events.actionTypes.${actType}`)}
                      </button>
                    ))}
                  </div>
                </div>

                {outboundActions.map((act) => (
                  <div
                    key={act.id}
                    className="flex flex-col sm:flex-row sm:items-center gap-2 p-2.5 rounded-lg border border-border/60 bg-background/70"
                  >
                    <GlassBadge variant="info" size="sm">
                      {t(`events.actionTypes.${act.actionType}`)}
                    </GlassBadge>

                    {act.actionType === "SEND_QUICK_REPLY" && (
                      <select
                        value={act.quickReplyTemplateId || ""}
                        onChange={(e) =>
                          handleUpdateOutboundAction(act.id, {
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
                          handleUpdateOutboundAction(act.id, {
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
                          handleUpdateOutboundAction(act.id, {
                            snoozeMinutes: Number(e.target.value),
                          })
                        }
                        placeholder="60"
                        className="w-32 h-8 text-xs"
                      />
                    )}

                    {act.actionType === "ADD_LOYALTY_POINTS" && (
                      <Input
                        type="number"
                        value={act.loyaltyPointsDelta || 10}
                        onChange={(e) =>
                          handleUpdateOutboundAction(act.id, {
                            loyaltyPointsDelta: Number(e.target.value),
                          })
                        }
                        className="w-32 h-8 text-xs"
                      />
                    )}

                    {act.actionType === "CALL_WEBHOOK" && (
                      <Input
                        value={act.webhookUrl || ""}
                        onChange={(e) =>
                          handleUpdateOutboundAction(act.id, {
                            webhookUrl: e.target.value,
                          })
                        }
                        placeholder="https://hooks.example.com/seller-event"
                        className="flex-1 h-8 text-xs font-mono"
                      />
                    )}

                    {act.actionType === "EMIT_SOCKET_ALERT" && (
                      <Input
                        value={act.alertMessage || ""}
                        onChange={(e) =>
                          handleUpdateOutboundAction(act.id, {
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
                      onClick={() =>
                        setOutboundActions((prev) =>
                          prev.filter((item) => item.id !== act.id),
                        )
                      }
                    />
                  </div>
                ))}
              </div>

              <div className="flex justify-end">
                <PatternButton
                  variant="solid"
                  color="primary"
                  size="sm"
                  rounded="full"
                  disabled={!eventName.trim()}
                  icon={<Plus className="w-4 h-4" />}
                  onClick={handleSaveEvent}
                >
                  {editingEvent
                    ? t("events.saveUpdateBtn")
                    : t("events.createBtn")}
                </PatternButton>
              </div>
            </GlassSurfaceCard>

            {/* Danh sách Sự kiện đang cấu hình */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {tagEvents.map((evt) => (
                <GlassSurfaceCard key={evt.id} className="p-4 space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="text-sm font-bold">{evt.name}</span>
                        <GlassBadge
                          variant="secondary"
                          size="sm"
                          className="font-mono"
                        >
                          {evt.eventKey}
                        </GlassBadge>
                      </div>
                      {evt.description && (
                        <p className="text-xs text-muted-foreground">
                          {evt.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <GlassIconButton
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7"
                        icon={<Pencil className="w-3.5 h-3.5" />}
                        onClick={() => handleStartEditEvent(evt)}
                      />
                      {!evt.isSystemEvent && activeShopId && (
                        <GlassIconButton
                          size="sm"
                          variant="ghost"
                          color="danger"
                          className="h-7 w-7 text-destructive"
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                          onClick={() => deleteTagEvent(activeShopId, evt.id)}
                        />
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <GlassBadge variant="primary" size="sm">
                      {evt.direction === "BIDIRECTIONAL" ? (
                        <ArrowLeftRight className="w-3 h-3 mr-1 inline" />
                      ) : (
                        <ArrowRight className="w-3 h-3 mr-1 inline" />
                      )}
                      {t(`events.directions.${evt.direction}`)}
                    </GlassBadge>
                    <GlassBadge variant="success" size="sm">
                      {t("events.linkedTagsCount", {
                        count: (evt.linkedTagBindingsJson || []).length,
                      })}
                    </GlassBadge>
                    <GlassBadge variant="warning" size="sm">
                      {t("events.actionsCount", {
                        count: (evt.outboundActionsJson || []).length,
                      })}
                    </GlassBadge>
                    <GlassBadge variant="info" size="sm">
                      {t("events.triggerCountBadge", {
                        count: evt.triggerCount || 0,
                      })}
                    </GlassBadge>
                  </div>
                </GlassSurfaceCard>
              ))}
            </div>
          </div>
        )}

        {activeShopId && (
          <CustomTagManagerModal
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
            shopId={activeShopId}
          />
        )}
      </div>
    </ScrollArea>
  );
}
