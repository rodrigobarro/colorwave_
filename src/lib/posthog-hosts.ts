// The Colorwave project lives in PostHog's US region. Kept apart from the SDKs
// so next.config.ts and the server can read it without loading either.

// Where events go.
export const POSTHOG_HOST = "https://us.i.posthog.com";
// Where the browser SDK's extra scripts come from.
export const POSTHOG_ASSETS_HOST = "https://us-assets.i.posthog.com";
// PostHog's own app, for links back to it.
export const POSTHOG_UI_HOST = "https://us.posthog.com";
// This site's path that forwards to them, so ad blockers that block PostHog's
// domains don't drop the events.
export const POSTHOG_PROXY_PATH = "/ingest";
