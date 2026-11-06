export const SIGNED_IN_PATH = "/signed-in";
export const RETURN_PARAM = "next";

// Resolves the path the way the browser will and keeps it only if it stays on
// this site, so a crafted sign-in link can't send the user elsewhere. String
// checks miss tricks like "/\t/host", which URL parsing turns into "//host".
export function toReturnUrl(value: string | null, origin: string) {
  const home = new URL("/", origin);

  if (!value?.startsWith("/")) return home;

  try {
    const url = new URL(value, origin);

    return url.origin === home.origin ? url : home;
  } catch {
    return home;
  }
}
