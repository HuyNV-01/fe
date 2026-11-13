"use client";

import React, { useEffect, useState } from "react";
import { Tag, Plus, Sparkles } from "lucide-react";
import { useTranslations } from "next-intl";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  GlassSectionHeader,
  GlassSurfaceCard,
  GlassBadge,
  PatternButton,
} from "@/components/toolkit";
import { CustomTagManagerModal } from "@/components/chat/custom-tag-manager-modal";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useTagStore } from "@/lib/stores/tags/use-tag-store";

export default function SettingsTagsPage() {
  const t = useTranslations("TaggingSystem");
  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const tags = useTagStore((s) => s.tags);
  const fetchShopTags = useTagStore((s) => s.fetchShopTags);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (activeShopId) {
      fetchShopTags(activeShopId);
    }
  }, [activeShopId, fetchShopTags]);

  return (
    <ScrollArea className="h-full w-full flex-1">
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5">
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {tags.map((tag) => (
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
                {tag.shortcutKey && (
                  <GlassBadge variant="info" size="sm">
                    Alt+{tag.shortcutKey}
                  </GlassBadge>
                )}
              </div>

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
                    {t(`autoTriggers.${tag.autoRuleConfigJson.triggerEvent}`)}
                  </GlassBadge>
                )}
              </div>
            </GlassSurfaceCard>
          ))}
        </div>

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
