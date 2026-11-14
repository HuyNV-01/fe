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
  portalContainer?: HTMLElement | null;
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
  triggerWidth: number;
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
  portalContainer,
  isOpen,
  placement = "bottom-start",
  offset = 8,
  matchWidth = false,
  autoFlip = true,
  viewportPadding = 12,
  mobileAdaptive = true,
}: UseGlassPositionProps) {
  const [coords, setCoords] = useState<PositionStyle | null>(null);

  const targetContent = contentElement || contentRef?.current || null;

  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const content = targetContent;

    if (!trigger || !content || !isOpen) return;

    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();

    // Sử dụng visualViewport khi khả dụng để xử lý bàn phím ảo iOS/Android & zoom chính xác
    const vv = typeof window !== "undefined" ? window.visualViewport : null;
    const viewportW = vv ? vv.width : window.innerWidth;
    const viewportH = vv ? vv.height : window.innerHeight;
    const viewportOffsetLeft = vv ? vv.offsetLeft : 0;
    const viewportOffsetTop = vv ? vv.offsetTop : 0;

    const isMobileViewport = viewportW < 640;
    const safePadding = isMobileViewport
      ? Math.max(8, viewportPadding)
      : viewportPadding;
    const availableMaxW = Math.max(
      160,
      Math.round(viewportW - safePadding * 2),
    );

    let currentPlacement = placement;

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

    const triggerWidth = Math.max(40, Math.round(triggerRect.width));
    const measuredContentWidth = Math.max(
      contentRect.width,
      content.offsetWidth || 0,
    );
    const measuredContentHeight = Math.max(
      contentRect.height,
      content.offsetHeight || 0,
    );

    const estimatedHeight = measuredContentHeight || 240;
    const estimatedWidth = matchWidth
      ? Math.min(triggerWidth, availableMaxW)
      : Math.min(
          Math.max(measuredContentWidth || 256, triggerWidth),
          availableMaxW,
        );

    if (autoFlip) {
      if (
        currentPlacement.startsWith("bottom") &&
        spaceBelow < Math.min(estimatedHeight, 220) + offset &&
        spaceAbove > spaceBelow
      ) {
        currentPlacement = currentPlacement.replace(
          "bottom",
          "top",
        ) as GlassPlacement;
      } else if (
        currentPlacement.startsWith("top") &&
        spaceAbove < Math.min(estimatedHeight, 220) + offset &&
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
    let maxHeight = Math.max(140, viewportH - safePadding * 2);

    const [mainAxis, align] = currentPlacement.split("-");

    switch (mainAxis) {
      case "top":
        maxHeight = Math.max(140, spaceAbove - offset);
        top = triggerRect.top - Math.min(estimatedHeight, maxHeight) - offset;
        transformOrigin =
          align === "start"
            ? "bottom left"
            : align === "end"
              ? "bottom right"
              : "bottom center";
        break;
      case "bottom":
        maxHeight = Math.max(140, spaceBelow - offset);
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

    // Kẹp tọa độ ngang trong phạm vi khung nhìn
    const minLeft = viewportOffsetLeft + safePadding;
    const maxLeft =
      viewportOffsetLeft + viewportW - estimatedWidth - safePadding;
    left = Math.max(minLeft, Math.min(left, Math.max(minLeft, maxLeft)));

    // Kẹp tọa độ dọc trong phạm vi khung nhìn
    const minTop = viewportOffsetTop + safePadding;
    const maxTop =
      viewportOffsetTop +
      viewportH -
      Math.min(estimatedHeight, maxHeight) -
      safePadding;
    top = Math.max(minTop, Math.min(top, Math.max(minTop, maxTop)));

    // Nếu portal vào bên trong DialogContent hoặc SheetContent (position: fixed), quy đổi sang hệ tọa độ nội bộ của container đó
    if (
      portalContainer &&
      typeof document !== "undefined" &&
      portalContainer !== document.body &&
      portalContainer !== document.documentElement
    ) {
      const containerRect = portalContainer.getBoundingClientRect();
      const clientLeft = portalContainer.clientLeft || 0;
      const clientTop = portalContainer.clientTop || 0;
      left = left - (containerRect.left + clientLeft);
      top = top - (containerRect.top + clientTop);
    }

    const nextTop = Math.round(top);
    const nextLeft = Math.round(left);
    const nextWidth = matchWidth
      ? Math.min(triggerWidth, availableMaxW)
      : undefined;
    const nextMaxHeight = Math.round(maxHeight);

    // Ngăn chặn tạo object mới khi tọa độ không đổi để triệt tiêu vòng lặp ResizeObserver re-render
    setCoords((prev) => {
      if (
        prev &&
        prev.top === nextTop &&
        prev.left === nextLeft &&
        prev.width === nextWidth &&
        prev.triggerWidth === triggerWidth &&
        prev.maxWidth === availableMaxW &&
        prev.maxHeight === nextMaxHeight &&
        prev.transformOrigin === transformOrigin &&
        prev.actualPlacement === currentPlacement &&
        prev.isMobileViewport === isMobileViewport
      ) {
        return prev;
      }
      return {
        top: nextTop,
        left: nextLeft,
        width: nextWidth,
        triggerWidth,
        maxWidth: availableMaxW,
        maxHeight: nextMaxHeight,
        transformOrigin,
        actualPlacement: currentPlacement,
        isMobileViewport,
      };
    });
  }, [
    triggerRef,
    targetContent,
    portalContainer,
    isOpen,
    placement,
    offset,
    matchWidth,
    autoFlip,
    viewportPadding,
    mobileAdaptive,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (!isOpen) {
      setCoords(null);
      return;
    }
    if (!targetContent) return;

    calculatePosition();

    let rafId: number | null = null;
    const scheduleCalculate = () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        rafId = null;
        calculatePosition();
      });
    };

    const resizeObserver = new ResizeObserver(() => {
      scheduleCalculate();
    });
    resizeObserver.observe(targetContent);
    if (triggerRef.current) {
      resizeObserver.observe(triggerRef.current);
    }

    window.addEventListener("resize", scheduleCalculate, { passive: true });
    window.addEventListener("scroll", scheduleCalculate, {
      capture: true,
      passive: true,
    });
    window.visualViewport?.addEventListener("resize", scheduleCalculate, {
      passive: true,
    });
    window.visualViewport?.addEventListener("scroll", scheduleCalculate, {
      passive: true,
    });

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleCalculate);
      window.removeEventListener("scroll", scheduleCalculate, true);
      window.visualViewport?.removeEventListener("resize", scheduleCalculate);
      window.visualViewport?.removeEventListener("scroll", scheduleCalculate);
    };
  }, [isOpen, calculatePosition, targetContent, triggerRef]);

  return coords;
}
