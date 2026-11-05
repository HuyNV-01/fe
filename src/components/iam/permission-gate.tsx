"use client";

import React, { type ReactNode } from "react";
import { Lock } from "lucide-react";
import { BaseTooltip, GlassBadge } from "@/components/toolkit";
import { usePermissionStore } from "@/lib/stores/iam/use-permission-store";

export interface PermissionGateProps {
  can: string | string[];
  mode?: "hide" | "disable" | "mask";
  deniedTooltip?: ReactNode;
  maskedText?: string;
  children: ReactNode;
}

export const PermissionGate = ({
  can,
  mode = "hide",
  deniedTooltip,
  maskedText = "••••••",
  children,
}: PermissionGateProps) => {
  const allowed = usePermissionStore((s) => s.hasPermission(can));

  if (allowed) {
    return <>{children}</>;
  }

  if (mode === "hide") {
    return null;
  }

  if (mode === "mask") {
    const badge = (
      <GlassBadge variant="secondary" size="sm" className="cursor-not-allowed">
        <Lock className="w-3 h-3 mr-1 inline" />
        {maskedText}
      </GlassBadge>
    );
    return deniedTooltip ? (
      <BaseTooltip content={deniedTooltip}>{badge}</BaseTooltip>
    ) : (
      badge
    );
  }

  const disabledNode = (
    <span className="inline-flex opacity-50 pointer-events-none select-none cursor-not-allowed">
      {children}
    </span>
  );

  return deniedTooltip ? (
    <BaseTooltip content={deniedTooltip}>{disabledNode}</BaseTooltip>
  ) : (
    disabledNode
  );
};
