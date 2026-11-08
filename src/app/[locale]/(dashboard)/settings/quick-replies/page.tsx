/** biome-ignore-all lint/a11y/noLabelWithoutControl: <explanation> */
"use client";

import React, { useEffect, useState } from "react";
import { Zap, Plus, Trash2, Pencil, ShoppingBag, X } from "lucide-react";
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

interface ProductCardDraft {
  variantId: string;
  skuCode: string;
  productName: string;
  unitPrice: number;
}

const TEMPLATE_VARIABLES = [
  "{{customer_name}}",
  "{{salutation}}",
  "{{agent_name}}",
  "{{shop_name}}",
  "{{tracking_link}}",
] as const;

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
  const [category, setCategory] = useState("GENERAL");
  const [contentTemplate, setContentTemplate] = useState("");
  const [productCards, setProductCards] = useState<ProductCardDraft[]>([]);
  const [newSku, setNewSku] = useState("");
  const [newProdName, setNewProdName] = useState("");
  const [newProdPrice, setNewProdPrice] = useState("");

  useEffect(() => {
    if (activeShopId) {
      fetchQuickReplies(activeShopId);
    }
  }, [activeShopId, fetchQuickReplies]);

  const handleInsertVariable = (variableToken: string) => {
    setContentTemplate((prev) =>
      prev.endsWith(" ") || prev.length === 0
        ? `${prev}${variableToken}`
        : `${prev} ${variableToken}`,
    );
  };

  const handleAddProductCard = () => {
    if (!newSku.trim() || !newProdName.trim()) return;
    setProductCards((prev) => [
      ...prev,
      {
        variantId: `var_${newSku.trim().toLowerCase()}`,
        skuCode: newSku.trim().toUpperCase(),
        productName: newProdName.trim(),
        unitPrice: Math.max(0, Number(newProdPrice || 0)),
      },
    ]);
    setNewSku("");
    setNewProdName("");
    setNewProdPrice("");
  };

  const handleRemoveProductCard = (idx: number) => {
    setProductCards((prev) => prev.filter((_, i) => i !== idx));
  };

  const resetForm = () => {
    setEditingItem(null);
    setShortcut("");
    setTitle("");
    setCategory("GENERAL");
    setContentTemplate("");
    setProductCards([]);
  };

  const handleSave = async () => {
    if (
      !activeShopId ||
      !shortcut.trim() ||
      !title.trim() ||
      !contentTemplate.trim()
    ) {
      return;
    }
    const payload = {
      shortcut: shortcut.trim().replace(/^\/+/, ""),
      title: title.trim(),
      category: category.trim() || "GENERAL",
      contentTemplate: contentTemplate.trim(),
      productCardsJson: productCards,
    };

    if (editingItem) {
      await updateQuickReply(activeShopId, editingItem.id, payload);
    } else {
      await createQuickReply(activeShopId, payload);
    }
    resetForm();
  };

  return (
    <ScrollArea className="h-full w-full flex-1">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
        <GlassSectionHeader
          icon={<Zap className="w-5 h-5" />}
          title={t("pageTitle")}
          subtitle={t("pageSubtitle")}
        />

        <GlassSurfaceCard className="p-4 space-y-3.5">
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
            <div className="space-y-1">
              <label className="text-xs font-semibold">{t("titleLabel")}</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={t("titlePlaceholder")}
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold">
                {t("categoryLabel")}
              </label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="GREETING / SIZE_ADVISORY / PAYMENT"
                className="h-9 text-xs uppercase"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between flex-wrap gap-1.5">
              <label className="text-xs font-semibold">
                {t("contentTemplateLabel")}
              </label>
              <div className="flex items-center gap-1 flex-wrap">
                {TEMPLATE_VARIABLES.map((token) => (
                  <PatternButton
                    key={token}
                    type="button"
                    size="sm"
                    rounded="full"
                    variant="outline"
                    onClick={() => handleInsertVariable(token)}
                    className="h-6 px-2 text-[10px] font-mono"
                  >
                    + {token}
                  </PatternButton>
                ))}
              </div>
            </div>
            <Textarea
              value={contentTemplate}
              onChange={(e) => setContentTemplate(e.target.value)}
              placeholder={t("contentTemplatePlaceholder")}
              rows={3}
              className="text-xs"
            />
          </div>

          {/* Đính kèm Thẻ Sản Phẩm (Product Card Attachment — F03.3 & F03.4) */}
          <div className="space-y-2 pt-2 border-t border-border/40">
            <label className="text-xs font-semibold flex items-center gap-1.5">
              <ShoppingBag className="w-3.5 h-3.5 text-primary" />
              {t("productCardsSectionLabel")}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
              <Input
                value={newSku}
                onChange={(e) => setNewSku(e.target.value)}
                placeholder={t("skuCodePlaceholder")}
                className="h-8 text-xs font-mono"
              />
              <Input
                value={newProdName}
                onChange={(e) => setNewProdName(e.target.value)}
                placeholder={t("productNamePlaceholder")}
                className="h-8 text-xs sm:col-span-2"
              />
              <div className="flex items-center gap-1.5">
                <Input
                  type="number"
                  value={newProdPrice}
                  onChange={(e) => setNewProdPrice(e.target.value)}
                  placeholder={t("unitPricePlaceholder")}
                  className="h-8 text-xs"
                />
                <PatternButton
                  type="button"
                  size="sm"
                  variant="outline"
                  rounded="full"
                  onClick={handleAddProductCard}
                  disabled={!newSku.trim() || !newProdName.trim()}
                  className="h-8 px-2.5 text-xs shrink-0"
                >
                  +
                </PatternButton>
              </div>
            </div>

            {productCards.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {productCards.map((card, idx) => (
                  <GlassBadge
                    key={`${card.skuCode}-${idx}`}
                    variant="secondary"
                    size="sm"
                    className="inline-flex items-center gap-1.5 text-[11px]"
                  >
                    <span className="font-mono font-bold">{card.skuCode}</span>
                    <span>— {card.productName}</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                      ({Number(card.unitPrice || 0).toLocaleString("vi-VN")}đ)
                    </span>
                    <button
                      type="button"
                      onClick={() => handleRemoveProductCard(idx)}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </GlassBadge>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            {editingItem && (
              <PatternButton
                type="button"
                variant="ghost"
                size="sm"
                rounded="full"
                onClick={resetForm}
              >
                {t("cancelEditBtn")}
              </PatternButton>
            )}
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
                <div className="flex items-center gap-2 flex-wrap">
                  <GlassBadge variant="primary" size="sm" className="font-mono">
                    /{tpl.shortcut}
                  </GlassBadge>
                  <span className="text-sm font-bold">{tpl.title}</span>
                  {tpl.category && (
                    <GlassBadge variant="secondary" size="sm">
                      {tpl.category}
                    </GlassBadge>
                  )}
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
                      setCategory(tpl.category || "GENERAL");
                      setContentTemplate(tpl.contentTemplate);
                      setProductCards(
                        (tpl.productCardsJson || []).map((c) => ({
                          variantId: c.variantId,
                          skuCode: c.skuCode,
                          productName: c.productName,
                          unitPrice: c.unitPrice,
                        })),
                      );
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
              {tpl.productCardsJson && tpl.productCardsJson.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {tpl.productCardsJson.map((card, i) => (
                    <GlassBadge
                      key={`${card.skuCode}-${i}`}
                      variant="info"
                      size="sm"
                      className="text-[10px]"
                    >
                      <ShoppingBag className="w-2.5 h-2.5 mr-1 inline" />
                      {card.skuCode} • {card.productName} (
                      {Number(card.unitPrice || 0).toLocaleString("vi-VN")}đ)
                    </GlassBadge>
                  ))}
                </div>
              )}
            </GlassSurfaceCard>
          ))}
        </div>
      </div>
    </ScrollArea>
  );
}
