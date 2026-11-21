import posthog from "posthog-js";
import { POSTHOG_PROXY_PATH, POSTHOG_UI_HOST } from "@/lib/posthog-hosts";

// Runs in the browser before the app starts. Without a key (development and
// previews) PostHog stays off and track() does nothing.
const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;

if (key) {
  posthog.init(key, {
    // Through this site; see the rewrites in next.config.ts.
    api_host: POSTHOG_PROXY_PATH,
    ui_host: POSTHOG_UI_HOST,
    defaults: "2026-08-30",
    // No cookies or storage: PostHog counts visitors with a hash made on its
    // servers, so there is no consent banner to show. It needs "Cookieless
    // server hash mode" on in the project's settings, or events are dropped.
    // In this mode nobody is identified, so events never carry an account.
    cookieless_mode: "always",
    capture_exceptions: true,
    // Recording sessions is a separate decision, off until it's made.
    disable_session_recording: true,
  });
}
