import type { NextConfig } from "next";

const appHost = (() => {
  try {
    return process.env.APP_URL ? new URL(process.env.APP_URL).hostname : null;
  } catch {
    return null;
  }
})();

const allowedDevOrigins = [
  "*.run.app",
  "*.asia-southeast1.run.app",
  "localhost",
  "127.0.0.1",
  ...(appHost ? [appHost] : []),
];

const nextConfig: NextConfig = {
  allowedDevOrigins,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
