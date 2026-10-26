/** biome-ignore-all lint/suspicious/noAssignInExpressions: <explanation> */

"use client";

import React, {
  createContext,
  useContext,
  useMemo,
  type ReactNode,
} from "react";

// ============================================================================
// 1. LIQUID GLASS TYPES & CONFIGURATION CONTRACTS
// ============================================================================

export type GlassVariant =
  | "primary" // Standard: Clean White/Zinc
  | "secondary" // Muted: Gray/Zinc
  | "accent" // Brand: Indigo/Blue
  | "ghost" // Transparent: Effects only
  | "frosted" // Heavy blur: High contrast
  | "danger" // Alert: Red
  | "success" // Success: Emerald
  | "warning" // Warning: Amber
  | "info"; // Info: Sky/Cyan

export type GlassBlur =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl";

export type GlassOpacity =
  | "0"
  | "5"
  | "10"
  | "20"
  | "30"
  | "40"
  | "50"
  | "60"
  | "70"
  | "80"
  | "90"
  | "95"
  | "100";

export type GlassBorder =
  | "none"
  | "subtle"
  | "distinct"
  | "highlight"
  | "gradient";

export type GlassTexture = "none" | "noise" | "matte" | "grid" | "dots";

export type GlassSurface =
  | "flat"
  | "gradient-y"
  | "gradient-diagonal"
  | "glossy";

export type GlassRounded =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "full";

export type GlassShadow = "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "inner";

export interface LiquidGlassThemeConfig {
  /** Global switch to reduce heavy GPU filters on low-end devices */
  performanceMode?: "high" | "balanced" | "low";
  /** Automatically respect OS prefers-reduced-motion */
  respectReducedMotion?: boolean;
  /** Default blur level when not specified */
  defaultBlur?: GlassBlur;
  /** Default texture when not specified */
  defaultTexture?: GlassTexture;
  /** Maximum nesting depth before disabling backdrop-filter to prevent GPU artifacts */
  maxBackdropNestingDepth?: number;
  /** Z-index registry to avoid stacking context collisions across overlays */
  zIndexRegistry?: {
    anchor: number;
    stickyHeader: number;
    dropdown: number;
    popover: number;
    modal: number;
    toast: number;
    tooltip: number;
  };
}

export const DEFAULT_LIQUID_GLASS_CONFIG: Required<LiquidGlassThemeConfig> = {
  performanceMode: "high",
  respectReducedMotion: true,
  defaultBlur: "lg",
  defaultTexture: "noise",
  maxBackdropNestingDepth: 2,
  zIndexRegistry: {
    anchor: 10,
    stickyHeader: 40,
    dropdown: 60,
    popover: 60,
    modal: 70,
    toast: 80,
    tooltip: 90,
  },
};

// ============================================================================
// 2. STATIC TAILWIND SAFE-LISTED STYLE DICTIONARY (Zero Dynamic Class Purge Bug)
// ============================================================================

export const LIQUID_VARIANT_OPACITY_MAP: Record<
  GlassVariant,
  Record<GlassOpacity, string>
> = {
  primary: {
    "0": "bg-white/0 dark:bg-zinc-950/0",
    "5": "bg-white/5 dark:bg-zinc-950/5",
    "10": "bg-white/10 dark:bg-zinc-950/10",
    "20": "bg-white/20 dark:bg-zinc-950/20",
    "30": "bg-white/30 dark:bg-zinc-950/30",
    "40": "bg-white/40 dark:bg-zinc-950/40",
    "50": "bg-white/50 dark:bg-zinc-950/50",
    "60": "bg-white/60 dark:bg-zinc-950/60",
    "70": "bg-white/70 dark:bg-zinc-950/70",
    "80": "bg-white/80 dark:bg-zinc-950/80",
    "90": "bg-white/90 dark:bg-zinc-950/90",
    "95": "bg-white/95 dark:bg-zinc-950/95",
    "100": "bg-white dark:bg-zinc-950",
  },
  secondary: {
    "0": "bg-zinc-100/0 dark:bg-zinc-900/0",
    "5": "bg-zinc-100/5 dark:bg-zinc-900/5",
    "10": "bg-zinc-100/10 dark:bg-zinc-900/10",
    "20": "bg-zinc-100/20 dark:bg-zinc-900/20",
    "30": "bg-zinc-100/30 dark:bg-zinc-900/30",
    "40": "bg-zinc-100/40 dark:bg-zinc-900/40",
    "50": "bg-zinc-100/50 dark:bg-zinc-900/50",
    "60": "bg-zinc-100/60 dark:bg-zinc-900/60",
    "70": "bg-zinc-100/70 dark:bg-zinc-900/70",
    "80": "bg-zinc-100/80 dark:bg-zinc-900/80",
    "90": "bg-zinc-100/90 dark:bg-zinc-900/90",
    "95": "bg-zinc-100/95 dark:bg-zinc-900/95",
    "100": "bg-zinc-100 dark:bg-zinc-900",
  },
  accent: {
    "0": "bg-indigo-500/0 dark:bg-indigo-600/0",
    "5": "bg-indigo-500/5 dark:bg-indigo-600/5",
    "10": "bg-indigo-500/10 dark:bg-indigo-600/10",
    "20": "bg-indigo-500/20 dark:bg-indigo-600/20",
    "30": "bg-indigo-500/30 dark:bg-indigo-600/30",
    "40": "bg-indigo-500/40 dark:bg-indigo-600/40",
    "50": "bg-indigo-500/50 dark:bg-indigo-600/50",
    "60": "bg-indigo-500/60 dark:bg-indigo-600/60",
    "70": "bg-indigo-500/70 dark:bg-indigo-600/70",
    "80": "bg-indigo-500/80 dark:bg-indigo-600/80",
    "90": "bg-indigo-500/90 dark:bg-indigo-600/90",
    "95": "bg-indigo-500/95 dark:bg-indigo-600/95",
    "100": "bg-indigo-500 dark:bg-indigo-600",
  },
  frosted: {
    "0": "bg-white/0 dark:bg-zinc-800/0",
    "5": "bg-white/5 dark:bg-zinc-800/5",
    "10": "bg-white/10 dark:bg-zinc-800/10",
    "20": "bg-white/20 dark:bg-zinc-800/20",
    "30": "bg-white/30 dark:bg-zinc-800/30",
    "40": "bg-white/40 dark:bg-zinc-800/40",
    "50": "bg-white/50 dark:bg-zinc-800/50",
    "60": "bg-white/60 dark:bg-zinc-800/60",
    "70": "bg-white/70 dark:bg-zinc-800/70",
    "80": "bg-white/80 dark:bg-zinc-800/80",
    "90": "bg-white/90 dark:bg-zinc-800/90",
    "95": "bg-white/95 dark:bg-zinc-800/95",
    "100": "bg-white dark:bg-zinc-800",
  },
  danger: {
    "0": "bg-red-500/0 dark:bg-red-900/0",
    "5": "bg-red-500/5 dark:bg-red-900/5",
    "10": "bg-red-500/10 dark:bg-red-900/10",
    "20": "bg-red-500/20 dark:bg-red-900/20",
    "30": "bg-red-500/30 dark:bg-red-900/30",
    "40": "bg-red-500/40 dark:bg-red-900/40",
    "50": "bg-red-500/50 dark:bg-red-900/50",
    "60": "bg-red-500/60 dark:bg-red-900/60",
    "70": "bg-red-500/70 dark:bg-red-900/70",
    "80": "bg-red-500/80 dark:bg-red-900/80",
    "90": "bg-red-500/90 dark:bg-red-900/90",
    "95": "bg-red-500/95 dark:bg-red-900/95",
    "100": "bg-red-500 dark:bg-red-900",
  },
  success: {
    "0": "bg-emerald-500/0 dark:bg-emerald-900/0",
    "5": "bg-emerald-500/5 dark:bg-emerald-900/5",
    "10": "bg-emerald-500/10 dark:bg-emerald-900/10",
    "20": "bg-emerald-500/20 dark:bg-emerald-900/20",
    "30": "bg-emerald-500/30 dark:bg-emerald-900/30",
    "40": "bg-emerald-500/40 dark:bg-emerald-900/40",
    "50": "bg-emerald-500/50 dark:bg-emerald-900/50",
    "60": "bg-emerald-500/60 dark:bg-emerald-900/60",
    "70": "bg-emerald-500/70 dark:bg-emerald-900/70",
    "80": "bg-emerald-500/80 dark:bg-emerald-900/80",
    "90": "bg-emerald-500/90 dark:bg-emerald-900/90",
    "95": "bg-emerald-500/95 dark:bg-emerald-900/95",
    "100": "bg-emerald-500 dark:bg-emerald-900",
  },
  warning: {
    "0": "bg-amber-500/0 dark:bg-amber-900/0",
    "5": "bg-amber-500/5 dark:bg-amber-900/5",
    "10": "bg-amber-500/10 dark:bg-amber-900/10",
    "20": "bg-amber-500/20 dark:bg-amber-900/20",
    "30": "bg-amber-500/30 dark:bg-amber-900/30",
    "40": "bg-amber-500/40 dark:bg-amber-900/40",
    "50": "bg-amber-500/50 dark:bg-amber-900/50",
    "60": "bg-amber-500/60 dark:bg-amber-900/60",
    "70": "bg-amber-500/70 dark:bg-amber-900/70",
    "80": "bg-amber-500/80 dark:bg-amber-900/80",
    "90": "bg-amber-500/90 dark:bg-amber-900/90",
    "95": "bg-amber-500/95 dark:bg-amber-900/95",
    "100": "bg-amber-500 dark:bg-amber-900",
  },
  info: {
    "0": "bg-sky-500/0 dark:bg-sky-900/0",
    "5": "bg-sky-500/5 dark:bg-sky-900/5",
    "10": "bg-sky-500/10 dark:bg-sky-900/10",
    "20": "bg-sky-500/20 dark:bg-sky-900/20",
    "30": "bg-sky-500/30 dark:bg-sky-900/30",
    "40": "bg-sky-500/40 dark:bg-sky-900/40",
    "50": "bg-sky-500/50 dark:bg-sky-900/50",
    "60": "bg-sky-500/60 dark:bg-sky-900/60",
    "70": "bg-sky-500/70 dark:bg-sky-900/70",
    "80": "bg-sky-500/80 dark:bg-sky-900/80",
    "90": "bg-sky-500/90 dark:bg-sky-900/90",
    "95": "bg-sky-500/95 dark:bg-sky-900/95",
    "100": "bg-sky-500 dark:bg-sky-900",
  },
  ghost: {
    "0": "bg-transparent",
    "5": "bg-transparent",
    "10": "bg-transparent",
    "20": "bg-transparent",
    "30": "bg-transparent",
    "40": "bg-transparent",
    "50": "bg-transparent",
    "60": "bg-transparent",
    "70": "bg-transparent",
    "80": "bg-transparent",
    "90": "bg-transparent",
    "95": "bg-transparent",
    "100": "bg-transparent",
  },
};

export const LIQUID_STYLES = {
  variantMeta: {
    primary: {
      border: "border-white/25 dark:border-white/10",
      spotlight: "rgba(255, 255, 255, 0.14)",
      focusRing:
        "focus-visible:ring-indigo-500/50 dark:focus-visible:ring-indigo-400/50",
    },
    secondary: {
      border: "border-zinc-200/60 dark:border-zinc-700/50",
      spotlight: "rgba(255, 255, 255, 0.12)",
      focusRing: "focus-visible:ring-zinc-500/50",
    },
    accent: {
      border: "border-indigo-400/35 dark:border-indigo-400/30",
      spotlight: "rgba(99, 102, 241, 0.18)",
      focusRing: "focus-visible:ring-indigo-500/50",
    },
    frosted: {
      border: "border-white/40 dark:border-white/20",
      spotlight: "rgba(255, 255, 255, 0.2)",
      focusRing: "focus-visible:ring-indigo-500/50",
    },
    danger: {
      border: "border-red-200/40 dark:border-red-500/30",
      spotlight: "rgba(239, 68, 68, 0.16)",
      focusRing: "focus-visible:ring-red-500/50",
    },
    success: {
      border: "border-emerald-200/40 dark:border-emerald-500/30",
      spotlight: "rgba(16, 185, 129, 0.16)",
      focusRing: "focus-visible:ring-emerald-500/50",
    },
    warning: {
      border: "border-amber-200/40 dark:border-amber-500/30",
      spotlight: "rgba(245, 158, 11, 0.16)",
      focusRing: "focus-visible:ring-amber-500/50",
    },
    info: {
      border: "border-sky-200/40 dark:border-sky-500/30",
      spotlight: "rgba(14, 165, 233, 0.16)",
      focusRing: "focus-visible:ring-sky-500/50",
    },
    ghost: {
      border: "border-transparent",
      spotlight: "rgba(255, 255, 255, 0.08)",
      focusRing: "focus-visible:ring-indigo-500/40",
    },
  },
  blur: {
    none: "backdrop-blur-none",
    sm: "backdrop-blur-sm",
    md: "backdrop-blur-md",
    lg: "backdrop-blur-lg",
    xl: "backdrop-blur-xl",
    "2xl": "backdrop-blur-2xl",
    "3xl": "backdrop-blur-3xl",
    "4xl": "backdrop-blur-[80px]",
  },
  border: {
    none: "border-0",
    subtle: "border",
    distinct: "border ring-1 ring-black/5 dark:ring-white/5",
    highlight:
      "border border-t-white/50 border-l-white/40 border-b-black/5 border-r-black/5 dark:border-t-white/20 dark:border-l-white/10 dark:border-b-black/40 dark:border-r-black/40",
    gradient: "border border-white/30 dark:border-white/15 bg-clip-padding",
  },
  surface: {
    flat: "",
    "gradient-y":
      "bg-gradient-to-b from-white/10 to-transparent dark:from-white/5",
    "gradient-diagonal":
      "bg-gradient-to-br from-white/20 via-white/5 to-transparent dark:from-white/10 dark:via-white/5 dark:to-transparent",
    glossy:
      "bg-gradient-to-b from-white/15 via-white/5 to-transparent dark:from-white/10 dark:via-transparent",
  },
  shadow: {
    none: "",
    sm: "shadow-sm",
    md: "shadow-md",
    lg: "shadow-lg",
    xl: "shadow-xl",
    "2xl": "shadow-2xl",
    inner: "shadow-inner",
  },
  rounded: {
    none: "rounded-none",
    sm: "rounded-sm",
    md: "rounded-md",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
    "3xl": "rounded-3xl",
    full: "rounded-full",
  },
} as const;

// ============================================================================
// 3. CONTEXT & PROVIDER FOR CONFLICT PROTECTION & CONFIGURATION
// ============================================================================

const LiquidGlassConfigContext = createContext<
  Required<LiquidGlassThemeConfig>
>(DEFAULT_LIQUID_GLASS_CONFIG);

export const useLiquidGlassConfig = () => useContext(LiquidGlassConfigContext);

export const LiquidGlassConfigProvider = ({
  children,
  config,
}: {
  children: ReactNode;
  config?: LiquidGlassThemeConfig;
}) => {
  const merged = useMemo<Required<LiquidGlassThemeConfig>>(
    () => ({
      ...DEFAULT_LIQUID_GLASS_CONFIG,
      ...config,
      zIndexRegistry: {
        ...DEFAULT_LIQUID_GLASS_CONFIG.zIndexRegistry,
        ...(config?.zIndexRegistry || {}),
      },
    }),
    [config],
  );

  return React.createElement(
    LiquidGlassConfigContext.Provider,
    { value: merged },
    children,
  );
};
