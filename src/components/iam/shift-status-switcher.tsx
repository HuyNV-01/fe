"use client";

import React from "react";
import { ChevronDown, Check } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  LiquidGlassInput,
  DropdownMenuContentCus,
  TruncatedText,
} from "@/components/toolkit";
import {
  type ShiftStatusType,
  usePermissionStore,
} from "@/lib/stores/iam/use-permission-store";
import { ShiftHandoverModal } from "./shift-handover-modal";
import { cn } from "@/lib/utils";

const SHIFT_STATUS_LIST: ShiftStatusType[] = ["ONLINE", "BUSY", "OFFLINE"];

const DOT_COLOR_MAP: Record<ShiftStatusType, string> = {
  ONLINE: "bg-emerald-500",
  BUSY: "bg-amber-500",
  OFFLINE: "bg-zinc-400 dark:bg-zinc-500",
};

export const ShiftStatusSwitcher = () => {
  const t = useTranslations("ShiftAndIam");

  const activeShopId = usePermissionStore((s) => s.activeShopId);
  const membershipStatus = usePermissionStore((s) => s.membershipStatus);
  const shiftStatus = usePermissionStore((s) => s.shiftStatus);
  const isSwitchingShift = usePermissionStore((s) => s.isSwitchingShift);
  const switchShiftStatus = usePermissionStore((s) => s.switchShiftStatus);

  if (!activeShopId || membershipStatus !== "ACTIVE") {
    return null;
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <LiquidGlassInput
            fluid={false}
            className="cursor-pointer p-0 overflow-hidden"
          >
            <button
              type="button"
              disabled={isSwitchingShift}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-transparent outline-none cursor-pointer max-w-44"
            >
              <span
                className={cn(
                  "h-2 w-2 rounded-full shrink-0",
                  DOT_COLOR_MAP[shiftStatus],
                  shiftStatus === "ONLINE" && "animate-pulse",
                )}
              />
              <TruncatedText className="text-xs font-semibold max-w-28">
                {t(`status.${shiftStatus}`)}
              </TruncatedText>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            </button>
          </LiquidGlassInput>
        </DropdownMenuTrigger>

        <DropdownMenuContentCus align="end" className="w-52">
          <DropdownMenuGroup>
            {SHIFT_STATUS_LIST.map((status) => {
              const isSelected = status === shiftStatus;
              return (
                <DropdownMenuItem
                  key={status}
                  onClick={() => {
                    if (!isSelected) {
                      switchShiftStatus(status);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl cursor-pointer",
                    isSelected && "bg-primary/15 text-primary font-semibold",
                  )}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={cn(
                        "h-2 w-2 rounded-full shrink-0",
                        DOT_COLOR_MAP[status],
                      )}
                    />
                    <TruncatedText className="text-xs font-medium">
                      {t(`status.${status}`)}
                    </TruncatedText>
                  </div>
                  {isSelected && (
                    <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  )}
                </DropdownMenuItem>
              );
            })}
          </DropdownMenuGroup>
        </DropdownMenuContentCus>
      </DropdownMenu>

      <ShiftHandoverModal />
    </>
  );
};
