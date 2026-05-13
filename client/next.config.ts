import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
      {
        protocol: "https",
        hostname: "xpense-tracker.s3.ap-south-1.amazonaws.com",
      },
    ],
  },
};

export default nextConfig;
