import { connection } from "next/server";
import { auth } from "@/lib/auth/server";
import { parsePaletteId } from "@/lib/palette-input";
import { getOwnPalette } from "@/lib/palettes";

const headers = { "Cache-Control": "private, no-store" };

// The signed-in author's own palette, public or private. Pages render private
// palettes from this in the browser, so they never enter a shared cache.
// A route handler because reading the session can refresh its cookies.
export async function GET(
  _request: Request,
  { params }: RouteContext<"/api/palettes/[id]">,
) {
  await connection();

  const { data: session } = await auth.getSession();

  if (!session?.user) {
    return Response.json(
      { error: "Sign in to see this palette." },
      { status: 401, headers },
    );
  }

  const id = parsePaletteId((await params).id);
  const palette = id ? await getOwnPalette(id, session.user.id) : null;

  // Same reply for a missing palette and someone else's, so ids don't leak.
  if (!palette) {
    return Response.json(
      { error: "This palette doesn't exist or isn't yours." },
      { status: 404, headers },
    );
  }

  return Response.json(palette, { headers });
}
