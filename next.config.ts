import type { NextConfig } from "next";
import {
  POSTHOG_ASSETS_HOST,
  POSTHOG_HOST,
  POSTHOG_PROXY_PATH,
} from "./src/lib/posthog-hosts";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // PostHog's paths end in a slash, which Next would otherwise redirect away.
  // The redirect below puts it back for every other path, so each page keeps
  // a single URL.
  skipTrailingSlashRedirect: true,
  async redirects() {
    return [
      {
        source: `/:path((?!${POSTHOG_PROXY_PATH.slice(1)}/).+)/`,
        destination: "/:path",
        permanent: true,
      },
    ];
  },
  // Analytics go through this site to PostHog; the asset paths come first, as
  // the last rule catches everything else.
  async rewrites() {
    return [
      {
        source: `${POSTHOG_PROXY_PATH}/static/:path*`,
        destination: `${POSTHOG_ASSETS_HOST}/static/:path*`,
      },
      {
        source: `${POSTHOG_PROXY_PATH}/array/:path*`,
        destination: `${POSTHOG_ASSETS_HOST}/array/:path*`,
      },
      {
        source: `${POSTHOG_PROXY_PATH}/:path*`,
        destination: `${POSTHOG_HOST}/:path*`,
      },
    ];
  },
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
