"use client";

import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Spinner } from "@/components/ui/spinner";
import { Slot } from "@radix-ui/react-slot";
import { LiquidGlassAnchor } from "@/components/liquid-glass/liquid-glass-anchor";

const buttonVariants = cva(
  "inline-flex items-center whitespace-nowrap text-sm font-medium ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-[0.98] select-none cursor-pointer",
  {
    variants: {
      variant: {
        solid: "shadow-sm hover:shadow-md border border-transparent",
        outline:
          "border border-slate-300 bg-transparent shadow-sm hover:bg-slate-100 text-slate-700 dark:border-white/20 dark:text-slate-200 dark:hover:bg-white/10",
        ghost:
          "hover:bg-slate-100 text-slate-700 dark:text-slate-200 dark:hover:bg-white/10",
        glass: cn(
          "backdrop-blur-xl transition-all duration-300 relative overflow-hidden",
          "bg-gradient-to-b from-white/80 to-white/60 border border-white/40",
          "text-slate-900 shadow-[0_4px_10px_rgba(0,0,0,0.03)]",
          "hover:bg-white/90 hover:shadow-[0_6px_20px_rgba(0,0,0,0.06)]",
          "dark:bg-white/5 dark:border-white/10 dark:text-white dark:shadow-none",
          "dark:hover:bg-white/15 dark:hover:border-white/20 dark:hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]",
        ),
        link: "text-primary underline-offset-4 hover:underline",
      },
      color: {
        primary: "",
        danger: "",
        success: "",
        warning: "",
        info: "",
        neutral: "",
        custom: "",
      },
      size: {
        sm: "h-8 px-3 text-xs",
        md: "h-10 px-4 py-2",
        lg: "h-12 px-8 text-base font-semibold",
        icon: "h-10 w-10 justify-center",
      },
      rounded: {
        none: "rounded-none",
        sm: "rounded-md",
        md: "rounded-lg",
        lg: "rounded-xl",
        full: "rounded-full",
      },
      fullWidth: {
        true: "w-full",
      },
    },
    compoundVariants: [
      {
        variant: "solid",
        color: "primary",
        class: "bg-[#0C115B] text-white hover:bg-[#0A0E47] shadow-blue-900/10",
      },
      {
        variant: "solid",
        color: "danger",
        class: "bg-red-600 text-white hover:bg-red-700 shadow-red-600/10",
      },
      {
        variant: "solid",
        color: "success",
        class:
          "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/10",
      },
      {
        variant: "solid",
        color: "warning",
        class: "bg-amber-500 text-white hover:bg-amber-600 shadow-amber-500/10",
      },
      {
        variant: "solid",
        color: "info",
        class: "bg-blue-500 text-white hover:bg-blue-600 shadow-blue-500/10",
      },
      {
        variant: "solid",
        color: "neutral",
        class:
          "bg-slate-900 text-white hover:bg-slate-800 shadow-slate-900/10 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-slate-200",
      },
      {
        variant: "outline",
        color: "primary",
        class: "border-[#0C115B] text-[#0C115B] hover:bg-[#0C115B]/5",
      },
      {
        variant: "outline",
        color: "danger",
        class:
          "border-red-500 text-red-600 hover:bg-red-50 dark:border-red-500/50 dark:text-red-400",
      },
      {
        variant: "outline",
        color: "success",
        class:
          "border-emerald-500 text-emerald-600 hover:bg-emerald-50 dark:border-emerald-500/50 dark:text-emerald-400",
      },
      {
        variant: "outline",
        color: "warning",
        class:
          "border-amber-500 text-amber-600 hover:bg-amber-50 dark:border-amber-500/50 dark:text-amber-400",
      },
      {
        variant: "outline",
        color: "info",
        class:
          "border-blue-500 text-blue-600 hover:bg-blue-50 dark:border-blue-500/50 dark:text-blue-400",
      },
      {
        variant: "glass",
        color: "primary",
        class:
          "text-[#0C115B] bg-[#0C115B]/5 border-[#0C115B]/20 hover:bg-[#0C115B]/10 dark:text-blue-200 dark:bg-blue-900/20 dark:border-blue-500/30",
      },
      {
        variant: "glass",
        color: "danger",
        class:
          "text-red-700 bg-red-500/5 border-red-500/20 hover:bg-red-500/10 dark:text-red-200 dark:bg-red-900/20 dark:border-red-500/30",
      },
      {
        variant: "glass",
        color: "success",
        class:
          "text-emerald-700 bg-emerald-500/5 border-emerald-500/20 hover:bg-emerald-500/10 dark:text-emerald-200 dark:bg-emerald-900/20 dark:border-emerald-500/30",
      },
      {
        variant: "glass",
        color: "warning",
        class:
          "text-amber-700 bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10 dark:text-amber-200 dark:bg-amber-900/20 dark:border-amber-500/30",
      },
      {
        variant: "glass",
        color: "info",
        class:
          "text-blue-700 bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10 dark:text-blue-200 dark:bg-blue-900/20 dark:border-blue-500/30",
      },
      {
        variant: "ghost",
        color: "primary",
        class: "text-[#0C115B] hover:bg-[#0C115B]/10",
      },
      {
        variant: "ghost",
        color: "danger",
        class: "text-red-600 hover:bg-red-50 dark:text-red-400",
      },
      {
        variant: "ghost",
        color: "success",
        class: "text-emerald-600 hover:bg-emerald-50 dark:text-emerald-400",
      },
      {
        variant: "ghost",
        color: "warning",
        class: "text-amber-600 hover:bg-amber-50 dark:text-amber-400",
      },
    ],
    defaultVariants: {
      variant: "solid",
      size: "md",
      color: "primary",
      rounded: "md",
      fullWidth: false,
    },
  },
);

export interface PatternButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "color">,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
  isLoading?: boolean;
  loadingText?: string;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
  customColor?: string;
  contentAlign?: "center" | "between";
  glassZIndex?: number;
  enableGlassPortal?: boolean;
  overflowPadding?: number;
}

const PatternButton = React.forwardRef<HTMLButtonElement, PatternButtonProps>(
  (
    {
      className,
      variant,
      size,
      color,
      rounded,
      fullWidth,
      asChild = false,
      isLoading = false,
      loadingText,
      icon,
      iconPosition = "left",
      customColor,
      children,
      style,
      disabled,
      contentAlign = "center",
      glassZIndex = 50,
      enableGlassPortal = true,
      overflowPadding = 4,
      ...props
    },
    ref,
  ) => {
    const dynamicStyles: React.CSSProperties = {};
    if (color === "custom" && customColor) {
      if (variant === "solid") {
        dynamicStyles.backgroundColor = customColor;
        dynamicStyles.color = "#fff";
      } else if (variant === "outline") {
        dynamicStyles.borderColor = customColor;
        dynamicStyles.color = customColor;
      } else if (variant === "glass") {
        dynamicStyles.color = customColor;
        dynamicStyles.borderColor = `${customColor}40`;
        dynamicStyles.backgroundColor = `${customColor}10`;
      } else if (variant === "ghost") {
        dynamicStyles.color = customColor;
      }
    }

    const Comp = asChild ? Slot : "button";

    const roundedClass =
      buttonVariants({ rounded })
        .split(" ")
        .find((c) => c.startsWith("rounded-")) || "rounded-lg";

    const ButtonComponent = (
      <Comp
        ref={ref}
        disabled={isLoading || disabled}
        className={cn(
          buttonVariants({ variant, size, color, rounded, fullWidth }),
          size === "icon" ? "justify-center" : "",
          className,
        )}
        style={{ ...dynamicStyles, ...style }}
        aria-busy={isLoading}
        aria-disabled={isLoading || disabled}
        {...props}
      >
        {variant === "glass" && (
          <>
            <span
              className={cn(
                "absolute inset-0 ring-1 ring-inset pointer-events-none transition-all duration-300",
                roundedClass,
                "ring-white/50 dark:ring-white/10",
              )}
            />
            <span
              className={cn(
                "absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-white/60 to-transparent opacity-50 pointer-events-none",
              )}
            />
          </>
        )}

        {isLoading ? (
          <span className="flex items-center justify-center gap-2 pointer-events-none relative w-full">
            <Spinner className="h-4 w-4 animate-spin current-color" />
            {loadingText || (
              <span className="opacity-0 w-0 h-0 overflow-hidden">
                {children}
              </span>
            )}
          </span>
        ) : (
          <span
            className={cn(
              "flex items-center relative w-full",
              size === "icon"
                ? "justify-center"
                : contentAlign === "between"
                  ? "justify-between"
                  : "justify-center gap-2",
            )}
          >
            {icon && iconPosition === "left" && (
              <span className="shrink-0">{icon}</span>
            )}
            <span className="truncate">{children}</span>
            {icon && iconPosition === "right" && (
              <span className="shrink-0">{icon}</span>
            )}
          </span>
        )}
      </Comp>
    );

    if (variant === "glass" && enableGlassPortal) {
      return (
        <LiquidGlassAnchor
          zIndex={glassZIndex}
          overflowPadding={overflowPadding}
          className={cn(
            "relative",
            fullWidth ? "w-full block" : "w-auto inline-flex",
          )}
          contentClassName="pointer-events-auto"
        >
          {ButtonComponent}
        </LiquidGlassAnchor>
      );
    }

    return ButtonComponent;
  },
);

PatternButton.displayName = "PatternButton";

export { PatternButton, buttonVariants };
