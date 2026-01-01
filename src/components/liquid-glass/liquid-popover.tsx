/** biome-ignore-all lint/correctness/useExhaustiveDependencies: <explanation> */
"use client";

import React, {
  createContext,
  useContext,
  useRef,
  useState,
  useEffect,
  type ReactNode,
  type RefObject,
  cloneElement,
  isValidElement,
  useCallback,
} from "react";
import { cn } from "@/lib/utils";
import {
  type GlassPlacement,
  useGlassPosition,
} from "@/utils/hooks/use-glass-position";
import { createPortal } from "react-dom";

// --- Utils ---
function mergeRefs<T = any>(
  refs: Array<
    React.MutableRefObject<T> | React.LegacyRef<T> | undefined | null
  >,
): React.RefCallback<T> {
  return (value) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref != null) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
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
  matchWidth: boolean;
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
  matchWidth = true,
  autoFlip = true,
  closeOnClickOutside = true,
  className,
}: LiquidPopoverProps) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(defaultOpen);
  const triggerRef = useRef<HTMLElement | null>(null);
  const contentRef = useRef<HTMLElement | null>(null);

  const isOpen = controlledOpen ?? uncontrolledOpen;

  const setIsOpen = (value: boolean) => {
    if (onOpenChange) onOpenChange(value);
    else setUncontrolledOpen(value);
  };

  useEffect(() => {
    if (!isOpen || !closeOnClickOutside) return;

    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      const isTrigger = triggerRef.current?.contains(target);
      const isContent = contentRef.current?.contains(target);

      if (!isTrigger && !isContent) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, closeOnClickOutside]);

  return (
    <AnchorContext.Provider
      value={{
        triggerRef,
        contentRef,
        isOpen,
        setIsOpen,
        placement,
        offset,
        matchWidth,
        autoFlip,
        closeOnClickOutside,
      }}
    >
      <div className={cn("relative w-full inline-block", className)}>
        {children}
      </div>
    </AnchorContext.Provider>
  );
};

// ==========================================
// 3. TRIGGER COMPONENT (Smart Input Handling)
// ==========================================

interface LiquidPopoverTriggerProps extends React.HTMLAttributes<HTMLElement> {
  asChild?: boolean;
}

export const LiquidPopoverTrigger = React.forwardRef<
  HTMLElement,
  LiquidPopoverTriggerProps
>(
  (
    { children, className, asChild = false, onClick, onKeyDown, ...props },
    ref,
  ) => {
    const context = useContext(AnchorContext);
    if (!context)
      throw new Error("LiquidPopoverTrigger must be used within LiquidPopover");

    const handleSmartToggle = (e: React.MouseEvent | React.KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
        if (!context.isOpen) context.setIsOpen(true);
        return;
      }

      context.setIsOpen(!context.isOpen);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        const target = e.target as HTMLElement;
        if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") {
          return;
        }

        e.preventDefault();
        handleSmartToggle(e);
      }

      if (onKeyDown) {
        onKeyDown(e as any);
      }
    };

    const mergedRef = mergeRefs([context.triggerRef, ref]);

    if (asChild && isValidElement(children)) {
      return cloneElement(
        children as React.ReactElement,
        {
          ref: mergedRef,
          onClick: (e: React.MouseEvent) => {
            (children.props as any).onClick?.(e);
            onClick?.(e as any);
            if (!e.defaultPrevented) handleSmartToggle(e);
          },
          onKeyDown: (e: React.KeyboardEvent) => {
            (children.props as any).onKeyDown?.(e);
            handleKeyDown(e);
          },
          className: cn((children.props as any).className, className),
          ...props,
        } as any,
      );
    }

    return (
      <button
        ref={mergedRef as React.Ref<HTMLButtonElement>}
        type="button"
        className={cn(
          "w-full bg-transparent border-none p-0 m-0 text-left cursor-pointer outline-none",
          "focus-visible:ring-2 focus-visible:ring-primary/20 rounded-sm",
          className,
        )}
        onClick={(e) => {
          onClick?.(e as any);
          handleSmartToggle(e);
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
// 4. CONTENT COMPONENT (Style Injection)
// ==========================================

interface LiquidPopoverContentProps
  extends React.HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  portal?: boolean;
  forceMount?: boolean;
}

export const LiquidPopoverContent = ({
  children,
  className,
  style,
  portal = true,
  forceMount = false,
  ...props
}: LiquidPopoverContentProps) => {
  const context = useContext(AnchorContext);
  const [contentElement, setContentElement] = useState<HTMLElement | null>(
    null,
  );

  const measuredRef = useCallback(
    (node: HTMLElement | null) => {
      setContentElement(node);
      if (context?.contentRef) {
        (
          context.contentRef as React.MutableRefObject<HTMLElement | null>
        ).current = node;
      }
    },
    [context?.contentRef],
  );

  if (!context)
    throw new Error("LiquidPopoverContent must be used within LiquidPopover");

  const { isOpen, triggerRef, placement, offset, matchWidth, autoFlip } =
    context;

  const coords = useGlassPosition({
    triggerRef,
    contentElement,
    isOpen,
    placement,
    offset,
    matchWidth,
    autoFlip,
  });

  if (!isOpen && !forceMount) return null;

  const isMeasuring = !coords;

  const wrapperStyle: React.CSSProperties = coords
    ? {
        position: "fixed",
        top: coords.top,
        left: coords.left,
        width: context.matchWidth ? coords.width : undefined,
        zIndex: 9999,
        display: "flex",
        flexDirection: "column",
        transition: "none",
        ...style,
      }
    : {
        position: "fixed",
        top: 0,
        left: 0,
        opacity: 0,
        pointerEvents: "none",
        visibility: "hidden",
        ...style,
      };

  const injectedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      const element = child as React.ReactElement<any>;

      const mergedRef = mergeRefs([measuredRef, (element as any).ref]);

      return React.cloneElement(element, {
        ref: mergedRef,
        portal: false,
        style: {
          ...element.props.style,
          width: "100%",
          height: "100%",
        },
        className: cn(
          "outline-none",
          !isMeasuring && isOpen
            ? "animate-in fade-in zoom-in-95 duration-200"
            : "",
          !isMeasuring && !isOpen
            ? "animate-out fade-out zoom-out-95 duration-150"
            : "",
          coords ? `origin-${getTransformOrigin(coords.transformOrigin)}` : "",
          element.props.className,
        ),
        ...props,
      });
    }
    return child;
  });

  const content = (
    <div
      style={wrapperStyle}
      className={cn("liquid-anchor-content", className)}
    >
      {injectedChildren}
    </div>
  );

  if (portal) {
    return createPortal(content, document.body);
  }

  return content;
};

function getTransformOrigin(cssOrigin: string): string {
  if (cssOrigin.includes("bottom")) return "top";
  if (cssOrigin.includes("top")) return "bottom";
  return "center";
}
