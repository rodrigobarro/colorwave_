"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, type ComponentType } from "react";
import type { Scheme } from "@/lib/color-roles";

// The light or dark scheme a page shows its palette in. It lives in the URL
// (?scheme=dark), so the previews and the theme on the same page always agree
// and a link opens the scheme being looked at. With no ?scheme=, each palette
// shows the scheme it reads as.

export type RequestedScheme = { requestedScheme: Scheme | null };

function isScheme(value: string | null): value is Scheme {
  return value === "light" || value === "dark";
}

// Next keeps useSearchParams in step with replaceState, so every component
// reading the scheme follows at once.
export function chooseScheme(next: Scheme, natural: Scheme) {
  const url = new URL(window.location.href);

  if (next === natural) url.searchParams.delete("scheme");
  else url.searchParams.set("scheme", next);
  window.history.replaceState(null, "", url);
}

// A cached page can't read the URL, so it renders with the palette's own
// scheme until the browser takes over.
export function withRequestedScheme<P extends object>(
  Component: ComponentType<P & RequestedScheme>,
) {
  function FromUrl(props: P) {
    const scheme = useSearchParams().get("scheme");

    return <Component {...props} requestedScheme={isScheme(scheme) ? scheme : null} />;
  }

  return function WithRequestedScheme(props: P) {
    return (
      <Suspense fallback={<Component {...props} requestedScheme={null} />}>
        <FromUrl {...props} />
      </Suspense>
    );
  };
}

export function SchemeToggle({
  scheme,
  natural,
  className = "",
}: {
  scheme: Scheme;
  natural: Scheme;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Color scheme"
      className={`flex rounded-lg p-0.5 ring-1 ring-foreground/15 ${className}`}
    >
      {(["light", "dark"] as const).map((option) => (
        <button
          key={option}
          type="button"
          aria-pressed={scheme === option}
          className="rounded-md px-3 py-1 text-sm capitalize aria-pressed:bg-foreground aria-pressed:text-background"
          onClick={() => chooseScheme(option, natural)}
        >
          {option}
        </button>
      ))}
    </div>
  );
}
