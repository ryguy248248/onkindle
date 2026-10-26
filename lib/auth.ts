import { getUser, refreshSession, type User } from "@netlify/identity";

// Same-origin check for form posts. Uses Origin when the browser sends it and
// falls back to Referer, since some older e-reader browsers omit Origin.
export function isSameOrigin(req: Request): boolean {
  const self = new URL(req.url).origin;
  const origin = req.headers.get("origin");
  if (origin && origin !== "null") return origin === self;
  const referer = req.headers.get("referer");
  if (referer) {
    try {
      return new URL(referer).origin === self;
    } catch {
      return false;
    }
  }
  return false;
}

export async function currentUser(): Promise<User | null> {
  try {
    await refreshSession();
  } catch {
    // Fall through: getUser() returns null if the session is unusable.
  }
  return getUser();
}

export function displayName(user: User): string {
  const name = (user.name || "").trim();
  if (name) return name.slice(0, 40);
  return (user.email || "someone").split("@")[0].slice(0, 40);
}

