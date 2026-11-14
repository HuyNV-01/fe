/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  useMemo,
  type ReactNode,
  type RefObject,
  cloneElement,
  isValidElement,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";
import {
  type GlassPlacement,
  useGlassPosition,
} from "@/utils/hooks/use-glass-position";
import { LiquidGlassDropdown, useGlassNestingLevel } from "./liquid-glass";
import {
  LiquidGlassConfigProvider,
  useLiquidGlassConfig,
} from "./liquid-glass-config";

/**
 * Hằng số Z-Index chuẩn cho LiquidPopoverContent trong Root Stacking Context (document.body):
 * - Page Anchor (TriggerSelect / PatternButton): 10
 * - NavHeader Sticky: 40
 * - GlassSheet (Drawer): 50 | Sheet Anchor: 55
 * - GlassModal (Dialog): 70 | Modal Anchor: 75
 * - ContentSelect / DropdownMenuContentCus: 100
 * - LiquidPopoverContent: 110 (luôn nổi hoàn toàn lên trên mọi thẻ Select, Sheet và Modal)
 * - Toast: 120 | Tooltip: 130
 */
export const LIQUID_POPOVER_Z_INDEX = 110;

function assignRef<T = any>(
  ref: React.MutableRefObject<T> | React.LegacyRef<T> | undefined | null,
  value: T,
) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref != null) {
    (ref as React.MutableRefObject<T | null>).current = value;
  }
}

// ==========================================
// 1. CONTEXT
// ==========================================

interface AnchorContextType {
  triggerRef: RefObject<HTMLElement | null>;
  contentRef: RefObject<HTMLElement | null>;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  placement: GlassPlacement;
  offset: number;
  matchWidth?: boolean;
  autoFlip: boolean;
  closeOnClickOutside: boolean;
}

const AnchorContext = createContext<AnchorContextType | undefined>(undefined);

// ==========================================
// 2. ROOT COMPONENT
// ==========================================

export interface LiquidPopoverProps {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultOpen?: boolean;
  placement?: GlassPlacement;
  offset?: number;
  matchWidth?: boolean;
  autoFlip?: boolean;
  closeOnClickOutside?: boolean;
  className?: string;
}

export const LiquidPopover = ({
  children,
  open: controlledOpen,
  onOpenChange,
  defaultOpen = false,
  placement = "bottom-start",
  offset = 8,
  matchWidth,
  autoFlip = true,
  closeOnClickOutside = true,
  className,
}: LiquidPopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);

  const isOpen = controlledOpen ?? uncontrolledOpen;

  const setIsOpen = useCallback(
    (value: boolean) => {
      if (onOpenChange) onOpenChange(value);
      else setUncontrolledOpen(value);
    },
    [onOpenChange],
  );

  useEffect(() => {
    if (!isOpen) return;

    const handlePointerOutside = (event: MouseEvent | TouchEvent) => {
      if (!closeOnClickOutside) return;
      const target = event.target as HTMLElement | null;
      if (!target) return;

      const isTrigger = triggerRef.current?.contains(target);
      const isContent =
        contentRef.current?.contains(target) ||
        Boolean(target.closest?.('[data-liquid-popover-content="true"]'));

      if (!isTrigger && !isContent) {
        setIsOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        // Ngăn sự kiện Escape lan lên làm đóng cả GlassSheet / GlassModal cha
        event.stopPropagation();
        setIsOpen(false);
      }
    };

    // Chặn sự kiện focusin/focusout ở pha capture trên document khi tiêu điểm di chuyển vào bên trong LiquidPopoverContent
    // (được portal ra document.body ở z-index: 110) để FocusScope của Radix Dialog/Sheet không bao giờ giật lại focus
    const handleFocusTrapBypass = (event: FocusEvent) => {
      const target = event.target as HTMLElement | null;
      const relatedTarget = event.relatedTarget as HTMLElement | null;
      const isTargetInPopover =
        contentRef.current?.contains(target) ||
        Boolean(target?.closest?.('[data-liquid-popover-content="true"]'));
      const isRelatedInPopover =
        contentRef.current?.contains(relatedTarget) ||
        Boolean(
          relatedTarget?.closest?.('[data-liquid-popover-content="true"]'),
        );

      if (isTargetInPopover || isRelatedInPopover) {
        event.stopImmediatePropagation();
      }
    };

    document.addEventListener("mousedown", handlePointerOutside);
    document.addEventListener("touchstart", handlePointerOutside, {
      passive: true,
    });
    document.addEventListener("keydown", handleEscape, true);
    document.addEventListener("focusin", handleFocusTrapBypass, true);
    document.addEventListener("focusout", handleFocusTrapBypass, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerOutside);
      document.removeEventListener("touchstart", handlePointerOutside);
      document.removeEventListener("keydown", handleEscape, true);
      document.removeEventListener("focusin", handleFocusTrapBypass, true);
      document.removeEventListener("focusout", handleFocusTrapBypass, true);
    };
  }, [isOpen, closeOnClickOutside, setIsOpen]);

  const contextValue = useMemo<AnchorContextType>(
    () => ({
      triggerRef,
      contentRef,
      isOpen,
      setIsOpen,
      placement,
      offset,
      matchWidth,
      autoFlip,
      closeOnClickOutside,
    }),
    [
      isOpen,
      setIsOpen,
      placement,
      offset,
      matchWidth,
      autoFlip,
      closeOnClickOutside,
    ],
  );

  return (
    <AnchorContext.Provider value={contextValue}>
      <div className={cn("relative w-full inline-block", className)}>
        {children}
      </div>
    </AnchorContext.Provider>
  );
};

// ==========================================
// 3. TRIGGER COMPONENT (Smart Input, Disabled Guard & Stable React 19 Ref)
// ==========================================

export interface LiquidPopoverTriggerProps
  extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
  disabled?: boolean;
}

export const LiquidPopoverTrigger = React.forwardRef<
  HTMLElement,
  LiquidPopoverTriggerProps
>(
  (
    {
      children,
      className,
      asChild = false,
      disabled = false,
      onClick,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const context = useContext(AnchorContext);
    if (!context) {
      throw new Error("LiquidPopoverTrigger must be used within LiquidPopover");
    }

    const childElement =
      asChild && isValidElement(children)
        ? (children as React.ReactElement<any>)
        : null;
    const childRef = childElement
      ? ((childElement.props as any)?.ref ?? (childElement as any).ref)
      : null;
    const isChildDisabled = Boolean(
      disabled ||
        (childElement?.props as any)?.disabled ||
        (childElement?.props as any)?.["aria-disabled"] === true ||
        (childElement?.props as any)?.["aria-disabled"] === "true",
    );

    const setTriggerRefs = useCallback(
      (node: HTMLElement | null) => {
        // Nếu phần tử được bọc trong LiquidGlassAnchor (có bản sao ẩn trong aria-hidden="true" và bản sao thật trong .liquid-glass-clipper),
        // luôn ưu tiên gán triggerRef vào bản sao hiển thị thực tế để đo tọa độ chính xác
        if (node) {
          const isHiddenAnchorCopy =
            node.closest?.('[aria-hidden="true"]') &&
            !node.closest?.(".liquid-glass-clipper");
          if (
            !isHiddenAnchorCopy ||
            !context.triggerRef.current ||
            !document.body.contains(context.triggerRef.current)
          ) {
            (
              context.triggerRef as React.MutableRefObject<HTMLElement | null>
            ).current = node;
          }
        } else if (
          context.triggerRef.current &&
          !document.body.contains(context.triggerRef.current)
        ) {
          (
            context.triggerRef as React.MutableRefObject<HTMLElement | null>
          ).current = null;
        }
        assignRef(ref, node);
        assignRef(childRef, node);
      },
      [context.triggerRef, ref, childRef],
    );

    const handleSmartToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
      if (isChildDisabled) return;

      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (!context.isOpen) context.setIsOpen(true);
        return;
      }

      context.setIsOpen(!context.isOpen);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (isChildDisabled) return;

      if (e.key === " " || e.key === "Enter" || e.key === "ArrowDown") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          if (e.key === "ArrowDown" && !context.isOpen) {
            context.setIsOpen(true);
          }
          return;
        }

        e.preventDefault();
        if (e.key === "ArrowDown") {
          if (!context.isOpen) context.setIsOpen(true);
        } else {
          handleSmartToggle(e);
        }
      }

      onKeyDown?.(e as any);
    };

    if (asChild && childElement) {
      return cloneElement(childElement, {
        ...props,
        ref: setTriggerRefs,
        "aria-expanded": context.isOpen,
        "data-state": context.isOpen ? "open" : "closed",
        onClick: (e: React.MouseEvent) => {
          childElement.props.onClick?.(e);
          onClick?.(e as any);
          if (!e.defaultPrevented && !isChildDisabled) {
            handleSmartToggle(e);
          }
        },
        onKeyDown: (e: React.KeyboardEvent) => {
          childElement.props.onKeyDown?.(e);
          handleKeyDown(e);
        },
        className: cn(childElement.props.className, className),
      } as any);
    }

    return (
      <button
        ref={setTriggerRefs as React.Ref<HTMLButtonElement>}
        type="button"
        disabled={isChildDisabled}
        aria-expanded={context.isOpen}
        data-state={context.isOpen ? "open" : "closed"}
        className={cn(
          "w-full bg-transparent border-none p-0 m-0 text-left cursor-pointer outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/20 rounded-sm",
          isChildDisabled &&
            "opacity-50 cursor-not-allowed pointer-events-none",
          className,
        )}
        onClick={(e) => {
          onClick?.(e as any);
          if (!e.defaultPrevented) handleSmartToggle(e);
        }}
        onKeyDown={handleKeyDown}
        {...props}
      >
        {children}
      </button>
    );
  },
);
LiquidPopoverTrigger.displayName = "LiquidPopoverTrigger";

// ==========================================
// 4. CONTENT COMPONENT (Root Stacking Context z-110, Glass-on-Glass & Viewport Clamping)
// ==========================================

const EXPLICIT_WIDTH_CLASS_REGEX =
  /\b(?:sm:|md:|lg:|xl:|2xl:)?w-(?!full\b|auto\b|fit\b|max\b|min\b)\S+/;

export interface LiquidPopoverContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  portal?: boolean;
  portalContainer?: HTMLElement | null;
  forceMount?: boolean;
  matchWidth?: boolean;
  align?: "start" | "center" | "end";
  sideOffset?: number;
  zIndex?: number;
  /** Disable automatic LiquidGlassDropdown wrapper when custom glass surface is already provided */
  unstyled?: boolean;
  /** Auto focus search/command input inside popover when opened from a button trigger */
  autoFocusInput?: boolean;
}

export const LiquidPopoverContent = React.forwardRef<
  HTMLDivElement,
  LiquidPopoverContentProps
>(
  (
    {
      children,
      className,
      style,
      portal = true,
      portalContainer: customPortalContainer,
      forceMount = false,
      matchWidth: contentMatchWidth,
      align,
      sideOffset,
      zIndex,
      unstyled = false,
      autoFocusInput = true,
      ...props
    },
    forwardedRef,
  ) => {
    const context = useContext(AnchorContext);
    const themeConfig = useLiquidGlassConfig();
    const nestingLevel = useGlassNestingLevel();
    const [contentElement, setContentElement] = useState<HTMLElement | null>(
      null,
    );

    if (!context) {
      throw new Error("LiquidPopoverContent must be used within LiquidPopover");
    }

    const {
      isOpen,
      triggerRef,
      placement: rootPlacement,
      offset: rootOffset,
      matchWidth: rootMatchWidth,
      autoFlip,
    } = context;

    // Xác định xem có class chiều rộng tường minh (như w-64, w-72, w-[280px]) trên LiquidPopoverContent không
    const hasExplicitWidthClass = Boolean(
      (className && EXPLICIT_WIDTH_CLASS_REGEX.test(className)) ||
        style?.width !== undefined,
    );

    const effectiveMatchWidth =
      contentMatchWidth !== undefined
        ? contentMatchWidth
        : rootMatchWidth !== undefined
          ? rootMatchWidth && !hasExplicitWidthClass
          : !hasExplicitWidthClass;

    const effectivePlacement: GlassPlacement = useMemo(() => {
      if (!align) return rootPlacement;
      const [axis] = rootPlacement.split("-");
      return `${axis}-${align}` as GlassPlacement;
    }, [rootPlacement, align]);

    const effectiveOffset = sideOffset ?? rootOffset;

    // Luôn portal ra document.body (Root Stacking Context) để đứng ngang hàng với mọi .liquid-glass-clipper (LiquidGlassAnchor),
    // đảm bảo z-index: 110 của LiquidPopoverContent luôn nổi hoàn toàn lên trên mọi TriggerSelect (z-10 / z-55 / z-75),
    // GlassSheet (z-50), GlassModal (z-70) và ContentSelect (z-100)
    const resolvedPortalContainer = useMemo(() => {
      if (!portal || typeof document === "undefined") return null;
      return customPortalContainer || document.body;
    }, [portal, customPortalContainer]);

    const isCustomContainer = Boolean(
      resolvedPortalContainer &&
        typeof document !== "undefined" &&
        resolvedPortalContainer !== document.body &&
        resolvedPortalContainer !== document.documentElement,
    );

    const setContentWrapperRef = useCallback(
      (node: HTMLDivElement | null) => {
        setContentElement((prev) => (prev === node ? prev : node));
        if (context.contentRef) {
          (
            context.contentRef as React.MutableRefObject<HTMLElement | null>
          ).current = node;
        }
        assignRef(forwardedRef, node);
      },
      [context.contentRef, forwardedRef],
    );

    const coords = useGlassPosition({
      triggerRef,
      contentElement,
      portalContainer: isCustomContainer ? resolvedPortalContainer : null,
      isOpen,
      placement: effectivePlacement,
      offset: effectiveOffset,
      matchWidth: effectiveMatchWidth,
      autoFlip,
    });

    // Ngăn chặn sự kiện wheel / touchmove lan lên document làm react-remove-scroll của Radix Dialog/Sheet chặn cuộn danh sách
    useEffect(() => {
      if (!isOpen || !contentElement) return;

      const stopScrollPropagation = (e: Event) => {
        e.stopPropagation();
      };

      contentElement.addEventListener("wheel", stopScrollPropagation, {
        passive: true,
      });
      contentElement.addEventListener("touchmove", stopScrollPropagation, {
        passive: true,
      });

      return () => {
        contentElement.removeEventListener("wheel", stopScrollPropagation);
        contentElement.removeEventListener("touchmove", stopScrollPropagation);
      };
    }, [isOpen, contentElement]);

    // Tự động focus vào ô tìm kiếm (CommandInput / Input) khi mở Popover từ nút bấm (như ProvinceDistrictWardCombobox),
    // nhưng giữ nguyên focus ở Trigger nếu Trigger chính là ô Input (như LiquidSearch inline mode)
    useEffect(() => {
      if (!isOpen || !coords || !autoFocusInput || !contentElement) return;

      const triggerEl = triggerRef.current;
      const activeEl =
        typeof document !== "undefined" ? document.activeElement : null;
      const isTriggerInputActive =
        triggerEl &&
        (triggerEl.tagName === "INPUT" ||
          triggerEl.tagName === "TEXTAREA" ||
          (activeEl &&
            (activeEl.tagName === "INPUT" || activeEl.tagName === "TEXTAREA") &&
            triggerEl.contains(activeEl)));

      if (isTriggerInputActive) return;

      const rafId = requestAnimationFrame(() => {
        const searchInput = contentElement.querySelector<HTMLElement>(
          '[data-slot="command-input"], [cmdk-input], input:not([type="hidden"]):not([disabled])',
        );
        if (searchInput) {
          searchInput.focus({ preventScroll: true });
        }
      });

      return () => cancelAnimationFrame(rafId);
    }, [isOpen, Boolean(coords), autoFocusInput, contentElement, triggerRef]);

    // Kiểm tra xem phần tử con truyền vào đã là một thẻ LiquidGlass (VD: LiquidGlassCard trong LiquidSearch) hay chưa
    const isSingleChildLiquidGlass = useMemo(() => {
      if (unstyled) return true;
      if (React.Children.count(children) !== 1) return false;
      const onlyChild = React.Children.only(children);
      if (!isValidElement(onlyChild)) return false;
      const childType = onlyChild.type as any;
      const typeName =
        childType?.displayName ||
        childType?.name ||
        childType?.render?.displayName ||
        childType?.render?.name ||
        "";
      const dataSlot = (onlyChild.props as any)?.["data-slot"];
      return (
        Boolean(typeName && String(typeName).includes("LiquidGlass")) ||
        dataSlot === "liquid-glass"
      );
    }, [children, unstyled]);

    // Nâng giới hạn maxBackdropNestingDepth cho lớp Popover nổi để đảm bảo không bao giờ bị tắt backdrop-blur khi lồng kính
    const overlayGlassConfig = useMemo(
      () => ({
        ...themeConfig,
        maxBackdropNestingDepth: Math.max(
          themeConfig.maxBackdropNestingDepth,
          nestingLevel + 4,
          10,
        ),
      }),
      [themeConfig, nestingLevel],
    );

    if (!isOpen && !forceMount) return null;

    const isMeasuring = !coords;
    const isOverGlass = nestingLevel > 0;
    const positionMode = isCustomContainer ? "absolute" : "fixed";
    const resolvedZIndex =
      zIndex ??
      (typeof style?.zIndex === "number"
        ? style.zIndex
        : Math.max(LIQUID_POPOVER_Z_INDEX, themeConfig.zIndexRegistry.popover));

    const wrapperStyle: React.CSSProperties = coords
      ? {
          position: positionMode,
          top: coords.top,
          left: coords.left,
          width: effectiveMatchWidth ? coords.width : undefined,
          minWidth: !effectiveMatchWidth ? coords.triggerWidth : undefined,
          maxWidth: coords.maxWidth,
          maxHeight: coords.maxHeight,
          transformOrigin: coords.transformOrigin,
          pointerEvents: "auto",
          display: "flex",
          flexDirection: "column",
          transition: "none",
          ...style,
          zIndex: resolvedZIndex,
        }
      : {
          position: positionMode,
          top: 0,
          left: 0,
          width:
            effectiveMatchWidth && triggerRef.current
              ? Math.round(triggerRef.current.getBoundingClientRect().width)
              : undefined,
          opacity: 0,
          pointerEvents: "none",
          visibility: "hidden",
          ...style,
          zIndex: resolvedZIndex,
        };

    const renderedInner = isSingleChildLiquidGlass ? (
      React.Children.map(children, (child) => {
        if (!isValidElement(child)) return child;
        const element = child as React.ReactElement<any>;
        return cloneElement(element, {
          portal: false,
          style: {
            ...element.props.style,
            width: "100%",
            maxHeight: coords ? `${coords.maxHeight}px` : undefined,
          },
          className: cn(
            "outline-none",
            !isMeasuring && isOpen
              ? "animate-in fade-in zoom-in-95 duration-200"
              : "",
            element.props.className,
          ),
        });
      })
    ) : (
      <LiquidGlassDropdown
        variant="primary"
        blur={isOverGlass ? "2xl" : "xl"}
        opacity={isOverGlass ? "90" : "80"}
        surface={isOverGlass ? "glossy" : "flat"}
        border={isOverGlass ? "highlight" : "distinct"}
        glow={isOverGlass}
        shadow="2xl"
        rounded="2xl"
        isolate={true}
        animate={!isMeasuring && isOpen}
        style={{
          maxHeight: coords ? `${coords.maxHeight}px` : undefined,
        }}
        contentClassName="flex flex-col max-h-[inherit] overflow-hidden"
        className={cn(
          "w-full overflow-hidden ring-1 ring-black/5 dark:ring-white/15",
          "[&_[data-slot=command]]:bg-transparent [&_[cmdk-root]]:bg-transparent",
          "[&_[data-slot=command-input-wrapper]]:border-b [&_[data-slot=command-input-wrapper]]:border-border/40",
        )}
      >
        {children}
      </LiquidGlassDropdown>
    );

    const content = (
      <LiquidGlassConfigProvider config={overlayGlassConfig}>
        <div
          ref={setContentWrapperRef}
          data-slot="liquid-popover-content"
          data-liquid-popover-content="true"
          data-state={isOpen ? "open" : "closed"}
          data-placement={coords?.actualPlacement || effectivePlacement}
          style={wrapperStyle}
          onWheel={(e) => {
            e.stopPropagation();
          }}
          onPointerDown={(e) => {
            e.stopPropagation();
          }}
          className={cn(
            "liquid-anchor-content outline-none select-none isolate",
            className,
            "z-[110]!",
          )}
          {...props}
        >
          {renderedInner}
        </div>
      </LiquidGlassConfigProvider>
    );

    if (portal && resolvedPortalContainer) {
      return createPortal(content, resolvedPortalContainer);
    }

    return content;
  },
);
LiquidPopoverContent.displayName = "LiquidPopoverContent";
