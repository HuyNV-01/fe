"use client";

import React, {
  type ReactNode,
  useRef,
  forwardRef,
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  memo,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  type GlassVariant,
  type GlassBlur,
  type GlassOpacity,
  type GlassBorder,
  type GlassTexture,
  type GlassSurface,
  type GlassRounded,
  type GlassShadow,
  LIQUID_VARIANT_OPACITY_MAP,
  LIQUID_STYLES,
  useLiquidGlassConfig,
} from "./liquid-glass-config";

// Re-export types for backward compatibility
export type {
  GlassVariant,
  GlassBlur,
  GlassOpacity,
  GlassBorder,
  GlassTexture,
  GlassSurface,
  GlassRounded,
  GlassShadow,
};

export interface LiquidGlassProps extends React.HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  as?: React.ElementType;
  // --- Visual Configuration ---
  variant?: GlassVariant;
  blur?: GlassBlur;
  opacity?: GlassOpacity;
  surface?: GlassSurface;
  texture?: GlassTexture;
  border?: boolean | GlassBorder;
  rounded?: GlassRounded;
  shadow?: GlassShadow;
  // --- Lighting & FX ---
  shimmer?: boolean;
  glow?: boolean;
  spotlight?: boolean;
  spotlightColor?: string;
  // --- Interaction & State ---
  hover?: boolean;
  interactive?: boolean;
  disabled?: boolean;
  animate?: boolean;
  // --- Advanced Conflict Protection & Layout ---
  /** Isolates stacking context (`isolate`). Automatically disabled if nested or containing floating children when `containPortal` is false */
  isolate?: boolean;
  /** Width 100% vs inline-block auto */
  fluid?: boolean;
  /** Render inside document.body portal */
  portal?: boolean;
  /** Custom wrapper class for the inner content layer (fixes flex/scroll layout issues) */
  contentClassName?: string;
  /** Allow inner content to overflow (e.g. when hosting non-portaled tooltips/badges) */
  allowOverflow?: boolean;
}

// ============================================================================
// 1. NESTING & CONFLICT GUARD CONTEXT
// ============================================================================

const GlassNestingContext = createContext<number>(0);

export const useGlassNestingLevel = () => useContext(GlassNestingContext);

// ============================================================================
// 2. MEMOIZED TEXTURE & SPOTLIGHT LAYERS (Zero SVG Filter ID Collision)
// ============================================================================

const NOISE_SVG_DATA_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='lgNoise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23lgNoise)'/%3E%3C/svg%3E")`;
const MATTE_SVG_DATA_URI = `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='lgMatte'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='1.2' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23lgMatte)'/%3E%3C/svg%3E")`;

const TextureLayer = memo(({ type }: { type: GlassTexture }) => {
  if (!type || type === "none") return null;

  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 z-0 pointer-events-none rounded-[inherit] overflow-hidden select-none"
    >
      {type === "noise" && (
        <div
          className="w-full h-full opacity-[0.03] dark:opacity-[0.05] mix-blend-soft-light"
          style={{ backgroundImage: NOISE_SVG_DATA_URI }}
        />
      )}

      {type === "matte" && (
        <div
          className="w-full h-full opacity-[0.04] dark:opacity-[0.06] mix-blend-overlay"
          style={{ backgroundImage: MATTE_SVG_DATA_URI }}
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
});
TextureLayer.displayName = "TextureLayer";

const SpotlightLayer = memo(
  ({ show, color }: { show: boolean; color: string }) => {
    if (!show) return null;

    return (
      <div
        aria-hidden="true"
        className="absolute inset-0 z-[1] pointer-events-none transition-opacity duration-500 rounded-[inherit]"
        style={{
          opacity: "var(--lg-spotlight-opacity, 0)",
          background: `radial-gradient(550px circle at var(--lg-mouse-x, 0px) var(--lg-mouse-y, 0px), ${color}, transparent 40%)`,
        }}
      />
    );
  },
);
SpotlightLayer.displayName = "SpotlightLayer";

// ============================================================================
// 3. MAIN LIQUID GLASS COMPONENT
// ============================================================================

export const LiquidGlass = forwardRef<HTMLDivElement, LiquidGlassProps>(
  (
    {
      children,
      className,
      contentClassName,
      style,
      as: Component = "div",
      // Visuals
      variant = "primary",
      blur,
      opacity,
      surface = "flat",
      texture,
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
      // Layout & Conflict Guards
      isolate = true,
      fluid = true,
      portal = false,
      allowOverflow = false,
      onClick,
      onMouseMove,
      onMouseLeave,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const localRef = useRef<HTMLDivElement | null>(null);
    const rafSpotlightRef = useRef<number | null>(null);
    const themeConfig = useLiquidGlassConfig();
    const nestingLevel = useContext(GlassNestingContext);

    const effectiveNesting = portal ? 0 : nestingLevel;
    const isNested = effectiveNesting > 0;
    const exceedsMaxBackdropDepth =
      effectiveNesting >= themeConfig.maxBackdropNestingDepth;

    // Resolve defaults safely
    const resolvedBlur: GlassBlur = exceedsMaxBackdropDepth
      ? "none"
      : blur || themeConfig.defaultBlur;
    const resolvedTexture: GlassTexture =
      themeConfig.performanceMode === "low"
        ? "none"
        : (texture ?? themeConfig.defaultTexture);

    const defaultOpacity: GlassOpacity = isNested ? "40" : "60";
    const safeOpacity: GlassOpacity = opacity || defaultOpacity;

    // Static Tailwind Lookup (Guarantees classes exist in CSS bundle)
    const bgClass =
      LIQUID_VARIANT_OPACITY_MAP[variant]?.[safeOpacity] ||
      LIQUID_VARIANT_OPACITY_MAP.primary["60"];
    const variantMeta =
      LIQUID_STYLES.variantMeta[variant] || LIQUID_STYLES.variantMeta.primary;

    const borderKey =
      border === true ? "subtle" : border === false ? "none" : border || "none";
    const borderClassBase = LIQUID_STYLES.border[borderKey];

    const finalBorderClass =
      borderKey === "distinct" ||
      borderKey === "highlight" ||
      borderKey === "none"
        ? borderClassBase
        : cn(borderClassBase, variantMeta.border);

    const isInteractive = interactive || Boolean(onClick);
    const canSpotlight =
      spotlight && !disabled && themeConfig.performanceMode !== "low";

    useEffect(() => {
      return () => {
        if (rafSpotlightRef.current !== null) {
          cancelAnimationFrame(rafSpotlightRef.current);
        }
      };
    }, []);

    const handleMouseMove = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onMouseMove?.(e);
        if (!canSpotlight) return;

        const clientX = e.clientX;
        const clientY = e.clientY;

        if (rafSpotlightRef.current !== null) {
          cancelAnimationFrame(rafSpotlightRef.current);
        }

        rafSpotlightRef.current = requestAnimationFrame(() => {
          const element = localRef.current;
          if (!element) return;
          const rect = element.getBoundingClientRect();
          element.style.setProperty("--lg-mouse-x", `${clientX - rect.left}px`);
          element.style.setProperty("--lg-mouse-y", `${clientY - rect.top}px`);
          element.style.setProperty("--lg-spotlight-opacity", "1");
        });
      },
      [canSpotlight, onMouseMove],
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent<HTMLDivElement>) => {
        onMouseLeave?.(e);
        if (!canSpotlight) return;
        localRef.current?.style.setProperty("--lg-spotlight-opacity", "0");
      },
      [canSpotlight, onMouseLeave],
    );

    const handleKeyDown = useCallback(
      (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (
          isInteractive &&
          !disabled &&
          (e.key === "Enter" || e.key === " ")
        ) {
          // Guard: Do not hijack Space/Enter if focus is inside an input, textarea, or button child
          const target = e.target as HTMLElement;
          const isNativeControl =
            target !== localRef.current &&
            (target.tagName === "INPUT" ||
              target.tagName === "TEXTAREA" ||
              target.tagName === "BUTTON" ||
              target.tagName === "A" ||
              target.isContentEditable);

          if (!isNativeControl) {
            e.preventDefault();
            onClick?.(e as unknown as React.MouseEvent<HTMLDivElement>);
          }
        }
        onKeyDown?.(e);
      },
      [isInteractive, disabled, onClick, onKeyDown],
    );

    const resolvedSpotlightColor = spotlightColor || variantMeta.spotlight;

    const setRefs = useCallback(
      (element: HTMLDivElement | null) => {
        localRef.current = element;
        if (typeof ref === "function") ref(element);
        else if (ref) {
          (ref as React.MutableRefObject<HTMLDivElement | null>).current =
            element;
        }
      },
      [ref],
    );

    const isButtonTag = Component === "button";

    const renderContent = () => (
      <Component
        ref={setRefs}
        role={isInteractive && !isButtonTag ? "button" : undefined}
        tabIndex={isInteractive && !disabled ? 0 : undefined}
        aria-disabled={disabled || undefined}
        data-slot="liquid-glass"
        data-variant={variant}
        data-state={disabled ? "disabled" : "active"}
        data-nested={isNested ? "true" : "false"}
        onClick={isInteractive && !disabled ? onClick : undefined}
        onKeyDown={isInteractive || onKeyDown ? handleKeyDown : undefined}
        onMouseMove={canSpotlight || onMouseMove ? handleMouseMove : undefined}
        onMouseLeave={
          canSpotlight || onMouseLeave ? handleMouseLeave : undefined
        }
        className={cn(
          "relative backface-visibility-hidden",
          allowOverflow ? "overflow-visible" : "overflow-hidden",
          fluid ? "w-full" : "w-auto inline-block",
          isolate && !isNested ? "isolate" : "",
          "group/glass",
          // Visual tokens
          LIQUID_STYLES.rounded[rounded],
          bgClass,
          LIQUID_STYLES.surface[surface],
          LIQUID_STYLES.blur[resolvedBlur],
          finalBorderClass,
          LIQUID_STYLES.shadow[shadow],
          // Optical saturation boost
          resolvedBlur !== "none" &&
            "backdrop-saturate-[1.15] dark:backdrop-saturate-[1.4]",
          variant !== "ghost" &&
            resolvedBlur !== "none" &&
            "group-hover/glass:backdrop-saturate-[1.25]",
          // Interactive states
          isInteractive &&
            !disabled && [
              "cursor-pointer outline-none select-none",
              "transition-all duration-300 ease-[cubic-bezier(0.25,0.46,0.45,0.94)]",
              hover && "hover:-translate-y-[2px] hover:shadow-lg",
              "active:scale-[0.98] active:duration-100",
              "focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
              variantMeta.focusRing,
            ],
          disabled && "opacity-60 cursor-not-allowed grayscale-[0.4]",
          animate && "animate-in fade-in zoom-in-95 duration-300 ease-out",
          className,
        )}
        style={style}
        {...props}
      >
        {/* Layer 1: Texture */}
        <TextureLayer type={resolvedTexture} />

        {/* Layer 2: Shimmer Effect */}
        {shimmer && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] pointer-events-none overflow-hidden rounded-[inherit]"
          >
            <div className="absolute top-0 left-[-100%] w-[50%] h-full bg-gradient-to-r from-transparent via-white/15 to-transparent skew-x-[-20deg] animate-[shimmer_2s_infinite]" />
          </div>
        )}

        {/* Layer 3: Inner Glow */}
        {glow && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[1] pointer-events-none rounded-[inherit] shadow-[inset_0_0_36px_rgba(255,255,255,0.28)] dark:shadow-[inset_0_0_36px_rgba(255,255,255,0.06)]"
          />
        )}

        {/* Layer 4: Interactive Spotlight */}
        <SpotlightLayer show={canSpotlight} color={resolvedSpotlightColor} />

        {/* Layer 5: Specular Top Edge Highlight */}
        {variant !== "ghost" && (
          <div
            aria-hidden="true"
            className="absolute inset-0 z-[2] pointer-events-none rounded-[inherit] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25)] dark:shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] mix-blend-overlay"
          />
        )}

        {/* Layer 6: Content Container */}
        <div className={cn("relative z-10 w-full h-full", contentClassName)}>
          {children}
        </div>
      </Component>
    );

    if (portal) {
      return (
        <PortalWrapper>
          <GlassNestingContext.Provider value={effectiveNesting + 1}>
            {renderContent()}
          </GlassNestingContext.Provider>
        </PortalWrapper>
      );
    }

    return (
      <GlassNestingContext.Provider value={effectiveNesting + 1}>
        {renderContent()}
      </GlassNestingContext.Provider>
    );
  },
);

LiquidGlass.displayName = "LiquidGlass";

const PortalWrapper = ({ children }: { children: ReactNode }) => {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted || typeof document === "undefined") return null;
  return createPortal(children, document.body);
};

// ============================================================================
// 4. ENTERPRISE PRESETS (ForwardRef-compatible & Conflict-free)
// ============================================================================

export const LiquidGlassPresets = {
  Card: forwardRef<HTMLDivElement, LiquidGlassProps>((props, ref) => (
    <LiquidGlass
      ref={ref}
      variant="primary"
      opacity="60"
      blur="xl"
      border="distinct"
      shadow="sm"
      texture="matte"
      animate={true}
      {...props}
    />
  )),

  Modal: forwardRef<HTMLDivElement, LiquidGlassProps>((props, ref) => (
    <LiquidGlass
      ref={ref}
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
  )),

  Feature: forwardRef<HTMLDivElement, LiquidGlassProps>(
    ({ className, ...props }, ref) => (
      <LiquidGlass
        ref={ref}
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
        className={cn(
          "hover:border-white/40 dark:hover:border-white/20",
          className,
        )}
        {...props}
      />
    ),
  ),

  Alert: forwardRef<HTMLDivElement, LiquidGlassProps>(
    ({ className, ...props }, ref) => (
      <LiquidGlass
        ref={ref}
        variant="danger"
        opacity="10"
        blur="md"
        border="subtle"
        shadow="none"
        texture="noise"
        spotlight={true}
        rounded="xl"
        className={cn(
          "text-red-600 dark:text-red-400 border-red-200 dark:border-red-900/30",
          className,
        )}
        {...props}
      />
    ),
  ),

  Input: forwardRef<HTMLDivElement, LiquidGlassProps>(
    ({ className, ...props }, ref) => (
      <LiquidGlass
        ref={ref}
        variant="secondary"
        opacity="10"
        blur="md"
        border="distinct"
        rounded="full"
        shadow="none"
        interactive={false}
        isolate={false}
        className={cn(
          "transition-all ring-0 group-focus-within/glass:ring-2 group-focus-within/glass:ring-indigo-500/20 group-focus-within/glass:bg-white/50 dark:group-focus-within/glass:bg-zinc-800/80",
          className,
        )}
        {...props}
      />
    ),
  ),

  Navigation: forwardRef<HTMLDivElement, LiquidGlassProps>(
    ({ className, ...props }, ref) => (
      <LiquidGlass
        ref={ref}
        variant="frosted"
        blur="lg"
        opacity="80"
        border="distinct"
        shadow="sm"
        texture="noise"
        rounded="2xl"
        isolate={false}
        className={cn("sticky top-0 z-40 border-x-0 border-t-0", className)}
        {...props}
      />
    ),
  ),

  Dropdown: forwardRef<HTMLDivElement, LiquidGlassProps>(
    ({ className, ...props }, ref) => (
      <LiquidGlass
        ref={ref}
        variant="primary"
        opacity="80"
        blur="xl"
        border="distinct"
        shadow="xl"
        texture="none"
        rounded="xl"
        isolate={false}
        {...props}
        className={cn("w-full", className)}
      />
    ),
  ),
};

LiquidGlassPresets.Card.displayName = "LiquidGlassCard";
LiquidGlassPresets.Modal.displayName = "LiquidGlassModal";
LiquidGlassPresets.Feature.displayName = "LiquidGlassFeature";
LiquidGlassPresets.Alert.displayName = "LiquidGlassAlert";
LiquidGlassPresets.Input.displayName = "LiquidGlassInput";
LiquidGlassPresets.Navigation.displayName = "LiquidGlassNavigation";
LiquidGlassPresets.Dropdown.displayName = "LiquidGlassDropdown";

export const LiquidGlassCard = LiquidGlassPresets.Card;
export const LiquidGlassModal = LiquidGlassPresets.Modal;
export const LiquidGlassFeature = LiquidGlassPresets.Feature;
export const LiquidGlassAlert = LiquidGlassPresets.Alert;
export const LiquidGlassInput = LiquidGlassPresets.Input;
export const LiquidGlassNavigation = LiquidGlassPresets.Navigation;
export const LiquidGlassDropdown = LiquidGlassPresets.Dropdown;

export default LiquidGlass;
