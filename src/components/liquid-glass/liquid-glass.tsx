"use client";

import React, {
  type ReactNode,
  useRef,
  forwardRef,
  createContext,
  useContext,
  useState,
  useEffect,
} from "react";

import { cn } from "@/lib/utils";

import { createPortal } from "react-dom";

// ==========================================

// 1. TYPES DEFINITION (Strict & Scalable)

// ==========================================

export type GlassVariant =
  | "primary" // Standard: Clean White/Black
  | "secondary" // Muted: Gray/Zinc
  | "accent" // Brand: Indigo/Blue
  | "ghost" // Transparent: Effects only
  | "frosted" // Heavy blur: High contrast
  | "danger" // Alert: Red
  | "success"; // Success: Green (New)

export type GlassBlur =
  | "none"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "2xl"
  | "3xl"
  | "4xl";

// Opacity mapped strictly to Tailwind scale

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

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  as?: React.ElementType; // Polymorphic support (render as section, article, etc.)
  // --- Visual Configuration ---
  variant?: GlassVariant;
  blur?: GlassBlur;
  opacity?: GlassOpacity;
  surface?: GlassSurface;
  texture?: GlassTexture;
  border?: boolean | GlassBorder;
  rounded?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "3xl" | "full";
  shadow?: "none" | "sm" | "md" | "lg" | "xl" | "2xl" | "inner";
  // --- Lighting & FX ---
  shimmer?: boolean; // Skeleton/Loading effect
  glow?: boolean; // Inner glowing edge
  spotlight?: boolean; // Mouse tracking light
  spotlightColor?: string; // Custom spotlight color
  // --- Interaction & State ---
  hover?: boolean; // Uplift on hover
  interactive?: boolean; // Behaves like a button
  disabled?: boolean;
  animate?: boolean; // Entrance animation
  // --- Advanced ---
  isolate?: boolean; // CSS isolation
  fluid?: boolean; // Width 100% vs auto
  portal?: boolean;
}

// ==========================================
// 2. CONTEXT & UTILS
//==========================================

const GlassContext = createContext<number>(0);

/**
 * Enterprise Style Dictionary
 * Organized for maintainability and theme consistency.
 */

const STYLES = {
  variants: {
    primary: {
      bg: "bg-white/var-opacity dark:bg-zinc-950/var-opacity",
      border: "border-white/20 dark:border-white/10",
      highlight: "after:bg-white/20",
    },

    secondary: {
      bg: "bg-zinc-100/var-opacity dark:bg-zinc-900/var-opacity",
      border: "border-zinc-200/50 dark:border-zinc-700/50",
      highlight: "after:bg-zinc-500/10",
    },

    accent: {
      bg: "bg-indigo-500/var-opacity dark:bg-indigo-600/var-opacity",
      border: "border-indigo-400/30 dark:border-indigo-400/30",
      highlight: "after:bg-indigo-400/20",
    },

    frosted: {
      bg: "bg-white/var-opacity dark:bg-zinc-800/var-opacity",
      border: "border-white/40 dark:border-white/20",
      highlight: "after:bg-white/30",
    },

    danger: {
      bg: "bg-red-500/var-opacity dark:bg-red-900/var-opacity",
      border: "border-red-200/30 dark:border-red-500/30",
      highlight: "after:bg-red-400/20",
    },

    success: {
      bg: "bg-emerald-500/var-opacity dark:bg-emerald-900/var-opacity",
      border: "border-emerald-200/30 dark:border-emerald-500/30",
      highlight: "after:bg-emerald-400/20",
    },

    ghost: {
      bg: "bg-transparent",
      border: "border-transparent",
      highlight: "after:bg-transparent",
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
    subtle: "border", // Color handled by variant
    distinct: "border ring-1 ring-black/5 dark:ring-white/5",
    highlight:
      "border border-t-white/50 border-l-white/40 border-b-black/5 border-r-black/5 dark:border-t-white/20 dark:border-l-white/10 dark:border-b-black/40 dark:border-r-black/40",
    gradient: "border-transparent bg-origin-border", // Requires complex masking, simplified here
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
};

// ==========================================
// 3. SUB-COMPONENTS (Performance & Separation)
// ==========================================

const TextureLayer = ({ type }: { type: GlassTexture }) => {
  if (type === "none") return null;

  return (
    <div
      className={`absolute inset-0 z-0 pointer-events-none rounded-[inherit] overflow-hidden`}
    >
      {type === "noise" && (
        <div
          aria-hidden="true"
          className="w-full h-full opacity-[0.03] dark:opacity-[0.05] mix-blend-soft-light"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {type === "matte" && (
        <div
          aria-hidden="true"
          className="w-full h-full opacity-[0.04] dark:opacity-[0.06] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='matteFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23matteFilter)'/%3E%3C/svg%3E")`,
          }}
        />
      )}

      {type === "grid" && (
        <div className="w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      )}

      {type === "dots" && (
        <div className="w-full h-full bg-[radial-gradient(#80808040_1px,transparent_1px)] bg-[size:16px_16px]" />
      )}
    </div>
  );
};

const SpotlightLayer = ({ show, color }: { show: boolean; color: string }) => {
  if (!show) return null;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-[1] pointer-events-none transition-opacity duration-500 rounded-[inherit]"
      style={{
        opacity: "var(--spotlight-opacity, 0)",
        background: `radial-gradient(600px circle at var(--mouse-x, 0px) var(--mouse-y, 0px), ${color}, transparent 40%)`,
      }}
    />
  );
};

// ==========================================
// 4. MAIN COMPONENT
// ==========================================

export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (
    {
      children,
      className,
      style,
      as: Component = "div",
      // Visuals
      variant = "primary",
      blur = "lg",
      opacity,
      surface = "flat",
      texture = "noise",
      border = "subtle",
      shadow = "sm",
      rounded = "2xl",
      // FX
      shimmer = false,
      glow = false,
      spotlight = false,
      spotlightColor,
      // Interaction
      hover = false,
      interactive = false,
      disabled = false,
      animate = false,
      // Layout
      isolate = true,
      fluid = true,
      portal = false,
      onClick,
      ...props
    },

    ref,
  ) => {
    const localRef = useRef<HTMLDivElement>(null);
    const nestingLevel = useContext(GlassContext);
    const effectiveNesting = portal ? 0 : nestingLevel;
    const isNested = effectiveNesting > 0;
    const defaultOpacity = isNested ? "40" : "60";
    const safeOpacity = opacity || defaultOpacity;

    // --- Dynamic Styles ---
    const variantConfig = STYLES.variants[variant];
    const bgClass = variantConfig.bg.replace(/var-opacity/g, safeOpacity);

    const borderClassBase =
      border === true ? STYLES.border.subtle : STYLES.border[border || "none"];

    const finalBorderClass =
      border === "distinct" || border === "highlight"
        ? borderClassBase
        : cn(borderClassBase, variantConfig.border);

    // --- Interaction Logic ---
    const isInteractive = interactive || !!onClick;
    const canSpotlight = spotlight && !disabled;

    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
      if (!canSpotlight) return;

      const element = localRef.current;
      if (!element) return;

      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      element.style.setProperty("--mouse-x", `${x}px`);
      element.style.setProperty("--mouse-y", `${y}px`);
      element.style.setProperty("--spotlight-opacity", "1");
    };

    const handleMouseLeave = () => {
      if (!canSpotlight) return;

      localRef.current?.style.setProperty("--spotlight-opacity", "0");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (isInteractive && !disabled && (e.key === "Enter" || e.key === " ")) {
        e.preventDefault();

        onClick?.(e as any);
      }

      props.onKeyDown?.(e);
    };

    // --- Spotlight Color Logic ---

    const getSpotlightColor = () => {
      if (spotlightColor) return spotlightColor;
      if (variant === "accent") return "rgba(99, 102, 241, 0.15)"; // Indigo
      if (variant === "danger") return "rgba(239, 68, 68, 0.15)"; // Red
      if (variant === "success") return "rgba(16, 185, 129, 0.15)"; // Green

      return isNested
        ? "rgba(255, 255, 255, 0.15)"
        : "rgba(255, 255, 255, 0.1)";
    };

    // Merge refs

    const setRefs = (element: HTMLDivElement) => {
      localRef.current = element;

      if (typeof ref === "function") ref(element);
      else if (ref) ref.current = element;
    };

    const renderContent = () => (
      <Component
        ref={setRefs}
        role={isInteractive ? "button" : undefined}
        tabIndex={isInteractive && !disabled ? 0 : -1}
        aria-disabled={disabled}
        data-state={disabled ? "disabled" : "active"}
        data-nested={isNested}
        onClick={isInteractive && !disabled ? onClick : undefined}
        onKeyDown={handleKeyDown}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className={cn(
          // Layout Base
          "relative overflow-hidden backface-visibility-hidden",
          fluid ? "w-full" : "w-auto inline-block",
          isolate && !isNested ? "isolate" : "",
          "group/glass",
          // Shape & Visuals
          STYLES.rounded[rounded],
          bgClass,
          STYLES.surface[surface],
          STYLES.blur[blur],
          finalBorderClass,
          STYLES.shadow[shadow],
          // Optical Corrections
          "backdrop-saturate-[1.1] dark:backdrop-saturate-[1.5]", // Default boosts
          variant !== "ghost" && "group-hover/glass:backdrop-saturate-[1.2]",
          // Interaction Styles
          isInteractive &&
            !disabled && [
              "cursor-pointer outline-none select-none",
              "transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
              hover && "hover:-translate-y-[2px] hover:shadow-lg",
              "active:scale-[0.98] active:duration-100",
              // Focus Rings
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              variant === "danger"
                ? "focus-visible:ring-red-500/50"
                : "focus-visible:ring-indigo-500/50 dark:focus-visible:ring-indigo-400/50",
            ],
          disabled && "opacity-60 cursor-not-allowed grayscale-[0.5]",
          // Animation
          animate &&
            "animate-in fade-in zoom-in-95 duration-500 ease-out slide-in-from-bottom-2",
          className,
        )}
        style={style}
        {...props}
      >
        {/* Layer 1: Texture (Noise/Grid) */}

        <TextureLayer type={texture || "none"} />

        {/* Layer 2: Shimmer Effect (Skeleton/Loading) */}

        {shimmer && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] pointer-events-none overflow-hidden rounded-[inherit]"
          >
            <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/10 to-transparent skew-x-[-20deg] animate-[shimmer_2s_infinite]" />
          </div>
        )}

        {/* Layer 3: Inner Glow (Edge lighting) */}

        {glow && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] pointer-events-none rounded-[inherit] shadow-[inset_0_0_40px_rgba(255,255,255,0.3)] dark:shadow-[inset_0_0_40px_rgba(255,255,255,0.05)]"
          />
        )}

        {/* Layer 4: Interactive Spotlight */}

        <SpotlightLayer show={!!spotlight} color={getSpotlightColor()} />

        {/* Layer 5: Top Highlight Border (Glass feel) */}

        <div
          aria-hidden="true"
          className="absolute inset-0 z-[2] pointer-events-none rounded-[inherit] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] mix-blend-overlay"
        />

        {/* Content Layer */}

        <div className="relative z-10 w-full h-full">{children}</div>
      </Component>
    );

    if (portal) {
      return (
        <PortalWrapper>
          <GlassContext.Provider value={effectiveNesting + 1}>
            {renderContent()}
          </GlassContext.Provider>
        </PortalWrapper>
      );
    }

    return (
      <GlassContext.Provider value={effectiveNesting + 1}>
        {renderContent()}
      </GlassContext.Provider>
    );
  },
);

LiquidGlass.displayName = "LiquidGlass";

const PortalWrapper = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(children, document.body);
};

// ==========================================
// 5. ENTERPRISE PRESETS
// ==========================================

export const LiquidGlassPresets = {
  /** Standard container for content */
  Card: (props: LiquidGlassProps) => (
    <LiquidGlass
      variant="primary"
      opacity="60"
      blur="xl"
      border="distinct"
      shadow="sm"
      texture="matte"
      animate={true}
      {...props}
    />
  ),

  /** Floating dialogs */
  Modal: (props: LiquidGlassProps) => (
    <LiquidGlass
      variant="primary"
      opacity="95"
      blur="2xl"
      border="highlight"
      shadow="2xl"
      glow={true}
      rounded="2xl"
      animate={true}
      isolate={true}
      {...props}
    />
  ),

  /** Interactive clickable feature block */
  Feature: (props: LiquidGlassProps) => (
    <LiquidGlass
      variant="secondary"
      opacity="30"
      blur="lg"
      surface="gradient-diagonal"
      border="subtle"
      shadow="md"
      texture="noise"
      spotlight={true}
      interactive={true}
      hover={true}
      rounded="2xl"
      className="hover:border-white/40 dark:hover:border-white/20"
      {...props}
    />
  ),

  /** Error or Danger zone */
  Alert: (props: LiquidGlassProps) => (
    <LiquidGlass
      variant="danger"
      opacity="10"
      blur="md"
      border="subtle"
      shadow="none"
      texture="noise"
      spotlight={true}
      rounded="xl"
      className="text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30"
      {...props}
    />
  ),

  /** Form Input Field Wrapper */
  Input: ({ className, ...props }: LiquidGlassProps) => (
    <LiquidGlass
      variant="secondary"
      opacity="10"
      blur="md"
      border="distinct"
      rounded="full"
      shadow="none"
      interactive={false} // Inputs handle their own interaction
      className={cn(
        "transition-all ring-0 group-focus-within/glass:ring-2 group-focus-within/glass:ring-indigo-500/20 group-focus-within/glass:bg-white/50 dark:group-focus-within/glass:bg-zinc-800/80",

        className,
      )}
      {...props}
    />
  ),

  /** Sticky Nav Bar */
  Navigation: (props: LiquidGlassProps) => (
    <LiquidGlass
      variant="frosted"
      blur="lg"
      opacity="80"
      border="distinct"
      shadow="sm"
      texture="noise"
      rounded="2xl"
      className="sticky top-0 z-50 border-x-0 border-t-0"
      {...props}
    />
  ),

  Dropdown: (props: LiquidGlassProps) => (
    <LiquidGlass
      variant="primary"
      opacity="80"
      blur="lg"
      border="distinct"
      shadow="lg"
      texture="none"
      rounded="xl"
      {...props}
    />
  ),
};

// ==========================================
// 6. EXPORTS
// ==========================================

export const LiquidGlassCard = LiquidGlassPresets.Card;
export const LiquidGlassModal = LiquidGlassPresets.Modal;
export const LiquidGlassFeature = LiquidGlassPresets.Feature;
export const LiquidGlassAlert = LiquidGlassPresets.Alert;
export const LiquidGlassInput = LiquidGlassPresets.Input;
export const LiquidGlassNavigation = LiquidGlassPresets.Navigation;
export const LiquidGlassDropdown = LiquidGlassPresets.Dropdown;

export default LiquidGlass;
