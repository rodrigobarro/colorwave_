"use client";

import Link from "next/link";
import { SignInButton } from "@/components/sign-in-dialog";
import { authClient } from "@/lib/auth/client";

const linkClassName = "rounded-lg px-3 py-1.5 ring-1 ring-foreground/15";

export function AccountMenu() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return null;

  if (!session) {
    return <SignInButton className={`text-sm ${linkClassName}`} />;
  }

  return (
    <nav aria-label="Account" className="flex items-center gap-3 text-sm">
      <span className="text-foreground/60">{session.user.name}</span>
      <Link href="/me" className={linkClassName}>
        My palettes
      </Link>
      <button
        type="button"
        className="underline"
        onClick={() => authClient.signOut()}
      >
        Sign out
      </button>
    </nav>
  );
}
