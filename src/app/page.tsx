export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-6 font-sans">
      <h1 className="text-4xl font-semibold tracking-tight">Colorwave</h1>
      <div className="h-3 w-full max-w-md rounded-full bg-linear-to-r/oklch from-[oklch(0.7_0.2_30)] to-[oklch(0.7_0.2_260)]" />
      <p className="text-lg text-foreground/70">Em construção.</p>
    </main>
  );
}
