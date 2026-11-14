"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
import type * as SelectPrimitive from "@radix-ui/react-select";
import { ChevronDownIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { SelectTrigger, SelectValue } from "../ui/select";
import {
  LiquidGlassInput,
  useGlassNestingLevel,
  type GlassVariant,
  type GlassBlur,
  type GlassOpacity,
} from "../liquid-glass/liquid-glass";
import { LiquidGlassAnchor } from "../liquid-glass/liquid-glass-anchor";
import {
  LiquidGlassConfigProvider,
  useLiquidGlassConfig,
} from "../liquid-glass/liquid-glass-config";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * Hệ thống phân tầng Z-Index chuẩn cho LiquidGlassAnchor của TriggerSelect:
 * - Page Anchor: 10 (nằm trên LiquidGlassCard z-0, dưới NavHeader z-40)
 * - Sheet Anchor: 55 (nằm trên GlassSheet z-50, dưới GlassModal z-70 và dưới ContentSelect z-100 / LiquidPopover z-110)
 * - Modal Anchor: 75 (nằm trên GlassModal z-70, dưới ContentSelect z-100 / LiquidPopover z-110)
 */
const LAYER_Z_INDEX = {
  pageAnchor: 10,
  sheetAnchor: 55,
  modalAnchor: 75,
} as const;

export interface TriggerSelectProps
  extends React.ComponentProps<typeof SelectPrimitive.Trigger> {
  size?: "sm" | "default";
  placeholder?: string;
  fluid?: boolean;
  /** Bật/tắt cơ chế LiquidGlassAnchor hỗ trợ kính lồng kính (mặc định tự động bật khi đặt trên nền LiquidGlass) */
  enableGlassAnchor?: boolean;
  glassZIndex?: number;
  overflowPadding?: number;
  glassVariant?: GlassVariant;
  glassBlur?: GlassBlur;
  glassOpacity?: GlassOpacity;
}

interface SelectTriggerAnchorBridgeProps extends TriggerSelectProps {
  isFluid: boolean;
  isNested: boolean;
  anchorActive: boolean;
  placeholderNodeRef: React.MutableRefObject<HTMLDivElement | null>;
}

function SelectTriggerAnchorBridge({
  children,
  className,
  size = "default",
  placeholder,
  isFluid,
  isNested,
  anchorActive,
  placeholderNodeRef,
  glassVariant,
  glassBlur,
  glassOpacity,
  ...props
}: SelectTriggerAnchorBridgeProps) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [isInteractiveInstance, setIsInteractiveInstance] = useState(
    !anchorActive,
  );

  useIsomorphicLayoutEffect(() => {
    if (!anchorActive) {
      setIsInteractiveInstance(true);
      return;
    }
    const el = hostRef.current;
    if (!el) return;
    // Bản sao hiển thị thực tế của LiquidGlassAnchor nằm bên trong .liquid-glass-clipper;
    // Bản sao ẩn dùng để giữ chỗ đo kích thước nằm trong div[aria-hidden="true"] ngoài clipper.
    const insideClipper = Boolean(el.closest(".liquid-glass-clipper"));
    setIsInteractiveInstance(insideClipper);

    if (!insideClipper) {
      placeholderNodeRef.current = el;
    }
  }, [anchorActive, placeholderNodeRef]);

  // Đồng bộ kích thước tự nhiên từ bản sao hiển thị thực tế về bản sao giữ chỗ ẩn khi fluid={false}
  useEffect(() => {
    if (!anchorActive || !isInteractiveInstance) return;
    const el = hostRef.current;
    if (!el) return;

    const syncDimensionsToPlaceholder = () => {
      const placeholderEl = placeholderNodeRef.current;
      if (!placeholderEl || !el) return;
      if (!isFluid) {
        const naturalWidth = Math.ceil(el.getBoundingClientRect().width);
        if (naturalWidth > 0) {
          placeholderEl.style.minWidth = `${naturalWidth}px`;
        }
      }
      const naturalHeight = Math.ceil(el.getBoundingClientRect().height);
      if (naturalHeight > 0) {
        placeholderEl.style.height = `${naturalHeight}px`;
      }
    };

    syncDimensionsToPlaceholder();
    const ro = new ResizeObserver(syncDimensionsToPlaceholder);
    ro.observe(el);
    return () => ro.disconnect();
  }, [anchorActive, isInteractiveInstance, isFluid, placeholderNodeRef]);

  const resolvedVariant: GlassVariant =
    glassVariant || (isNested ? "frosted" : "secondary");
  const resolvedBlur: GlassBlur = glassBlur || (isNested ? "xl" : "md");
  const resolvedOpacity: GlassOpacity =
    glassOpacity || (isNested ? "40" : "20");

  // Nếu là bản sao giữ chỗ ẩn trong LiquidGlassAnchor: chỉ render khung giữ kích thước,
  // tuyệt đối không mount trùng SelectPrimitive.Trigger / SelectPrimitive.Value để tránh xung đột ref của Radix Select
  if (anchorActive && !isInteractiveInstance) {
    return (
      <div
        ref={hostRef}
        data-slot="select-trigger-anchor-placeholder"
        className={cn(
          isFluid ? "w-full" : "w-max shrink-0",
          "pointer-events-none select-none",
        )}
      >
        <div
          data-size={size}
          className={cn(
            "flex items-center justify-between gap-2 rounded-full px-3 py-2 text-sm whitespace-nowrap",
            "data-[size=default]:h-9 data-[size=sm]:h-8",
            isFluid ? "w-full" : "w-fit min-w-[7rem]",
            className,
          )}
        >
          <span className="truncate">{placeholder || "\u00A0"}</span>
          <ChevronDownIcon className="size-4 shrink-0 opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div ref={hostRef} className={cn(isFluid ? "w-full" : "w-max shrink-0")}>
      <LiquidGlassInput
        fluid={isFluid}
        variant={resolvedVariant}
        blur={resolvedBlur}
        opacity={resolvedOpacity}
        surface={isNested ? "glossy" : "flat"}
        border={isNested ? "highlight" : "distinct"}
        shadow={isNested ? "sm" : "none"}
        glow={isNested}
        className={cn(
          isFluid ? "w-full" : "w-max shrink-0",
          isNested &&
            "ring-1 ring-white/30 dark:ring-white/15 hover:bg-white/55 dark:hover:bg-zinc-800/70",
        )}
      >
        <SelectTrigger
          className={cn(
            "w-full rounded-full cursor-pointer border-0 shadow-none bg-transparent! dark:bg-transparent! dark:hover:bg-transparent!",
            className,
          )}
          size={size}
          {...props}
        >
          {children ??
            (placeholder ? (
              <SelectValue placeholder={placeholder} />
            ) : (
              <SelectValue />
            ))}
        </SelectTrigger>
      </LiquidGlassInput>
    </div>
  );
}

export default function TriggerSelect({
  children,
  className,
  size = "default",
  placeholder,
  fluid = false,
  enableGlassAnchor,
  glassZIndex,
  overflowPadding = 2,
  glassVariant,
  glassBlur,
  glassOpacity,
  ...props
}: TriggerSelectProps) {
  const nestingLevel = useGlassNestingLevel();
  const themeConfig = useLiquidGlassConfig();
  const probeRef = useRef<HTMLSpanElement | null>(null);
  const placeholderNodeRef = useRef<HTMLDivElement | null>(null);

  const isNested = nestingLevel > 0;
  // Tự động nhận diện w-full từ className để đảm bảo bố cục đồng nhất dù không truyền fluid={true}
  const isFluid = fluid || Boolean(className && /\bw-full\b/.test(className));

  const [detectedLayerZIndex, setDetectedLayerZIndex] = useState<number>(
    glassZIndex ?? LAYER_Z_INDEX.pageAnchor,
  );
  const [isSuppressedByHigherLayer, setIsSuppressedByHigherLayer] =
    useState(false);

  // Phát hiện ngữ cảnh Dialog (z-70) / Sheet (z-50) / Page (z-0)
  // để cấp zIndex phân tầng chính xác (10 / 55 / 75) cho LiquidGlassAnchor, luôn thấp hơn ContentSelect (z-100) và LiquidPopoverContent (z-110)
  const updateLayerContext = useCallback(() => {
    const probeEl = probeRef.current;
    if (!probeEl || typeof window === "undefined") return;

    const dialogEl = probeEl.closest(
      '[data-slot="dialog-content"]',
    ) as HTMLElement | null;
    const sheetEl = probeEl.closest(
      '[data-slot="sheet-content"]',
    ) as HTMLElement | null;
    const containerEl = dialogEl || sheetEl;

    if (dialogEl) {
      setDetectedLayerZIndex(glassZIndex ?? LAYER_Z_INDEX.modalAnchor);
    } else if (sheetEl) {
      setDetectedLayerZIndex(glassZIndex ?? LAYER_Z_INDEX.sheetAnchor);
    } else {
      setDetectedLayerZIndex(
        glassZIndex ??
          Math.min(
            LAYER_Z_INDEX.pageAnchor,
            themeConfig.zIndexRegistry.anchor || LAYER_Z_INDEX.pageAnchor,
          ),
      );
    }

    if (containerEl) {
      const isHiddenByOverlay =
        containerEl.getAttribute("aria-hidden") === "true" ||
        containerEl.getAttribute("data-aria-hidden") === "true" ||
        containerEl.getAttribute("data-state") === "closed";
      setIsSuppressedByHigherLayer(isHiddenByOverlay);
    } else {
      const ariaHiddenAncestor = probeEl.closest(
        '[aria-hidden="true"], [data-aria-hidden="true"]',
      );
      setIsSuppressedByHigherLayer(Boolean(ariaHiddenAncestor));
    }
  }, [glassZIndex, themeConfig.zIndexRegistry.anchor]);

  useIsomorphicLayoutEffect(() => {
    updateLayerContext();
    const probeEl = probeRef.current;
    if (!probeEl || typeof MutationObserver === "undefined") return;

    const observer = new MutationObserver(() => {
      updateLayerContext();
    });

    observer.observe(document.body, {
      attributes: true,
      subtree: true,
      attributeFilter: ["aria-hidden", "data-aria-hidden", "data-state"],
    });

    return () => observer.disconnect();
  }, [updateLayerContext]);

  const shouldUseAnchor =
    (enableGlassAnchor ?? isNested) &&
    !props.disabled &&
    !isSuppressedByHigherLayer;

  // Đồng bộ lại tọa độ của LiquidGlassAnchor sau khi hiệu ứng mở của LiquidGlassCard (300ms),
  // GlassModal (200ms) hoặc GlassSheet (500ms) hoàn tất
  useEffect(() => {
    if (!shouldUseAnchor || typeof window === "undefined") return;

    const triggerSync = () => {
      window.dispatchEvent(new Event("scroll"));
    };

    const timers = [
      setTimeout(triggerSync, 40),
      setTimeout(triggerSync, 160),
      setTimeout(triggerSync, 320),
      setTimeout(triggerSync, 540),
    ];

    const probeEl = probeRef.current;
    const animatedAncestor = probeEl?.closest(
      '[data-slot="liquid-glass"], [data-slot="dialog-content"], [data-slot="sheet-content"]',
    );

    animatedAncestor?.addEventListener("animationend", triggerSync);
    animatedAncestor?.addEventListener("transitionend", triggerSync);

    return () => {
      timers.forEach(clearTimeout);
      animatedAncestor?.removeEventListener("animationend", triggerSync);
      animatedAncestor?.removeEventListener("transitionend", triggerSync);
    };
  }, [shouldUseAnchor]);

  // Mở khóa giới hạn maxBackdropNestingDepth cho TriggerSelect để khi đặt trong GlassSheet -> LiquidGlassCard -> GlassModal
  // vẫn giữ nguyên hiệu ứng backdrop-blur của LiquidGlass
  const triggerGlassConfig = useMemo(
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

  return (
    <LiquidGlassConfigProvider config={triggerGlassConfig}>
      <span ref={probeRef} className="hidden" aria-hidden="true" />
      <LiquidGlassAnchor
        disabled={!shouldUseAnchor}
        zIndex={detectedLayerZIndex}
        overflowPadding={overflowPadding}
        className={cn(isFluid ? "w-full block" : "w-max inline-flex shrink-0")}
        contentClassName="pointer-events-auto"
      >
        <SelectTriggerAnchorBridge
          className={className}
          size={size}
          placeholder={placeholder}
          isFluid={isFluid}
          isNested={isNested}
          anchorActive={shouldUseAnchor}
          placeholderNodeRef={placeholderNodeRef}
          glassVariant={glassVariant}
          glassBlur={glassBlur}
          glassOpacity={glassOpacity}
          {...props}
        >
          {children}
        </SelectTriggerAnchorBridge>
      </LiquidGlassAnchor>
    </LiquidGlassConfigProvider>
  );
}
