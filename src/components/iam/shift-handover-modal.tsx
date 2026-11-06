"use client";

import React, { useEffect, useState } from "react";
import { ArrowRight, Users, UserCheck, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  GlassModal,
  GlassAlert,
  PatternButton,
  TruncatedText,
  LiquidGlassInput,
  ContentSelect,
  ItemSelect,
} from "@/components/toolkit";
import { Select, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getShopMembersAndInvitationsApi } from "@/lib/stores/iam/api";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";
import { useAuthStore } from "@/lib/stores/auth/use-auth-store";
import { cn } from "@/lib/utils";

export const ShiftHandoverModal = () => {
  const t = useTranslations("ShiftAndIam");
  const currentUserId = useAuthStore((s) => s.currentAccount?.user?.id);

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const isHandoverModalOpen = usePermissionStore((s) => s.isHandoverModalOpen);
  const pendingHandoverCount = usePermissionStore(
    (s) => s.pendingHandoverCount,
  );
  const isSwitchingShift = usePermissionStore((s) => s.isSwitchingShift);
  const switchShiftStatus = usePermissionStore((s) => s.switchShiftStatus);
  const closeHandoverModal = usePermissionStore((s) => s.closeHandoverModal);

  const [handoverMode, setHandoverMode] = useState<
    "AUTO_REDISTRIBUTE" | "TRANSFER_TO_AGENT" | "KEEP_ASSIGNED"
  >("AUTO_REDISTRIBUTE");
  const [colleagues, setColleagues] = useState<any[]>([]);
  const [selectedAgentId, setSelectedAgentId] = useState<string>("");

  useEffect(() => {
    if (!isHandoverModalOpen || !activeShopId) return;
    getShopMembersAndInvitationsApi(activeShopId)
      .then((res: any) => {
        const list = (res?.data?.members || []).filter(
          (m: any) =>
            m.membershipStatus === "ACTIVE" && m.userId !== currentUserId,
        );
        setColleagues(list);
        if (list.length > 0 && !selectedAgentId) {
          setSelectedAgentId(list[0].userId);
        }
      })
      .catch(() => {});
  }, [isHandoverModalOpen, activeShopId, currentUserId, selectedAgentId]);

  const handleConfirmHandover = async (e: React.FormEvent) => {
    e.preventDefault();
    await switchShiftStatus("OFFLINE", {
      handoverMode,
      targetHandoverAgentId:
        handoverMode === "TRANSFER_TO_AGENT" ? selectedAgentId : undefined,
    });
  };

  return (
    <GlassModal
      open={isHandoverModalOpen}
      onOpenChange={(open) => {
        if (!open) closeHandoverModal();
      }}
      title={
        <TruncatedText as="span">{t("handoverModal.title")}</TruncatedText>
      }
      description={t("handoverModal.description", {
        count: pendingHandoverCount,
      })}
      size="md"
      footer={
        <div className="flex flex-col sm:flex-row items-center gap-2 w-full">
          <PatternButton
            type="button"
            variant="ghost"
            color="neutral"
            size="md"
            rounded={"full"}
            fullWidth
            disabled={isSwitchingShift}
            onClick={closeHandoverModal}
          >
            <TruncatedText>{t("handoverModal.cancelBtn")}</TruncatedText>
          </PatternButton>

          <PatternButton
            type="submit"
            form="shift-handover-form"
            variant="solid"
            color="primary"
            size="md"
            rounded={"full"}
            fullWidth
            isLoading={isSwitchingShift}
            icon={<ArrowRight className="w-4 h-4" />}
            iconPosition="right"
          >
            <TruncatedText>
              {t("handoverModal.confirmHandoverBtn")}
            </TruncatedText>
          </PatternButton>
        </div>
      }
    >
      <form
        id="shift-handover-form"
        onSubmit={handleConfirmHandover}
        className="space-y-3"
      >
        <GlassAlert
          variant="warning"
          title={
            <TruncatedText>
              {t("handoverModal.description", { count: pendingHandoverCount })}
            </TruncatedText>
          }
        />

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setHandoverMode("AUTO_REDISTRIBUTE")}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
              handoverMode === "AUTO_REDISTRIBUTE"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/50 hover:bg-muted/40 text-muted-foreground",
            )}
          >
            <Users className="w-4 h-4 text-primary shrink-0" />
            <TruncatedText className="text-xs sm:text-sm font-semibold">
              {t("handoverModal.autoRedistributeBtn")}
            </TruncatedText>
          </button>

          {colleagues.length > 0 && (
            <button
              type="button"
              onClick={() => setHandoverMode("TRANSFER_TO_AGENT")}
              className={cn(
                "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
                handoverMode === "TRANSFER_TO_AGENT"
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border/50 hover:bg-muted/40 text-muted-foreground",
              )}
            >
              <UserCheck className="w-4 h-4 text-indigo-500 shrink-0" />
              <TruncatedText className="text-xs sm:text-sm font-semibold">
                {t("handoverModal.transferToSpecificAgent")}
              </TruncatedText>
            </button>
          )}

          {handoverMode === "TRANSFER_TO_AGENT" && colleagues.length > 0 && (
            <div className="pl-2 pt-1">
              <Select
                value={selectedAgentId}
                onValueChange={setSelectedAgentId}
              >
                <LiquidGlassInput className="w-full h-10 overflow-hidden p-0">
                  <SelectTrigger className="w-full h-full rounded-full cursor-pointer border-0 shadow-none bg-transparent px-3.5">
                    <SelectValue
                      placeholder={t(
                        "handoverModal.selectColleaguePlaceholder",
                      )}
                    />
                  </SelectTrigger>
                </LiquidGlassInput>
                <ContentSelect>
                  {colleagues.map((col) => (
                    <ItemSelect key={col.userId} value={col.userId}>
                      <TruncatedText>
                        {col.user?.name || col.user?.email} ({col.shiftStatus})
                      </TruncatedText>
                    </ItemSelect>
                  ))}
                </ContentSelect>
              </Select>
            </div>
          )}

          <button
            type="button"
            onClick={() => setHandoverMode("KEEP_ASSIGNED")}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer",
              handoverMode === "KEEP_ASSIGNED"
                ? "border-primary bg-primary/10 text-foreground"
                : "border-border/50 hover:bg-muted/40 text-muted-foreground",
            )}
          >
            <Clock className="w-4 h-4 text-amber-500 shrink-0" />
            <TruncatedText className="text-xs sm:text-sm font-semibold">
              {t("handoverModal.keepAssignedOption")}
            </TruncatedText>
          </button>
        </div>
      </form>
    </GlassModal>
  );
};
