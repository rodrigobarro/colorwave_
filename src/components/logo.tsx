import Link from "next/link";

export function Logo() {
  return (
    <header className="flex flex-col items-center gap-3 px-6 py-12">
      <Link href="/">
        <h1 className="text-4xl font-semibold tracking-tight">Colorwave</h1>
      </Link>
      <div className="h-1.5 w-48 rounded-full bg-linear-to-r/oklch from-[oklch(0.7_0.2_30)] to-[oklch(0.7_0.2_260)]" />
    </header>
  );
}
