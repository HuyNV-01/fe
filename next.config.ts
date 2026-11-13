import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const rawNgrokDomain = (process.env.NEXT_PUBLIC_NGROK_DOMAIN || "")
  .trim()
  .replace(/^https?:\/\//i, "")
  .replace(/\/.*$/, "");

const backendInternalOrigin = (
  process.env.BACKEND_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:3000"
)
  .replace(/\/api\/?$/i, "")
  .replace(/\/+$/, "");

const disableApiProxy = process.env.NEXT_PUBLIC_DISABLE_API_PROXY === "true";

const nextConfig: NextConfig = {
  reactCompiler: true,
  allowedDevOrigins: [
    "localhost",
    "127.0.0.1",
    "*.ngrok-free.app",
    "*.ngrok-free.dev",
    "*.ngrok.io",
    "*.ngrok.app",
    "*.trycloudflare.com",
    ...(rawNgrokDomain ? [rawNgrokDomain] : []),
  ],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "**.ngrok-free.app",
      },
      {
        protocol: "https",
        hostname: "**.ngrok-free.dev",
      },
      {
        protocol: "https",
        hostname: "**.ngrok.io",
      },
      {
        protocol: "https",
        hostname: "**.trycloudflare.com",
      },
      {
        protocol: "http",
        hostname: "localhost",
      },
    ],
  },
  async rewrites() {
    if (disableApiProxy) {
      return [];
    }
    return [
      {
        source: "/webhooks/omnichannel/:path*",
        destination: `${backendInternalOrigin}/api/webhooks/omnichannel/:path*`,
      },
      {
        source: "/api/webhooks/omnichannel/:path*",
        destination: `${backendInternalOrigin}/api/webhooks/omnichannel/:path*`,
      },
      {
        source: "/api/:path*",
        destination: `${backendInternalOrigin}/api/:path*`,
      },
      {
        source: "/socket.io/:path*",
        destination: `${backendInternalOrigin}/socket.io/:path*`,
      },
    ];
  },
};

const withNextIntl = createNextIntlPlugin();
export default withNextIntl(nextConfig);
