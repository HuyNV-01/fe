"use client";

import type React from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LiquidGlassModal } from "@/components/liquid-glass/liquid-glass";
import { PatternButton } from "@/components/button/button-patterns";
import { useTranslations } from "next-intl";

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
  const t = useTranslations("Delete");

  const handleConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    await onConfirm();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="p-0 bg-transparent border-none shadow-none max-w-[calc(100vw-1.5rem)] sm:max-w-md"
        onClick={(e) => e.stopPropagation()}
      >
        <LiquidGlassModal className="p-5 sm:p-6">
          <div className="space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-500/15 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div className="text-left">
                  <DialogTitle className="text-base font-bold text-foreground">
                    {title || t("confirmTitle")}
                  </DialogTitle>
                  <DialogDescription className="text-xs sm:text-sm text-muted-foreground mt-1 leading-relaxed">
                    {description ? (
                      description
                    ) : (
                      <>
                        {t("description")}
                        {itemName ? (
                          <span className="font-semibold text-foreground">
                            {" "}
                            &ldquo;{itemName}&rdquo;
                          </span>
                        ) : null}
                        {t("description_1")}
                      </>
                    )}
                  </DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <DialogFooter className="flex flex-row justify-end gap-2 pt-2">
              <PatternButton
                type="button"
                variant="ghost"
                size="sm"
                rounded="full"
                disabled={isLoading}
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenChange(false);
                }}
              >
                {cancelText || t("cancel")}
              </PatternButton>
              <PatternButton
                type="button"
                variant="solid"
                color="danger"
                size="sm"
                rounded="full"
                isLoading={isLoading}
                icon={<Trash2 className="w-3.5 h-3.5" />}
                onClick={handleConfirm}
              >
                {confirmText || t("delete")}
              </PatternButton>
            </DialogFooter>
          </div>
        </LiquidGlassModal>
      </DialogContent>
    </Dialog>
  );
}
