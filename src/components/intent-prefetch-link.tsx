"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";

// A default Link only prefetches the route's App Shell (the skeleton), shared
// by every palette. Prefetching each card's content as it scrolls into view
// would cost a server request per card, so this waits for intent: hover,
// focus or touch usually come 100–300 ms before the click, enough for a cached
// page to arrive and the navigation to land on the content itself.
export function IntentPrefetchLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
}) {
  const [hasIntent, setHasIntent] = useState(false);

  function showIntent() {
    setHasIntent(true);
  }

  return (
    <Link
      href={href}
      className={className}
      prefetch={hasIntent ? true : "auto"}
      onMouseEnter={showIntent}
      onFocus={showIntent}
      onTouchStart={showIntent}
    >
      {children}
    </Link>
  );
}
