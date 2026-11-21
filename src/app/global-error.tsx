"use client";

import posthog from "posthog-js";
import { useEffect } from "react";
import "./globals.css";

// Shown when rendering fails outside any other error boundary, in place of the
// root layout, so it brings its own <html> and <body>. React hands the error
// to this boundary instead of the window, where PostHog's exception capture
// listens, so it is sent here.
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (posthog.__loaded) posthog.captureException(error);
  }, [error]);

  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-full flex-col items-center justify-center gap-4 p-6 text-center font-sans">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-foreground/60">
          The page couldn’t load. Trying again usually helps.
        </p>
        <button
          type="button"
          className="rounded-lg bg-foreground px-3 py-1.5 text-sm font-medium text-background"
          onClick={reset}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
