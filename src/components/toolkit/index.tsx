"use client";

import React, { useState, forwardRef, type ReactNode } from "react";
import {
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Info,
  X,
  Inbox,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LiquidGlass,
  LiquidGlassCard,
  LiquidGlassModal,
  LiquidGlassDropdown,
  type LiquidGlassProps,
  type GlassVariant,
} from "@/components/liquid-glass";
import {
  LiquidPopover,
  LiquidPopoverTrigger,
  LiquidPopoverContent,
} from "@/components/liquid-glass/liquid-popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { PatternButton } from "@/components/button/button-patterns";
import { IconButton } from "@/components/button/button-icon";
import ButtonBack from "@/components/button/button-back";
import { BaseTooltip } from "@/components/tooltip/base-tooltip";
import { LiquidSearch } from "@/components/input/liquid-search";
import { Steps } from "@/components/steps/steps";
import { BaseSteps } from "@/components/steps/base-steps";
import { ToastCard } from "@/components/toast/custom-toast";
import { TruncatedText } from "@/components/common/truncated-text";
import DropdownMenuContentCus from "@/components/dropdown-menu/dropdown-menu-content-cus";
import DropdownMenuSubContentCus from "@/components/dropdown-menu/dropdown-menu-sub-content-cus";
import ItemMenu from "@/components/dropdown-menu/item-menu";
import ContentSelect from "@/components/select/select-content";
import TriggerSelect from "@/components/select/select-trigger";
import ItemSelect from "@/components/select/select-item";
import { getInitials } from "@/utils/helper";

// ============================================================================
// 1. RE-EXPORT EXISTING STANDARDIZED COMPONENTS INTO THE TOOLKIT
// ============================================================================

export {
  LiquidGlass,
  LiquidGlassCard,
  LiquidGlassModal,
  LiquidGlassDropdown,
  LiquidPopover,
  LiquidPopoverTrigger,
  LiquidPopoverContent,
  PatternButton,
  IconButton,
  ButtonBack,
  BaseTooltip,
  LiquidSearch,
  Steps,
  BaseSteps,
  ToastCard,
  TruncatedText,
  DropdownMenuContentCus,
  DropdownMenuSubContentCus,
  ItemMenu,
  ContentSelect,
  TriggerSelect,
  ItemSelect,
  Avatar,
  AvatarImage,
  AvatarFallback,
  Badge,
  Switch,
  Skeleton,
};

// ============================================================================
// 2. NEW REUSABLE TOOLKIT COMPONENTS (Liquid Glass Design System)
// ============================================================================

/**
 * 2.1. GlassModal: Standardized responsive dialog with Liquid Glass surface
 */
export interface GlassModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl" | "full";
  showCloseButton?: boolean;
  className?: string;
}

const MODAL_SIZE_MAP = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
  full: "sm:max-w-4xl",
};

export const GlassModal = ({
  open,
  onOpenChange,
  title,
  description,
  children,
  footer,
  size = "md",
  showCloseButton = true,
  className,
}: GlassModalProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={showCloseButton}
        className={cn(
          "p-0 bg-transparent border-none shadow-none max-w-[calc(100vw-1.5rem)]",
          MODAL_SIZE_MAP[size],
          className,
        )}
      >
        <LiquidGlassModal className="p-5 sm:p-6 max-h-[88dvh] overflow-y-auto">
          {(title || description) && (
            <DialogHeader className="mb-4">
              {title && (
                <DialogTitle className="text-base sm:text-lg font-bold">
                  {title}
                </DialogTitle>
              )}
              {description && (
                <DialogDescription className="text-xs sm:text-sm">
                  {description}
                </DialogDescription>
              )}
            </DialogHeader>
          )}
          <div>{children}</div>
          {footer && (
            <DialogFooter className="mt-5 gap-2">{footer}</DialogFooter>
          )}
        </LiquidGlassModal>
      </DialogContent>
    </Dialog>
  );
};

/**
 * 2.2. GlassConfirmDialog: Ready-to-use confirmation modal for destructive or important actions
 */
export interface GlassConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  description?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "primary" | "danger" | "warning" | "success";
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
}

export const GlassConfirmDialog = ({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "Xác nhận",
  cancelLabel = "Hủy",
  variant = "danger",
  isLoading = false,
  onConfirm,
}: GlassConfirmDialogProps) => {
  return (
    <GlassModal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      size="sm"
      footer={
        <>
          <PatternButton
            type="button"
            variant="ghost"
            size="sm"
            rounded="full"
            disabled={isLoading}
            onClick={() => onOpenChange(false)}
          >
            {cancelLabel}
          </PatternButton>
          <PatternButton
            type="button"
            variant="solid"
            color={variant}
            size="sm"
            rounded="full"
            isLoading={isLoading}
            onClick={onConfirm}
          >
            {confirmLabel}
          </PatternButton>
        </>
      }
    >
      <div className="sr-only">{title}</div>
    </GlassModal>
  );
};

/**
 * 2.3. GlassSheet: Responsive drawer / bottom sheet with Liquid Glass styling
 */
export interface GlassSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side?: "top" | "right" | "bottom" | "left";
  title?: ReactNode;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

export const GlassSheet = ({
  open,
  onOpenChange,
  side = "right",
  title,
  description,
  children,
  footer,
  className,
}: GlassSheetProps) => {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side={side}
        className={cn(
          "p-2! bg-transparent! border-none shadow-none",
          className,
        )}
      >
        <LiquidGlassModal className="h-full w-full p-4 sm:p-5 flex flex-col overflow-hidden">
          {(title || description) && (
            <SheetHeader className="p-0 pb-3 border-b border-border/40">
              {title && <SheetTitle>{title}</SheetTitle>}
              {description && (
                <SheetDescription>{description}</SheetDescription>
              )}
            </SheetHeader>
          )}
          <div className="flex-1 min-h-0 overflow-y-auto py-3">{children}</div>
          {footer && (
            <SheetFooter className="p-0 pt-3 border-t border-border/40">
              {footer}
            </SheetFooter>
          )}
        </LiquidGlassModal>
      </SheetContent>
    </Sheet>
  );
};

/**
 * 2.4. GlassTabs: Segmented control & tab switcher with smooth active pill
 */
export interface GlassTabItem<T extends string = string> {
  key: T;
  label: ReactNode;
  icon?: ReactNode;
  badge?: number | ReactNode;
  disabled?: boolean;
}

export interface GlassTabsProps<T extends string = string> {
  items: GlassTabItem<T>[];
  value: T;
  onValueChange: (value: T) => void;
  size?: "sm" | "md";
  fullWidth?: boolean;
  className?: string;
}

export function GlassTabs<T extends string = string>({
  items,
  value,
  onValueChange,
  size = "md",
  fullWidth = false,
  className,
}: GlassTabsProps<T>) {
  return (
    <LiquidGlass
      variant="secondary"
      opacity="30"
      blur="md"
      rounded="full"
      fluid={fullWidth}
      isolate={false}
      contentClassName={cn(
        "p-1 flex items-center gap-1 overflow-x-auto scrollbar-hide",
        fullWidth ? "w-full justify-between" : "w-fit",
      )}
      className={className}
    >
      {items.map((item) => {
        const isActive = item.key === value;
        return (
          <button
            key={item.key}
            type="button"
            disabled={item.disabled}
            onClick={() => onValueChange(item.key)}
            className={cn(
              "inline-flex items-center justify-center gap-1.5 rounded-full font-medium transition-all duration-200 cursor-pointer whitespace-nowrap select-none",
              size === "sm"
                ? "px-3 py-1 text-xs"
                : "px-4 py-1.5 text-xs sm:text-sm",
              fullWidth && "flex-1",
              isActive
                ? "bg-primary text-primary-foreground shadow-xs font-semibold"
                : "text-muted-foreground hover:text-foreground hover:bg-white/20 dark:hover:bg-white/5",
              item.disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            {item.icon && <span className="shrink-0">{item.icon}</span>}
            <span>{item.label}</span>
            {typeof item.badge === "number" && item.badge > 0 ? (
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.2 text-[10px] font-bold",
                  isActive
                    ? "bg-white/20 text-primary-foreground"
                    : "bg-primary/15 text-primary",
                )}
              >
                {item.badge > 99 ? "99+" : item.badge}
              </span>
            ) : (
              item.badge
            )}
          </button>
        );
      })}
    </LiquidGlass>
  );
}

/**
 * 2.5. GlassBadge: Status pill & counter badge with semantic variants
 */
export interface GlassBadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: GlassVariant;
  dot?: boolean;
  pulse?: boolean;
  size?: "sm" | "md";
}

export const GlassBadge = forwardRef<HTMLSpanElement, GlassBadgeProps>(
  (
    {
      children,
      variant = "primary",
      dot = false,
      pulse = false,
      size = "sm",
      className,
      ...props
    },
    ref,
  ) => {
    const colorMap: Record<GlassVariant, string> = {
      primary:
        "bg-primary/10 text-primary border-primary/25 dark:bg-primary/20",
      secondary: "bg-muted/80 text-muted-foreground border-border/60",
      accent:
        "bg-indigo-500/15 text-indigo-600 dark:text-indigo-300 border-indigo-500/30",
      frosted:
        "bg-white/40 dark:bg-white/10 text-foreground border-white/30 backdrop-blur-md",
      danger: "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30",
      success:
        "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
      warning:
        "bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30",
      info: "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30",
      ghost: "bg-transparent text-muted-foreground border-transparent",
    };

    const dotColorMap: Record<GlassVariant, string> = {
      primary: "bg-primary",
      secondary: "bg-zinc-500",
      accent: "bg-indigo-500",
      frosted: "bg-foreground",
      danger: "bg-red-500",
      success: "bg-emerald-500",
      warning: "bg-amber-500",
      info: "bg-sky-500",
      ghost: "bg-muted-foreground",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full border font-semibold backdrop-blur-xs select-none",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
          colorMap[variant],
          className,
        )}
        {...props}
      >
        {dot && (
          <span
            className={cn(
              "h-1.5 w-1.5 rounded-full shrink-0",
              dotColorMap[variant],
              pulse && "animate-pulse",
            )}
          />
        )}
        {children}
      </span>
    );
  },
);
GlassBadge.displayName = "GlassBadge";

/**
 * 2.6. GlassAvatar: Avatar with online status indicator and optional ring
 */
export interface GlassAvatarProps {
  src?: string | null;
  name?: string;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  isOnline?: boolean;
  showStatus?: boolean;
  className?: string;
}

const AVATAR_SIZE_MAP = {
  xs: { box: "h-7 w-7", text: "text-[10px]", dot: "h-2 w-2" },
  sm: { box: "h-9 w-9", text: "text-xs", dot: "h-2.5 w-2.5" },
  md: { box: "h-10 w-10", text: "text-xs", dot: "h-3 w-3" },
  lg: { box: "h-12 w-12", text: "text-sm", dot: "h-3.5 w-3.5" },
  xl: { box: "h-16 w-16", text: "text-base", dot: "h-4 w-4" },
};

export const GlassAvatar = ({
  src,
  name = "U",
  size = "md",
  isOnline = false,
  showStatus = false,
  className,
}: GlassAvatarProps) => {
  const s = AVATAR_SIZE_MAP[size];
  return (
    <div className={cn("relative inline-flex shrink-0", className)}>
      <Avatar className={cn(s.box, "border border-border/50 shadow-2xs")}>
        <AvatarImage
          src={src || undefined}
          alt={name}
          className="object-cover"
        />
        <AvatarFallback
          className={cn("bg-primary/10 text-primary font-bold", s.text)}
        >
          {getInitials(name)}
        </AvatarFallback>
      </Avatar>
      {showStatus && (
        <span
          className={cn(
            "absolute bottom-0 right-0 rounded-full ring-2 ring-background",
            s.dot,
            isOnline ? "bg-emerald-500" : "bg-zinc-400 dark:bg-zinc-600",
          )}
        />
      )}
    </div>
  );
};

/**
 * 2.7. GlassAlert: Contextual inline banner with dismiss support
 */
export interface GlassAlertProps {
  variant?: "info" | "success" | "warning" | "danger";
  title?: ReactNode;
  description?: ReactNode;
  icon?: ReactNode;
  action?: ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
  className?: string;
}

export const GlassAlert = ({
  variant = "info",
  title,
  description,
  icon,
  action,
  dismissible = false,
  onDismiss,
  className,
}: GlassAlertProps) => {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  const defaultIcons = {
    info: <Info className="w-4 h-4 text-sky-500 shrink-0" />,
    success: <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />,
    danger: <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />,
  };

  return (
    <LiquidGlass
      variant={variant}
      opacity="10"
      blur="md"
      rounded="xl"
      isolate={false}
      className={cn("p-3.5", className)}
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5">{icon || defaultIcons[variant]}</div>
        <div className="flex-1 min-w-0 space-y-1">
          {title && (
            <h4 className="text-xs sm:text-sm font-semibold text-foreground leading-none">
              {title}
            </h4>
          )}
          {description && (
            <div className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </div>
          )}
          {action && <div className="pt-1.5">{action}</div>}
        </div>
        {dismissible && (
          <button
            type="button"
            onClick={() => {
              setVisible(false);
              onDismiss?.();
            }}
            className="p-1 rounded-full text-muted-foreground hover:text-foreground hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </LiquidGlass>
  );
};

/**
 * 2.8. GlassEmptyState: Standardized empty placeholder card
 */
export interface GlassEmptyStateProps {
  icon?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export const GlassEmptyState = ({
  icon,
  title,
  description,
  action,
  className,
}: GlassEmptyStateProps) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-4",
        className,
      )}
    >
      <div className="p-3.5 rounded-2xl bg-primary/10 text-primary mb-3 shadow-2xs">
        {icon || <Inbox className="w-7 h-7 opacity-80" />}
      </div>
      <h3 className="text-sm sm:text-base font-bold text-foreground">
        {title}
      </h3>
      {description && (
        <p className="text-xs sm:text-sm text-muted-foreground max-w-xs mt-1 leading-relaxed">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
};

/**
 * 2.9. GlassSectionHeader: Page or panel section header with icon, title, subtitle & right actions
 */
export interface GlassSectionHeaderProps {
  icon?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  showBackOnMobile?: boolean;
  className?: string;
}

export const GlassSectionHeader = ({
  icon,
  title,
  subtitle,
  actions,
  showBackOnMobile = false,
  className,
}: GlassSectionHeaderProps) => {
  return (
    <div
      className={cn(
        "flex items-center justify-between gap-3 w-full",
        className,
      )}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        {showBackOnMobile && (
          <div className="md:hidden shrink-0">
            <ButtonBack />
          </div>
        )}
        {icon && (
          <div className="flex items-center justify-center h-9 w-9 rounded-xl bg-primary/10 text-primary shrink-0">
            {icon}
          </div>
        )}
        <div className="min-w-0">
          <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-muted-foreground truncate">{subtitle}</p>
          )}
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-1.5 shrink-0">{actions}</div>
      )}
    </div>
  );
};

/**
 * 2.10. GlassIconButton: Quick icon button with optional tooltip and badge counter
 */
export interface GlassIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  icon: ReactNode;
  tooltip?: ReactNode;
  badgeCount?: number;
  variant?: "glass" | "ghost" | "solid" | "outline";
  color?: "primary" | "danger" | "success" | "warning" | "info" | "neutral";
  size?: "sm" | "md" | "lg";
}

export const GlassIconButton = forwardRef<
  HTMLButtonElement,
  GlassIconButtonProps
>(
  (
    {
      icon,
      tooltip,
      badgeCount,
      variant = "ghost",
      color = "neutral",
      size = "md",
      className,
      ...props
    },
    ref,
  ) => {
    const sizeClass =
      size === "sm" ? "h-8 w-8" : size === "lg" ? "h-11 w-11" : "h-9 w-9";

    const btn = (
      <div className="relative inline-flex">
        <PatternButton
          ref={ref}
          variant={variant}
          color={color}
          size="icon"
          rounded="full"
          enableGlassPortal={false}
          className={cn(sizeClass, className)}
          {...props}
        >
          {icon}
        </PatternButton>
        {typeof badgeCount === "number" && badgeCount > 0 && (
          <span className="pointer-events-none absolute -top-0.5 -right-0.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white ring-2 ring-background">
            {badgeCount > 99 ? "99+" : badgeCount}
          </span>
        )}
      </div>
    );

    if (tooltip) {
      return <BaseTooltip content={tooltip}>{btn}</BaseTooltip>;
    }
    return btn;
  },
);
GlassIconButton.displayName = "GlassIconButton";

/**
 * 2.11. GlassSurfaceCard: Versatile card with optional header, body, and footer
 */
export interface GlassSurfaceCardProps extends LiquidGlassProps {
  header?: ReactNode;
  footer?: ReactNode;
  noPadding?: boolean;
}

export const GlassSurfaceCard = forwardRef<
  HTMLDivElement,
  GlassSurfaceCardProps
>(
  (
    { header, footer, children, noPadding = false, className, ...props },
    ref,
  ) => {
    return (
      <LiquidGlassCard
        ref={ref}
        className={cn(noPadding ? "p-0" : "p-4 sm:p-5", className)}
        {...props}
      >
        {header && (
          <div className="pb-3 mb-3 border-b border-border/40">{header}</div>
        )}
        <div>{children}</div>
        {footer && (
          <div className="pt-3 mt-3 border-t border-border/40">{footer}</div>
        )}
      </LiquidGlassCard>
    );
  },
);
GlassSurfaceCard.displayName = "GlassSurfaceCard";
