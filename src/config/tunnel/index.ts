export type TunnelProviderType =
  | "NONE"
  | "NGROK"
  | "CLOUDFLARE_TUNNEL"
  | "CUSTOM_DOMAIN";

export const TUNNEL_REQUEST_HEADERS: Record<string, string> = {
  "ngrok-skip-browser-warning": "true",
};

/**
 * Chuẩn hóa tên miền hoặc URL bất kỳ về Origin chuẩn (VD: `my-app.ngrok-free.app` -> `https://my-app.ngrok-free.app`)
 */
export function normalizeTunnelOrigin(rawInput?: string | null): string | null {
  if (!rawInput) return null;
  const trimmed = rawInput.trim();
  if (!trimmed) return null;

  let candidate = trimmed;
  if (!/^https?:\/\//i.test(candidate)) {
    const isLocal =
      candidate.startsWith("localhost") ||
      candidate.startsWith("127.0.0.1") ||
      candidate.startsWith("0.0.0.0");
    candidate = `${isLocal ? "http" : "https"}://${candidate}`;
  }

  try {
    const parsed = new URL(candidate);
    const cleanPath = parsed.pathname
      .replace(/\/api\/?$/i, "")
      .replace(/\/+$/, "");
    return `${parsed.origin}${cleanPath}`;
  } catch {
    return null;
  }
}

export function isLocalhostHostname(hostname?: string | null): boolean {
  if (!hostname) return true;
  const lower = hostname.toLowerCase();
  return (
    lower === "localhost" ||
    lower === "127.0.0.1" ||
    lower === "0.0.0.0" ||
    lower === "::1"
  );
}

export function resolveFrontendApiBaseUrl(): string {
  const explicitPublicApi = process.env.NEXT_PUBLIC_PUBLIC_API_URL?.trim();
  if (explicitPublicApi) {
    const norm = normalizeTunnelOrigin(explicitPublicApi);
    if (norm) return `${norm}/api`;
  }

  const ngrokDomain = process.env.NEXT_PUBLIC_NGROK_DOMAIN?.trim();
  if (ngrokDomain) {
    const norm = normalizeTunnelOrigin(ngrokDomain);
    if (norm) return `${norm}/api`;
  }

  const defaultApiUrl = (
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api"
  ).replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    const browserHost = window.location.hostname;
    const isBrowserOnPublicDomain = !isLocalhostHostname(browserHost);
    const isDefaultApiLocalhost =
      defaultApiUrl.includes("localhost") ||
      defaultApiUrl.includes("127.0.0.1");

    if (isBrowserOnPublicDomain && isDefaultApiLocalhost) {
      return `${window.location.origin}/api`;
    }
  }

  return defaultApiUrl.endsWith("/api")
    ? defaultApiUrl
    : `${defaultApiUrl}/api`;
}

/**
 * Phân giải địa chỉ máy chủ WebSocket (`BASE_URL` cho Socket.IO) tương thích với cả Localhost và Ngrok/Tunnel.
 */
export function resolveFrontendSocketBaseUrl(): string {
  const explicitPublicSocket =
    process.env.NEXT_PUBLIC_PUBLIC_SOCKET_URL?.trim();
  if (explicitPublicSocket) {
    return (
      normalizeTunnelOrigin(explicitPublicSocket) ||
      explicitPublicSocket.replace(/\/+$/, "")
    );
  }

  const ngrokDomain = process.env.NEXT_PUBLIC_NGROK_DOMAIN?.trim();
  if (ngrokDomain) {
    const norm = normalizeTunnelOrigin(ngrokDomain);
    if (norm) return norm;
  }

  const defaultSocketUrl = (
    process.env.NEXT_PUBLIC_SOCKET_URL ||
    process.env.NEXT_PUBLIC_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:3000"
  ).replace(/\/+$/, "");

  if (typeof window !== "undefined") {
    const browserHost = window.location.hostname;
    const isBrowserOnPublicDomain = !isLocalhostHostname(browserHost);
    const isDefaultSocketLocalhost =
      defaultSocketUrl.includes("localhost") ||
      defaultSocketUrl.includes("127.0.0.1");

    if (isBrowserOnPublicDomain && isDefaultSocketLocalhost) {
      return window.location.origin;
    }
  }

  return defaultSocketUrl;
}
