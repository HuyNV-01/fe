"use client";

import React, {
  useRef,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from "react";
import { cn } from "@/lib/utils";
import { BaseTooltip } from "@/components/tooltip/base-tooltip";

type TruncateElementType =
  | "span"
  | "p"
  | "div"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6";

export interface TruncatedTextProps
  extends React.HTMLAttributes<HTMLElement> {
  /** Chuỗi văn bản truyền trực tiếp (tương thích ngược với các màn hình cũ) */
  text?: string | null;
  /** Nội dung bọc bên trong <TruncatedText>...</TruncatedText> */
  children?: ReactNode;
  /** Nội dung tùy chỉnh hiển thị trong Tooltip (mặc định tự lấy từ text hoặc children) */
  tooltipContent?: ReactNode;
  /** Thẻ HTML sử dụng để render (mặc định: "span") */
  as?: TruncateElementType;
  /** Số dòng hiển thị tối đa trước khi cắt "..." (1 = truncate 1 dòng, 2..4 = line-clamp) */
  lines?: 1 | 2 | 3 | 4;
  /** Vị trí hiển thị Tooltip */
  side?: "top" | "right" | "bottom" | "left";
  /** Căn chỉnh Tooltip */
  align?: "start" | "center" | "end";
  /** Thời gian trễ mở Tooltip (ms) */
  delayDuration?: number;
  /** Nếu false: luôn hiển thị Tooltip kể cả khi text ngắn chưa bị cắt. Mặc định: true (chỉ hiện khi thực sự bị tràn) */
  onlyWhenTruncated?: boolean;
  /** Class tùy chỉnh cho khung TooltipContent */
  tooltipClassName?: string;
}

function extractTextFromNode(node: ReactNode): string {
  if (node === null || node === undefined || typeof node === "boolean") {
    return "";
  }
  if (typeof node === "string" || typeof node === "number") {
    return String(node);
  }
  if (Array.isArray(node)) {
    return node.map(extractTextFromNode).join("");
  }
  if (React.isValidElement<{ children?: ReactNode }>(node)) {
    return extractTextFromNode(node.props.children);
  }
  return "";
}

export function TruncatedText({
  text,
  children,
  tooltipContent,
  as: Component = "span",
  lines = 1,
  side = "top",
  align = "start",
  delayDuration = 250,
  onlyWhenTruncated = true,
  className,
  tooltipClassName,
  onMouseEnter,
  ...props
}: TruncatedTextProps) {
  const elementRef = useRef<HTMLElement | null>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);

  const displayContent = children !== undefined ? children : text;
  const resolvedTooltipContent =
    tooltipContent !== undefined
      ? tooltipContent
      : text || extractTextFromNode(children);

  const checkOverflow = useCallback(() => {
    const el = elementRef.current;
    if (!el) return;
    if (lines === 1) {
      setIsOverflowing(el.scrollWidth > el.clientWidth + 1);
    } else {
      setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
    }
  }, [lines]);

  useEffect(() => {
    checkOverflow();
    const el = elementRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;

    const observer = new ResizeObserver(() => {
      checkOverflow();
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [checkOverflow, displayContent]);

  const clampClass =
    lines === 2
      ? "line-clamp-2 break-words [overflow-wrap:anywhere]"
      : lines === 3
        ? "line-clamp-3 break-words [overflow-wrap:anywhere]"
        : lines === 4
          ? "line-clamp-4 break-words [overflow-wrap:anywhere]"
          : "block truncate";

  const shouldDisableTooltip =
    !resolvedTooltipContent || (onlyWhenTruncated && !isOverflowing);

  return (
    <BaseTooltip
      delayDuration={delayDuration}
      side={side}
      align={align}
      disabled={shouldDisableTooltip}
      content={resolvedTooltipContent}
      className={cn(
        "max-w-xs sm:max-w-sm break-words [overflow-wrap:anywhere] z-90",
        tooltipClassName,
      )}
    >
      <Component
        ref={elementRef as any}
        onMouseEnter={(e) => {
          checkOverflow();
          onMouseEnter?.(e as any);
        }}
        className={cn("min-w-0 max-w-full", clampClass, className)}
        {...props}
      >
        {displayContent}
      </Component>
    </BaseTooltip>
  );
}

export { TruncatedText as Truncate };
export default TruncatedText;