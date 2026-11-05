// File: src/components/chat/channel-shop-rail.tsx
"use client";

import React, { useState } from "react";
import {
  Layers,
  Plus,
  Check,
  ShieldAlert,
  Bookmark,
  Trash2,
  ArrowRight,
  Settings2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { Input } from "@/components/ui/input";
import {
  LiquidGlass,
  LiquidGlassInput,
  GlassAvatar,
  GlassBadge,
  GlassIconButton,
  GlassModal,
  PatternButton,
  BaseTooltip,
  TruncatedText,
} from "@/components/toolkit";
import {
  type ConnectedChannelItem,
  useChannelWorkspaceStore,
} from "@/lib/stores/channel/use-channel-workspace-store";
import {
  type SavedPageGroupPresetItem,
  usePermissionStore,
} from "@/lib/stores/iam/use-permission-store";
import config from "@/config";
import { showSuccessToast } from "@/utils/toast";
import { cn } from "@/lib/utils";

export interface ChannelShopRailProps {
  channels: ConnectedChannelItem[];
  selectedChannelIds: string[];
  isMergeMode: boolean;
  onSelectSingleChannel: (channelId: string) => void;
  onToggleMergeChannel: (channelId: string) => void;
  onSelectAllChannelsMerge: () => void;
}

export const ChannelShopRail = ({
  channels,
  selectedChannelIds,
  isMergeMode,
  onSelectSingleChannel,
  onToggleMergeChannel,
  onSelectAllChannelsMerge,
}: ChannelShopRailProps) => {
  const t = useTranslations("OmnichannelInbox");
  const router = useRouter();

  const savedPresets = usePermissionStore((s) => s.savedPageGroupPresets);
  const savePageGroupPresets = usePermissionStore(
    (s) => s.savePageGroupPresets,
  );
  const applySavedPreset = useChannelWorkspaceStore((s) => s.applySavedPreset);
  const activePresetId = useChannelWorkspaceStore((s) => s.activePresetId);

  const [presetModalOpen, setPresetModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [isSavingPreset, setIsSavingPreset] = useState(false);

  const totalUnread = channels.reduce(
    (acc, c) => acc + (c.unreadCount || 0),
    0,
  );

  const handleSaveNewPreset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!presetName.trim() || selectedChannelIds.length === 0) return;
    setIsSavingPreset(true);
    try {
      const nextPreset: SavedPageGroupPresetItem = {
        presetId: `preset_${Date.now()}`,
        name: presetName.trim(),
        channelIntegrationIds: selectedChannelIds,
      };
      const updatedList = [...(savedPresets || []), nextPreset];
      await savePageGroupPresets(updatedList);
      setPresetName("");
      showSuccessToast(t("mergeMode.presetSavedToast"));
    } finally {
      setIsSavingPreset(false);
    }
  };

  const handleDeletePreset = async (presetId: string) => {
    const updatedList = (savedPresets || []).filter(
      (p) => p.presetId !== presetId,
    );
    await savePageGroupPresets(updatedList);
  };

  return (
    <>
      <LiquidGlass
        variant="frosted"
        blur="lg"
        rounded="2xl"
        className="w-16 shrink-0 h-full py-3 flex flex-col items-center justify-between border-r border-border/40"
      >
        <div className="flex flex-col items-center gap-3 w-full">
          <BaseTooltip
            content={
              isMergeMode
                ? t("mergeMode.activePagesBadge", {
                    count: selectedChannelIds.length,
                  })
                : t("mergeMode.singlePageBadge")
            }
          >
            <button
              type="button"
              onClick={onSelectAllChannelsMerge}
              className={cn(
                "relative flex flex-col items-center justify-center w-11 h-11 rounded-2xl transition-all cursor-pointer",
                isMergeMode
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted/60 text-muted-foreground hover:text-foreground",
              )}
            >
              <Layers className="w-5 h-5" />
              <span className="text-[9px] font-bold leading-none mt-0.5">
                {selectedChannelIds.length}/{channels.length}
              </span>
              {totalUnread > 0 && (
                <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.2">
                  {totalUnread > 99 ? "99+" : totalUnread}
                </span>
              )}
            </button>
          </BaseTooltip>

          <div className="w-8 h-px bg-border/60" />

          <div className="flex flex-col items-center gap-2.5 overflow-y-auto max-h-[calc(100dvh-15rem)] px-1">
            {channels.map((ch) => {
              const isSelected = selectedChannelIds.includes(ch.id);
              const hasTokenWarning = ch.webhookStatus !== "HEALTHY";

              return (
                <BaseTooltip
                  key={ch.id}
                  content={`${ch.pageShortCode} — ${ch.pageName}`}
                >
                  <button
                    type="button"
                    onClick={() =>
                      isMergeMode
                        ? onToggleMergeChannel(ch.id)
                        : onSelectSingleChannel(ch.id)
                    }
                    className={cn(
                      "relative rounded-2xl p-0.5 transition-all cursor-pointer",
                      isSelected
                        ? "ring-2 ring-primary scale-105"
                        : "opacity-65 hover:opacity-100",
                    )}
                  >
                    <GlassAvatar
                      src={ch.avatarUrl}
                      name={ch.pageShortCode}
                      size="sm"
                    />
                    {isMergeMode && isSelected && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-4 w-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {hasTokenWarning && (
                      <span className="absolute -top-1 -left-1 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center animate-pulse">
                        <ShieldAlert className="w-2.5 h-2.5" />
                      </span>
                    )}
                    {ch.unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 rounded-full bg-red-500 text-white text-[9px] font-bold px-1">
                        {ch.unreadCount > 99 ? "99+" : ch.unreadCount}
                      </span>
                    )}
                  </button>
                </BaseTooltip>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <GlassIconButton
            icon={<Plus className="w-4 h-4" />}
            tooltip={t("mergeMode.savePresetBtn")}
            onClick={() => setPresetModalOpen(true)}
          />
          <GlassIconButton
            icon={<Settings2 className="w-4 h-4" />}
            tooltip={t("mergeMode.title")}
            onClick={() => router.push(config.routes.private.settingsChannels)}
          />
        </div>
      </LiquidGlass>

      <GlassModal
        open={presetModalOpen}
        onOpenChange={setPresetModalOpen}
        title={<TruncatedText as="span">{t("mergeMode.title")}</TruncatedText>}
        description={t("mergeMode.subtitle")}
        size="md"
        footer={
          <PatternButton
            type="submit"
            form="save-merge-preset-form"
            variant="solid"
            color="primary"
            size="md"
            rounded={"full"}
            fullWidth
            isLoading={isSavingPreset}
            disabled={!presetName.trim() || selectedChannelIds.length === 0}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            <TruncatedText>{t("mergeMode.savePresetBtn")}</TruncatedText>
          </PatternButton>
        }
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <TruncatedText className="text-xs font-semibold text-muted-foreground">
                {t("mergeMode.activePagesBadge", {
                  count: selectedChannelIds.length,
                })}
              </TruncatedText>
              <PatternButton
                type="button"
                variant="ghost"
                color="primary"
                size="sm"
                rounded={"full"}
                onClick={onSelectAllChannelsMerge}
              >
                <TruncatedText>
                  {t("mergeMode.selectAllChannelsBtn", {
                    count: channels.length,
                  })}
                </TruncatedText>
              </PatternButton>
            </div>

            <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
              {channels.map((ch) => {
                const isSelected = selectedChannelIds.includes(ch.id);
                return (
                  <button
                    key={ch.id}
                    type="button"
                    onClick={() => onToggleMergeChannel(ch.id)}
                    className={cn(
                      "w-full flex items-center justify-between p-2.5 rounded-xl border transition-all cursor-pointer text-left",
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border/40 hover:bg-muted/40",
                    )}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <GlassAvatar
                        src={ch.avatarUrl}
                        name={ch.pageShortCode}
                        size="sm"
                      />
                      <div className="min-w-0">
                        <TruncatedText
                          as="p"
                          className="text-xs font-semibold text-foreground"
                        >
                          {ch.pageName}
                        </TruncatedText>
                        <TruncatedText
                          as="p"
                          className="text-[11px] text-muted-foreground"
                        >
                          {ch.pageShortCode}
                        </TruncatedText>
                      </div>
                    </div>
                    <GlassBadge
                      variant={
                        ch.webhookStatus === "HEALTHY" ? "success" : "danger"
                      }
                      dot
                    >
                      <TruncatedText>{ch.channelType}</TruncatedText>
                    </GlassBadge>
                  </button>
                );
              })}
            </div>
          </div>

          {savedPresets && savedPresets.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-border/40">
              <TruncatedText
                as="p"
                className="text-xs font-bold text-foreground"
              >
                {t("mergeMode.savedPresetsHeading", {
                  count: savedPresets.length,
                })}
              </TruncatedText>
              <div className="space-y-1.5">
                {savedPresets.map((preset) => {
                  const isActivePreset = activePresetId === preset.presetId;
                  return (
                    <div
                      key={preset.presetId}
                      className={cn(
                        "flex items-center justify-between gap-2 p-2 rounded-xl border",
                        isActivePreset
                          ? "border-primary bg-primary/10"
                          : "border-border/40",
                      )}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Bookmark className="w-3.5 h-3.5 text-primary shrink-0" />
                        <TruncatedText className="text-xs font-medium">
                          {preset.name} ({preset.channelIntegrationIds.length})
                        </TruncatedText>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <PatternButton
                          type="button"
                          variant="glass"
                          color="primary"
                          size="sm"
                          rounded={"full"}
                          onClick={() =>
                            applySavedPreset(
                              preset.presetId,
                              preset.channelIntegrationIds,
                            )
                          }
                        >
                          <TruncatedText>
                            {t("mergeMode.applyPresetBtn")}
                          </TruncatedText>
                        </PatternButton>
                        <PatternButton
                          type="button"
                          variant="ghost"
                          color="danger"
                          size="sm"
                          rounded={"full"}
                          onClick={() => handleDeletePreset(preset.presetId)}
                          icon={<Trash2 className="w-3.5 h-3.5" />}
                        >
                          <TruncatedText>
                            {t("mergeMode.deletePresetBtn")}
                          </TruncatedText>
                        </PatternButton>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <form
            id="save-merge-preset-form"
            onSubmit={handleSaveNewPreset}
            className="pt-2 border-t border-border/40"
          >
            <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
              <div className="flex items-center px-3.5 w-full h-full">
                <Bookmark className="h-4 w-4 text-muted-foreground/60 mr-2.5 shrink-0" />
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder={t("mergeMode.presetNamePlaceholder")}
                  className="flex h-full w-full py-2 text-sm bg-transparent! border-none shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 px-0"
                />
              </div>
            </LiquidGlassInput>
          </form>
        </div>
      </GlassModal>
    </>
  );
};
