"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface LiquidGlassPortalProps {
  children: React.ReactNode;
  container?: HTMLElement | null;
}

export const LiquidGlassPortal = ({
  children,
  container,
}: LiquidGlassPortalProps) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!mounted) return null;

  const target = container || document.body;

  return createPortal(children, target);
};
