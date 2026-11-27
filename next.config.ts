import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    agentFeedback: true,
    /* Six 10 MB originals plus multipart overhead travel through the proxy
       and the action; they are converted to small WebP files before storage. */
    proxyClientMaxBodySize: "70mb",
    serverActions: {
      bodySizeLimit: "70mb",
    },
  },
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
