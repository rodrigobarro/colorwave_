import { auth } from "@/lib/auth/server";

// Sign-in returns to /create, and this proxy is what turns that return into a
// session. The page stays public: publishing is what requires a session.
export default auth.middleware({ publicRoutes: ["/create"] });

export const config = {
  matcher: ["/create"],
};
