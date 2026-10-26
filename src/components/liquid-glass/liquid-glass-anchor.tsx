"use client";

import React, {
  useRef,
  useState,
  useEffect,
  useLayoutEffect,
  type ReactNode,
  type CSSProperties,
} from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

const useIsomorphicLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

export interface LiquidGlassAnchorProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  contentClassName?: string;
  contentStyle?: CSSProperties;
  zIndex?: number;
  portalContainer?: HTMLElement | null;
  boundaryElement?: HTMLElement | null;
  overflowPadding?: number;
  /** Disable portal rendering and render inline (avoids nested clipper conflicts) */
  disabled?: boolean;
}

const findDefaultBoundary = (node: HTMLElement | null): HTMLElement => {
  if (!node || node === document.body || node === document.documentElement) {
    return document.body;
  }
  if (
    node.hasAttribute("data-radix-scroll-area-viewport") ||
    (node.hasAttribute("data-slot") &&
      node.getAttribute("data-slot") === "scroll-area-viewport")
  ) {
    return node;
  }
  const style = window.getComputedStyle(node);
  const isClipping = ["auto", "scroll", "hidden", "overlay"].some(
    (val) => style.overflowY.includes(val) || style.overflowX.includes(val),
  );
  if (
    isClipping &&
    node.scrollHeight >= node.clientHeight &&
    node.clientHeight > 0
  ) {
    return node;
  }
  return findDefaultBoundary(node.parentElement);
};

export const LiquidGlassAnchor = ({
  children,
  className,
  style,
  contentClassName,
  contentStyle,
  zIndex = 20,
  portalContainer,
  boundaryElement,
  overflowPadding = 0,
  disabled = false,
}: LiquidGlassAnchorProps) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const clipperRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (disabled || !mounted || !anchorRef.current) return;

    let rAF: number | null = null;
    let isVisible = true;

    const syncPosition = () => {
      rAF = null;
      const anchor = anchorRef.current;
      const clipper = clipperRef.current;
      const mover = moverRef.current;

      if (!anchor || !clipper || !mover || !isVisible) return;

      let boundary: HTMLElement;

      if (boundaryElement) {
        boundary = boundaryElement;
      } else {
        const parentGlass = anchor.closest(
          ".liquid-glass-clipper",
        ) as HTMLElement | null;
        if (parentGlass) {
          boundary = parentGlass;
        } else {
          boundary = findDefaultBoundary(anchor.parentElement);
        }
      }

      const boundaryStyle = window.getComputedStyle(boundary);
      if (
        boundaryStyle.opacity === "0" ||
        boundaryStyle.display === "none" ||
        boundaryStyle.visibility === "hidden"
      ) {
        clipper.style.opacity = "0";
        clipper.style.pointerEvents = "none";
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let boundaryRect: {
        top: number;
        left: number;
        bottom: number;
        right: number;
      };

      if (boundary === document.body) {
        boundaryRect = {
          top: 0,
          left: 0,
          right: vw,
          bottom: vh,
        };
      } else {
        const rect = boundary.getBoundingClientRect();
        boundaryRect = {
          top: rect.top,
          left: rect.left,
          right: rect.right,
          bottom: rect.bottom,
        };
      }

      const isParentGlass = boundary.classList.contains("liquid-glass-clipper");
      const padding =
        boundary === document.body || isParentGlass ? 0 : overflowPadding;

      const clipTop = Math.max(0, boundaryRect.top - padding);
      const clipBottom = Math.min(vh, boundaryRect.bottom + padding);
      const clipLeft = Math.max(0, boundaryRect.left - padding);
      const clipRight = Math.min(vw, boundaryRect.right + padding);

      const clipWidth = Math.max(0, clipRight - clipLeft);
      const clipHeight = Math.max(0, clipBottom - clipTop);

      clipper.style.transform = `translate3d(${Math.round(clipLeft)}px, ${Math.round(clipTop)}px, 0)`;
      clipper.style.width = `${Math.round(clipWidth)}px`;
      clipper.style.height = `${Math.round(clipHeight)}px`;

      const relativeTop = anchorRect.top - clipTop;
      const relativeLeft = anchorRect.left - clipLeft;

      mover.style.transform = `translate3d(${Math.round(relativeLeft)}px, ${Math.round(relativeTop)}px, 0)`;
      mover.style.width = `${Math.round(anchorRect.width)}px`;
      mover.style.height = `${Math.round(anchorRect.height)}px`;

      const isOutsideVertical =
        anchorRect.bottom < clipTop || anchorRect.top > clipBottom;
      const isOutsideHorizontal =
        anchorRect.right < clipLeft || anchorRect.left > clipRight;

      if (
        isOutsideVertical ||
        isOutsideHorizontal ||
        clipWidth <= 0 ||
        clipHeight <= 0
      ) {
        clipper.style.opacity = "0";
        clipper.style.pointerEvents = "none";
      } else {
        clipper.style.opacity = "";
      }
    };

    const scheduleSync = () => {
      if (rAF === null && isVisible) {
        rAF = requestAnimationFrame(syncPosition);
      }
    };

    const intersectionObserver = new IntersectionObserver(
      ([entry]) => {
        isVisible = entry.isIntersecting;
        if (isVisible) {
          scheduleSync();
        } else {
          if (rAF !== null) {
            cancelAnimationFrame(rAF);
            rAF = null;
          }
          if (clipperRef.current) {
            clipperRef.current.style.opacity = "0";
            clipperRef.current.style.pointerEvents = "none";
          }
        }
      },
      { rootMargin: "350px" },
    );

    intersectionObserver.observe(anchorRef.current);

    const resizeObserver = new ResizeObserver(() => {
      scheduleSync();
    });
    resizeObserver.observe(anchorRef.current);

    syncPosition();

    window.addEventListener("scroll", scheduleSync, {
      capture: true,
      passive: true,
    });
    window.addEventListener("resize", scheduleSync, { passive: true });
    window.visualViewport?.addEventListener("resize", scheduleSync, {
      passive: true,
    });

    return () => {
      if (rAF !== null) cancelAnimationFrame(rAF);
      intersectionObserver.disconnect();
      resizeObserver.disconnect();
      window.removeEventListener("scroll", scheduleSync, true);
      window.removeEventListener("resize", scheduleSync);
      window.visualViewport?.removeEventListener("resize", scheduleSync);
    };
  }, [mounted, disabled, boundaryElement, overflowPadding]);

  useEffect(() => {
    if (disabled || !mounted || !moverRef.current) return;
    const mover = moverRef.current;

    const handleWheel = (e: WheelEvent) => {
      const scrollTarget = findDefaultBoundary(
        anchorRef.current?.parentElement || null,
      );

      if (scrollTarget && scrollTarget !== document.body) {
        scrollTarget.scrollTop += e.deltaY;
        scrollTarget.scrollLeft += e.deltaX;
      }
    };
    mover.addEventListener("wheel", handleWheel, { passive: true });
    return () => mover.removeEventListener("wheel", handleWheel);
  }, [mounted, disabled]);

  if (disabled) {
    return (
      <div className={cn("relative w-full", className)} style={style}>
        {children}
      </div>
    );
  }

  if (!mounted) {
    return (
      <div
        ref={anchorRef}
        className={cn(
          "relative w-full opacity-0 pointer-events-none",
          className,
        )}
        style={style}
      >
        {children}
      </div>
    );
  }

  const target = portalContainer || document.body;

  return (
    <>
      <div
        ref={anchorRef}
        className={cn("relative w-full", className)}
        style={{ ...style, visibility: "hidden" }}
        aria-hidden="true"
      >
        {children}
      </div>
      {createPortal(
        <div
          ref={clipperRef}
          className="fixed top-0 left-0 overflow-hidden pointer-events-none transition-none will-change-transform liquid-glass-clipper"
          style={{ zIndex, transform: "translate3d(-9999px, -9999px, 0)" }}
        >
          <div
            ref={moverRef}
            className={cn(
              "absolute top-0 left-0 transition-none will-change-transform pointer-events-auto",
              contentClassName,
            )}
            style={{
              ...contentStyle,
              overflow: "visible",
              boxSizing: "border-box",
            }}
          >
            {children}
          </div>
        </div>,
        target,
      )}
    </>
  );
};
