import type { NextConfig } from "next";
import { buildTrustedAuthOrigins } from "./lib/auth-urls";
import withBundleAnalyzer from "@next/bundle-analyzer";

const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

function hostFromUrl(value?: string) {
  if (!value || value.includes("*")) return null;
  try {
    return new URL(value).host;
  } catch {
    return null;
  }
}

function stripOrigin(u: string | undefined): string {
  return (u ?? "").trim().replace(/\/$/, "");
}

const useTunnel =
  process.env.AUTH_USE_TUNNEL === "1" ||
  process.env.AUTH_USE_TUNNEL?.trim().toLowerCase() === "true";

const resolvedNextPublicApp =
  stripOrigin(process.env.NEXT_PUBLIC_APP_URL) ||
  stripOrigin(
    useTunnel
      ? process.env.NEXT_PUBLIC_APP_TUNNEL_URL
      : process.env.NEXT_PUBLIC_APP_URL_LOCAL,
  ) ||
  "http://localhost:3000";

const resolvedNextPublicSocket =
  stripOrigin(process.env.NEXT_PUBLIC_SOCKET_URL) ||
  stripOrigin(
    useTunnel
      ? process.env.NEXT_PUBLIC_SOCKET_TUNNEL_URL
      : process.env.NEXT_PUBLIC_SOCKET_URL_LOCAL,
  ) ||
  (process.env.NODE_ENV !== "production" && !useTunnel ? "http://localhost:4001" : "");

const allowedDevOrigins = Array.from(
  new Set(
    buildTrustedAuthOrigins()
      .map((origin) => hostFromUrl(origin))
      .filter((v): v is string => Boolean(v)),
  ),
);

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.gravatar.com',
      },
      {
        protocol: 'https',
        hostname: '**.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'i.ytimg.com',
      },
      {
        protocol: 'https',
        hostname: 'avatar.githubusercontent.com',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_APP_URL: resolvedNextPublicApp,
    ...(resolvedNextPublicSocket
      ? { NEXT_PUBLIC_SOCKET_URL: resolvedNextPublicSocket }
      : {}),
  },
  serverExternalPackages: ["better-auth"],
  ...(allowedDevOrigins.length > 0 ? { allowedDevOrigins } : {}),

  async redirects() {
    return [{ source: "/home", destination: "/dashboard", permanent: true }];
  },
};

export default bundleAnalyzer(nextConfig);

// — next.config.ts: Next.js config — better-auth as server external, optional allowedDevOrigins, /home → /dashboard.

