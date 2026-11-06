import type { NextRequest } from "next/server";
import { RETURN_PARAM, toReturnUrl } from "@/lib/return-path";

// Sign-in returns here. The proxy turns the return into a session first, then
// this sends the user back to the page they signed in from.
export function GET(request: NextRequest) {
  const { searchParams, origin } = request.nextUrl;

  return Response.redirect(toReturnUrl(searchParams.get(RETURN_PARAM), origin));
}
