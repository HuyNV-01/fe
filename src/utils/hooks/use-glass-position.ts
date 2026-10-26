"use client";

import {
  useState,
  useCallback,
  type RefObject,
  useLayoutEffect,
  useEffect,
} from "react";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export type GlassPlacement =
  | "top-start"
  | "top-center"
  | "top-end"
  | "bottom-start"
  | "bottom-center"
  | "bottom-end"
  | "left-start"
  | "left-center"
  | "left-end"
  | "right-start"
  | "right-center"
  | "right-end";

export interface UseGlassPositionProps {
  triggerRef: RefObject<HTMLElement | null>;
  contentRef?: RefObject<HTMLElement | null>;
  contentElement?: HTMLElement | null;
  isOpen: boolean;
  placement?: GlassPlacement;
  offset?: number;
  matchWidth?: boolean;
  autoFlip?: boolean;
  viewportPadding?: number;
  /** Center horizontally on very small mobile screens if content is wide */
  mobileAdaptive?: boolean;
}

export interface PositionStyle {
  top: number;
  left: number;
  width?: number;
  maxWidth: number;
  maxHeight: number;
  transformOrigin: string;
  actualPlacement: GlassPlacement;
  isMobileViewport: boolean;
}

export function useGlassPosition({
  triggerRef,
  contentRef,
  contentElement,
  isOpen,
  placement = "bottom-start",
  offset = 8,
  matchWidth = false,
  autoFlip = true,
  viewportPadding = 12,
  mobileAdaptive = true,
}: UseGlassPositionProps) {
  const [coords, setCoords] = useState<PositionStyle | null>(null);

  const targetContent = contentElement || contentRef?.current;

  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const content = targetContent;

    if (!trigger || !content || !isOpen) return;

    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    // Use visualViewport when available (handles iOS/Android virtual keyboard & pinch zoom accurately)
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    const viewportW = vv ? vv.width : window.innerWidth;
    const viewportH = vv ? vv.height : window.innerHeight;
    const viewportOffsetLeft = vv ? vv.offsetLeft : 0;
    const viewportOffsetTop = vv ? vv.offsetTop : 0;

    const isMobileViewport = viewportW < 640;
    const safePadding = isMobileViewport
      ? Math.max(8, viewportPadding)
      : viewportPadding;
    const availableMaxW = Math.max(160, viewportW - safePadding * 2);

    let currentPlacement = placement;

    // On mobile screens, left/right placements frequently overflow horizontally; convert to bottom/top
    if (
      isMobileViewport &&
      mobileAdaptive &&
      (currentPlacement.startsWith("left") ||
        currentPlacement.startsWith("right"))
    ) {
      currentPlacement = "bottom-center";
    }

    const spaceBelow = viewportH - triggerRect.bottom - safePadding;
    const spaceAbove = triggerRect.top - safePadding;
    const spaceLeft = triggerRect.left - safePadding;
    const spaceRight = viewportW - triggerRect.right - safePadding;

    const estimatedHeight = contentRect.height || 220;
    const estimatedWidth = matchWidth
      ? Math.min(triggerRect.width, availableMaxW)
      : Math.min(contentRect.width || 240, availableMaxW);

    if (autoFlip) {
      if (
        currentPlacement.startsWith("bottom") &&
        spaceBelow < estimatedHeight + offset &&
        spaceAbove > spaceBelow
      ) {
        currentPlacement = currentPlacement.replace(
          "bottom",
          "top",
        ) as GlassPlacement;
      } else if (
        currentPlacement.startsWith("top") &&
        spaceAbove < estimatedHeight + offset &&
        spaceBelow > spaceAbove
      ) {
        currentPlacement = currentPlacement.replace(
          "top",
          "bottom",
        ) as GlassPlacement;
      } else if (
        currentPlacement.startsWith("left") &&
        spaceLeft < estimatedWidth + offset &&
        spaceRight > spaceLeft
      ) {
        currentPlacement = currentPlacement.replace(
          "left",
          "right",
        ) as GlassPlacement;
      } else if (
        currentPlacement.startsWith("right") &&
        spaceRight < estimatedWidth + offset &&
        spaceLeft > spaceRight
      ) {
        currentPlacement = currentPlacement.replace(
          "right",
          "left",
        ) as GlassPlacement;
      }
    }

    let top = 0;
    let left = 0;
    let transformOrigin = "top center";
    let maxHeight = Math.max(120, viewportH - safePadding * 2);

    const [mainAxis, align] = currentPlacement.split("-");

    switch (mainAxis) {
      case "top":
        maxHeight = Math.max(120, spaceAbove - offset);
        top = triggerRect.top - Math.min(estimatedHeight, maxHeight) - offset;
        transformOrigin =
          align === "start"
            ? "bottom left"
            : align === "end"
              ? "bottom right"
              : "bottom center";
        break;
      case "bottom":
        maxHeight = Math.max(120, spaceBelow - offset);
        top = triggerRect.bottom + offset;
        transformOrigin =
          align === "start"
            ? "top left"
            : align === "end"
              ? "top right"
              : "top center";
        break;
      case "left":
        top = triggerRect.top + (triggerRect.height - estimatedHeight) / 2;
        left = triggerRect.left - estimatedWidth - offset;
        transformOrigin = "right center";
        break;
      case "right":
        top = triggerRect.top + (triggerRect.height - estimatedHeight) / 2;
        left = triggerRect.right + offset;
        transformOrigin = "left center";
        break;
    }

    if (mainAxis === "top" || mainAxis === "bottom") {
      if (align === "start") {
        left = triggerRect.left;
      } else if (align === "end") {
        left = triggerRect.right - estimatedWidth;
      } else {
        left = triggerRect.left + (triggerRect.width - estimatedWidth) / 2;
      }
    }

    // Clamp horizontally within viewport bounds (including when matchWidth is true or on mobile)
    const minLeft = viewportOffsetLeft + safePadding;
    const maxLeft =
      viewportOffsetLeft + viewportW - estimatedWidth - safePadding;
    left = Math.max(minLeft, Math.min(left, Math.max(minLeft, maxLeft)));

    // Clamp vertically within viewport bounds
    const minTop = viewportOffsetTop + safePadding;
    const maxTop =
      viewportOffsetTop +
      viewportH -
      Math.min(estimatedHeight, maxHeight) -
      safePadding;
    top = Math.max(minTop, Math.min(top, Math.max(minTop, maxTop)));

    setCoords({
      top: Math.round(top),
      left: Math.round(left),
      width: matchWidth
        ? Math.min(Math.round(triggerRect.width), availableMaxW)
        : undefined,
      maxWidth: availableMaxW,
      maxHeight: Math.round(maxHeight),
      transformOrigin,
      actualPlacement: currentPlacement,
      isMobileViewport,
    });
  }, [
    triggerRef,
    targetContent,
    isOpen,
    placement,
    offset,
    matchWidth,
    autoFlip,
    viewportPadding,
    mobileAdaptive,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (!isOpen || !targetContent) return;

    calculatePosition();

    const resizeObserver = new ResizeObserver(() => {
      calculatePosition();
    });
    resizeObserver.observe(targetContent);
    if (triggerRef.current) {
      resizeObserver.observe(triggerRef.current);
    }

    const handleUpdate = () => requestAnimationFrame(calculatePosition);
    window.addEventListener("resize", handleUpdate, { passive: true });
    window.addEventListener("scroll", handleUpdate, {
      capture: true,
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", handleUpdate, {
      passive: true,
    });
    window.visualViewport?.addEventListener("scroll", handleUpdate, {
      passive: true,
    });

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
      window.visualViewport?.removeEventListener("resize", handleUpdate);
      window.visualViewport?.removeEventListener("scroll", handleUpdate);
    };
  }, [isOpen, calculatePosition, targetContent, triggerRef]);

  return coords;
}
