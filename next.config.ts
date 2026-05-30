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
    remotePatterns: host
      ? [
          { protocol: "https", hostname: host, pathname: "/**" },
          { protocol: "http", hostname: host, pathname: "/**" },
        ]
      : [],
  },
};

export default nextConfig;
