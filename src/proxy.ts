import { auth } from "@/lib/auth/server";

// Sign-in returns to /signed-in, and this proxy is what turns that return
// into a session. Running it only there keeps every other page off the proxy.
export default auth.middleware({ publicRoutes: ["/signed-in"] });

export const config = {
  matcher: ["/signed-in"],
};
