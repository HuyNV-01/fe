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
}

const findDefaultBoundary = (node: HTMLElement | null): HTMLElement => {
  if (!node || node === document.body || node === document.documentElement) {
    return document.body;
  }
  if (node.hasAttribute("data-radix-scroll-area-viewport")) {
    return node;
  }
  const style = window.getComputedStyle(node);
  const isClipping = ["auto", "scroll", "hidden", "overlay"].some(
    (val) => style.overflowY.includes(val) || style.overflowX.includes(val),
  );
  if (isClipping && node.scrollHeight >= node.clientHeight) {
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
  zIndex = 50,
  portalContainer,
  boundaryElement,
  overflowPadding = 0,
}: LiquidGlassAnchorProps) => {
  const anchorRef = useRef<HTMLDivElement>(null);
  const clipperRef = useRef<HTMLDivElement>(null);
  const moverRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useIsomorphicLayoutEffect(() => {
    if (!mounted || !anchorRef.current) return;

    let rAF: number;
    const observerRef = { current: null as IntersectionObserver | null };

    const syncPosition = () => {
      const anchor = anchorRef.current;
      const clipper = clipperRef.current;
      const mover = moverRef.current;

      if (!anchor || !clipper || !mover) return;

      let boundary: HTMLElement;

      if (boundaryElement) {
        boundary = boundaryElement;
      } else {
        const parentGlass = anchor.closest(
          ".liquid-glass-clipper",
        ) as HTMLElement;
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
        rAF = requestAnimationFrame(syncPosition);
        return;
      }

      const anchorRect = anchor.getBoundingClientRect();
      let boundaryRect:
        | DOMRect
        | { top: number; left: number; bottom: number; right: number };

      if (boundary === document.body) {
        boundaryRect = {
          top: 0,
          left: 0,
          right: window.innerWidth,
          bottom: window.innerHeight,
        };
      } else {
        boundaryRect = boundary.getBoundingClientRect();
      }

      const isParentGlass = boundary.classList.contains("liquid-glass-clipper");
      const padding =
        boundary === document.body || isParentGlass ? 0 : overflowPadding;

      const clipTop = Math.max(0, boundaryRect.top - padding);
      const clipBottom = Math.min(
        window.innerHeight,
        boundaryRect.bottom + padding,
      );
      const clipLeft = Math.max(0, boundaryRect.left - padding);
      const clipRight = Math.min(
        window.innerWidth,
        boundaryRect.right + padding,
      );

      const clipWidth = Math.max(0, clipRight - clipLeft);
      const clipHeight = Math.max(0, clipBottom - clipTop);

      clipper.style.transform = `translate3d(${clipLeft}px, ${clipTop}px, 0)`;
      clipper.style.width = `${clipWidth}px`;
      clipper.style.height = `${clipHeight}px`;

      const relativeTop = anchorRect.top - clipTop;
      const relativeLeft = anchorRect.left - clipLeft;

      mover.style.transform = `translate3d(${relativeLeft}px, ${relativeTop}px, 0)`;
      mover.style.width = `${anchorRect.width}px`;
      mover.style.height = `${anchorRect.height}px`;

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

      rAF = requestAnimationFrame(syncPosition);
    };

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          syncPosition();
        } else {
          cancelAnimationFrame(rAF);
          if (clipperRef.current) clipperRef.current.style.opacity = "0";
        }
      },
      { rootMargin: "500px" },
    );

    observerRef.current.observe(anchorRef.current);

    return () => {
      cancelAnimationFrame(rAF);
      observerRef.current?.disconnect();
    };
  }, [mounted, children, boundaryElement, overflowPadding]);

  useEffect(() => {
    if (!mounted || !moverRef.current) return;
    const mover = moverRef.current;

    const handleWheel = (e: WheelEvent) => {
      let scrollTarget: HTMLElement | null = null;

      const currentBoundary = anchorRef.current?.closest(
        ".liquid-glass-clipper",
      ) as HTMLElement;

      if (currentBoundary) {
        scrollTarget = findDefaultBoundary(
          anchorRef.current?.parentElement || null,
        );
      } else {
        scrollTarget = findDefaultBoundary(
          anchorRef.current?.parentElement || null,
        );
      }

      if (scrollTarget && scrollTarget !== document.body) {
        scrollTarget.scrollTop += e.deltaY;
        scrollTarget.scrollLeft += e.deltaX;
      }
    };
    mover.addEventListener("wheel", handleWheel, { passive: false });
    return () => mover.removeEventListener("wheel", handleWheel);
  }, [mounted]);

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
