"use client";

import type React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

const toastVariants = cva(
  "relative w-full overflow-hidden rounded-xl border p-4 shadow-md transition-all select-none group backdrop-blur-sm",
  {
    variants: {
      variant: {
        default: "bg-background/95 border-border text-foreground",
        success:
          "border-emerald-200/60 bg-emerald-50/40 text-emerald-900 dark:border-emerald-900/50 dark:bg-emerald-950/20 dark:text-emerald-100",
        error:
          "border-rose-200/60 bg-rose-50/40 text-rose-900 dark:border-rose-900/50 dark:bg-rose-950/20 dark:text-rose-100",
        warning:
          "border-amber-200/60 bg-amber-50/40 text-amber-900 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-100",
        info: "border-blue-200/60 bg-blue-50/40 text-blue-900 dark:border-blue-900/50 dark:bg-blue-950/20 dark:text-blue-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const iconVariants = cva("size-5 shrink-0", {
  variants: {
    variant: {
      default: "text-foreground/80",
      success: "text-emerald-600 dark:text-emerald-400",
      error: "text-rose-600 dark:text-rose-400",
      warning: "text-amber-600 dark:text-amber-400",
      info: "text-blue-600 dark:text-blue-400",
    },
  },
  defaultVariants: {
    variant: "default",
  },
});

const actionButtonVariants = cva(
  "h-7 px-3 text-xs font-medium rounded-md shadow-sm transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        success:
          "bg-emerald-600 text-white hover:bg-emerald-700 dark:bg-emerald-600 dark:text-white dark:hover:bg-emerald-500",
        error:
          "bg-rose-600 text-white hover:bg-rose-700 dark:bg-rose-600 dark:text-white dark:hover:bg-rose-500",
        warning:
          "bg-amber-600 text-white hover:bg-amber-700 dark:bg-amber-600 dark:text-white dark:hover:bg-amber-500",
        info: "bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:text-white dark:hover:bg-blue-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

const defaultIcons: Record<
  NonNullable<VariantProps<typeof toastVariants>["variant"]>,
  LucideIcon
> = {
  default: Info,
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
};

export interface ToastCardProps extends VariantProps<typeof toastVariants> {
  id: string | number;
  title?: React.ReactNode;
  message?: React.ReactNode;
  action?: React.ReactNode | { label: string; onClick: () => void };
  icon?: React.ElementType;
}

export const ToastCard = ({
  id,
  title,
  message,
  action,
  variant = "default",
  icon: IconProp,
}: ToastCardProps) => {
  const Icon = IconProp || defaultIcons[variant || "default"];

  return (
    <div className={cn(toastVariants({ variant }))}>
      <div className="flex gap-3.5 items-start">
        <div className="shrink-0 pt-0.5">
          <Icon className={cn(iconVariants({ variant }))} />
        </div>

        <div className="flex-1 space-y-1.5">
          {title && (
            <h3 className="text-sm font-semibold leading-none tracking-tight">
              {title}
            </h3>
          )}
          {message && (
            <div
              className={cn(
                "text-sm leading-relaxed",
                variant === "default" ? "text-muted-foreground" : "opacity-90",
              )}
            >
              {message}
            </div>
          )}

          {action && (
            <div className="mt-3 flex items-center gap-2">
              {typeof action === "object" && "label" in action ? (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick();
                    toast.dismiss(id);
                  }}
                  className={cn(actionButtonVariants({ variant }))}
                >
                  {action.label}
                </Button>
              ) : (
                action
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 -mt-1 -mr-2">
          <Button
            variant="ghost"
            size="icon"
            className={cn(
              "h-7 w-7 rounded-full text-foreground/40 hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors",

              variant !== "default" &&
                "text-current opacity-60 hover:opacity-100 hover:bg-black/5",
            )}
            onClick={(e) => {
              e.stopPropagation();
              toast.dismiss(id);
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};
