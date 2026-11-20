"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UseHardwareBarcodeScannerOptions {
  enabled?: boolean;
  maxInterKeyMs?: number;
  minLength?: number;
  onScan: (barcode: string) => void;
}

interface WebSerialPortLike {
  open: (opts: { baudRate: number }) => Promise<void>;
  close: () => Promise<void>;
  readable: ReadableStream<Uint8Array> | null;
}

export function useHardwareBarcodeScanner({
  enabled = true,
  maxInterKeyMs = 40,
  minLength = 4,
  onScan,
}: UseHardwareBarcodeScannerOptions) {
  const bufferRef = useRef<string>("");
  const lastKeyTimeRef = useRef<number>(0);
  const onScanRef = useRef(onScan);
  onScanRef.current = onScan;

  useEffect(() => {
    if (!enabled) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTextInput =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable);

      const now = performance.now();
      const delta = now - lastKeyTimeRef.current;

      if (event.key === "Enter") {
        const scanned = bufferRef.current.trim();
        bufferRef.current = "";
        lastKeyTimeRef.current = 0;

        if (scanned.length >= minLength && !isTextInput) {
          event.preventDefault();
          onScanRef.current(scanned);
        }
        return;
      }

      if (
        event.key.length === 1 &&
        !event.ctrlKey &&
        !event.metaKey &&
        !event.altKey
      ) {
        if (delta > maxInterKeyMs && bufferRef.current.length > 0) {
          bufferRef.current = "";
        }
        bufferRef.current += event.key;
        lastKeyTimeRef.current = now;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [enabled, maxInterKeyMs, minLength]);
}

/**
 * Đọc cân điện tử trực tiếp qua Web Serial API bằng TextDecoder (stream: true),
 * tránh hoàn toàn lỗi TS 5.7+ WritableStream<BufferSource> vs Uint8Array<ArrayBufferLike>.
 */
export function useElectronicScaleReader() {
  const [isConnected, setIsConnected] = useState(false);
  const [liveWeightGrams, setLiveWeightGrams] = useState<number | null>(null);
  const [scaleError, setScaleError] = useState<string | null>(null);
  const portRef = useRef<WebSerialPortLike | null>(null);
  const readerRef = useRef<ReadableStreamDefaultReader<Uint8Array> | null>(
    null,
  );

  const disconnectScale = useCallback(async () => {
    try {
      await readerRef.current?.cancel();
      readerRef.current?.releaseLock();
    } catch {}
    readerRef.current = null;

    try {
      await portRef.current?.close();
    } catch {}
    portRef.current = null;
    setIsConnected(false);
  }, []);

  const connectScale = useCallback(async () => {
    setScaleError(null);
    const nav = navigator as unknown as {
      serial?: {
        requestPort: () => Promise<WebSerialPortLike>;
      };
    };

    if (!nav.serial) {
      setScaleError(
        "Trình duyệt chưa hỗ trợ Web Serial API (khuyến nghị Chrome/Edge Desktop).",
      );
      return;
    }

    try {
      const port = await nav.serial.requestPort();
      await port.open({ baudRate: 9600 });
      portRef.current = port;
      setIsConnected(true);

      if (!port.readable) {
        setScaleError("Cổng cân điện tử không có luồng dữ liệu đọc.");
        return;
      }

      const reader = port.readable.getReader();
      readerRef.current = reader;
      const decoder = new TextDecoder("utf-8");

      let lineBuf = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        if (value) {
          lineBuf += decoder.decode(value, { stream: true });
          const lines = lineBuf.split(/\r?\n/);
          lineBuf = lines.pop() || "";
          for (const line of lines) {
            const matchKg = line.match(/(\d+(?:\.\d+)?)\s*kg/i);
            const matchG = line.match(/(\d+(?:\.\d+)?)\s*g/i);
            if (matchKg) {
              setLiveWeightGrams(Math.round(parseFloat(matchKg[1]) * 1000));
            } else if (matchG) {
              setLiveWeightGrams(Math.round(parseFloat(matchG[1])));
            }
          }
        }
      }
    } catch (err) {
      setScaleError(
        err instanceof Error ? err.message : "Không thể kết nối cân điện tử",
      );
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    return () => {
      void disconnectScale();
    };
  }, [disconnectScale]);

  return {
    isConnected,
    liveWeightGrams,
    scaleError,
    connectScale,
    disconnectScale,
  };
}

export function printThermalLabelHtml(htmlTemplate: string): void {
  if (typeof window === "undefined") return;
  const iframe = document.createElement("iframe");
  iframe.style.position = "fixed";
  iframe.style.right = "0";
  iframe.style.bottom = "0";
  iframe.style.width = "0";
  iframe.style.height = "0";
  iframe.style.border = "0";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    document.body.removeChild(iframe);
    return;
  }

  doc.open();
  doc.write(htmlTemplate);
  doc.close();

  setTimeout(() => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } finally {
      setTimeout(() => {
        if (iframe.parentNode) iframe.parentNode.removeChild(iframe);
      }, 1500);
    }
  }, 120);
}
