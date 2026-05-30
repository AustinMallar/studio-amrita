import type { NextConfig } from "next";

function wpHostname(): string | undefined {
  const raw = process.env.WORDPRESS_API_URL;
  if (!raw) return undefined;
  try {
    return new URL(raw).hostname;
  } catch {
    return undefined;
  }
}

const host = wpHostname();

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      ...(host
        ? [
            { protocol: "https" as const, hostname: host, pathname: "/**" },
            { protocol: "http" as const, hostname: host, pathname: "/**" },
          ]
        : []),
      { protocol: "https", hostname: "**.cdninstagram.com", pathname: "/**" },
      { protocol: "https", hostname: "**.fbcdn.net", pathname: "/**" },
    ],
  },
};

export default nextConfig;
