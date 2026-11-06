import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { getPalettesByAuthor } from "@/lib/palettes";

// A route handler rather than a Server Component: reading the session can
// refresh its cookies, and only handlers and actions may set cookies.
export async function GET() {
  // Marks the handler as per-request up front, so the build doesn't try to
  // prerender it and trip over the session cookies.
  await connection();

  const { data: session } = await auth.getSession();
  const headers = { "Cache-Control": "private, no-store" };

  if (!session?.user) {
    return Response.json(
      { error: "Sign in to see your palettes." },
      { status: 401, headers },
    );
  }

  return Response.json(await getPalettesByAuthor(session.user.id), {
    headers,
  });
}
