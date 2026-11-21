import type { Instrumentation } from "next";
import { POSTHOG_HOST } from "@/lib/posthog-hosts";

// Server errors (rendering, route handlers, server actions) go to PostHog's
// error tracking. Only where the key is set, as in the browser.
export const onRequestError: Instrumentation.onRequestError = async (
  error,
  request,
  context,
) => {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

  // posthog-node needs Node's APIs, and the proxy may run on the edge.
  if (!key || process.env.NEXT_RUNTIME !== "nodejs") return;

  const { PostHog } = await import("posthog-node");
  // A client per error, sent before the function can be frozen: errors are
  // rare, and a shared client would hold them in a queue.
  const client = new PostHog(key, {
    host: POSTHOG_HOST,
    flushAt: 1,
    flushInterval: 0,
  });

  try {
    await client.captureExceptionImmediate(error, undefined, {
      // The path without its query string, which could hold anything.
      $current_url: request.path.split("?")[0],
      method: request.method,
      router_kind: context.routerKind,
      route_path: context.routePath,
      route_type: context.routeType,
      render_source: context.renderSource,
    });
  } finally {
    await client.shutdown();
  }
};
