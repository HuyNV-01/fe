"use client";

import type React from "react";
import { GlassConfirmDialog } from "@/components/toolkit";

export interface ConfirmDeleteModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => Promise<void> | void;
  title?: string;
  description?: React.ReactNode;
  itemName?: string;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export function ConfirmDeleteModal({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  itemName,
  confirmText,
  cancelText,
  isLoading = false,
}: ConfirmDeleteModalProps) {
  return (
    <GlassConfirmDialog
      open={open}
      onOpenChange={onOpenChange}
      onConfirm={onConfirm}
      title={title}
      description={description}
      itemName={itemName}
      confirmLabel={confirmText}
      cancelLabel={cancelText}
      isLoading={isLoading}
      variant="danger"
    />
  );
}
