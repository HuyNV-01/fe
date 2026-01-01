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

interface UseGlassPositionProps {
  triggerRef: RefObject<HTMLElement | null>;
  // UPDATE: Chấp nhận RefObject HOẶC HTMLElement trực tiếp
  contentRef?: RefObject<HTMLElement | null>;
  contentElement?: HTMLElement | null;

  isOpen: boolean;
  placement?: GlassPlacement;
  offset?: number;
  matchWidth?: boolean;
  autoFlip?: boolean;
}

interface PositionStyle {
  top: number;
  left: number;
  width?: number;
  transformOrigin: string;
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
}: UseGlassPositionProps) {
  const [coords, setCoords] = useState<PositionStyle | null>(null);

  const targetContent = contentElement || contentRef?.current;

  const calculatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    const content = targetContent;

    if (!trigger || !content || !isOpen) return;

    const triggerRect = trigger.getBoundingClientRect();
    const contentRect = content.getBoundingClientRect();
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let currentPlacement = placement;

    if (autoFlip) {
      const spaceBelow = viewportH - triggerRect.bottom;
      const spaceAbove = triggerRect.top;

      if (
        currentPlacement.startsWith("bottom") &&
        spaceBelow < contentRect.height + offset &&
        spaceAbove > spaceBelow
      ) {
        currentPlacement = currentPlacement.replace(
          "bottom",
          "top",
        ) as GlassPlacement;
      } else if (
        currentPlacement.startsWith("top") &&
        spaceAbove < contentRect.height + offset &&
        spaceBelow > spaceAbove
      ) {
        currentPlacement = currentPlacement.replace(
          "top",
          "bottom",
        ) as GlassPlacement;
      }
    }

    let top = 0;
    let left = 0;
    let transformOrigin = "center center";

    const [mainAxis, align] = currentPlacement.split("-");

    switch (mainAxis) {
      case "top":
        top = triggerRect.top - contentRect.height - offset;
        transformOrigin = "bottom center";
        break;
      case "bottom":
        top = triggerRect.bottom + offset;
        transformOrigin = "top center";
        break;
      case "left":
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        transformOrigin = "right center";
        break;
      case "right":
        top = triggerRect.top + (triggerRect.height - contentRect.height) / 2;
        transformOrigin = "left center";
        break;
    }

    if (mainAxis === "top" || mainAxis === "bottom") {
      if (align === "start") left = triggerRect.left;
      else if (align === "end") left = triggerRect.right - contentRect.width;
      else if (align === "center")
        left = triggerRect.left + (triggerRect.width - contentRect.width) / 2;
    } else {
      if (mainAxis === "left")
        left = triggerRect.left - contentRect.width - offset;
      else if (mainAxis === "right") left = triggerRect.right + offset;
    }

    const PADDING = 10;
    if (!matchWidth) {
      if (left + contentRect.width > viewportW - PADDING)
        left = viewportW - contentRect.width - PADDING;
      if (left < PADDING) left = PADDING;
    }

    setCoords({
      top,
      left,
      width: matchWidth ? triggerRect.width : undefined,
      transformOrigin,
    });
  }, [
    triggerRef,
    targetContent,
    isOpen,
    placement,
    offset,
    matchWidth,
    autoFlip,
  ]);

  useIsomorphicLayoutEffect(() => {
    if (!isOpen || !targetContent) return;

    calculatePosition();

    const resizeObserver = new ResizeObserver(() => calculatePosition());
    resizeObserver.observe(targetContent);

    const handleUpdate = () => requestAnimationFrame(calculatePosition);
    window.addEventListener("resize", handleUpdate);
    window.addEventListener("scroll", handleUpdate, true);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", handleUpdate);
      window.removeEventListener("scroll", handleUpdate, true);
    };
  }, [isOpen, calculatePosition, targetContent]);

  return coords;
}
