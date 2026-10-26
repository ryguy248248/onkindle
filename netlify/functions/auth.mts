import type { Config, Context } from "@netlify/functions";
import { AuthError, admin, login, logout } from "@netlify/identity";
import { isSameOrigin } from "../../lib/auth.js";
import { redirect } from "../../lib/html.js";
import { isValidUsername, usernameToEmail } from "../../lib/username.js";

const MIN_PASSWORD_LENGTH = 6;

function credentials(form: FormData): { username: string; password: string } {
  return {
    username: String(form.get("username") || "").trim(),
    password: String(form.get("password") || ""),
  };
}

async function handleLogin(form: FormData): Promise<Response> {
  const { username, password } = credentials(form);
  if (!username || !password) return redirect("/?n=missing");
  if (!isValidUsername(username)) return redirect("/?n=bad-login");
  try {
    await login(usernameToEmail(username), password);
    return redirect("/");
  } catch {
    return redirect("/?n=bad-login");
  }
}

async function handleSignup(form: FormData): Promise<Response> {
  const { username, password } = credentials(form);
  if (!username || !password) return redirect("/?n=missing");
  if (!isValidUsername(username)) return redirect("/?n=bad-username");
  if (password.length < MIN_PASSWORD_LENGTH) return redirect("/?n=short-password");

  const email = usernameToEmail(username);
  try {
    // Admin-created users are confirmed immediately, so no email is involved.
    await admin.createUser({ email, password, data: { user_metadata: { full_name: username } } });
  } catch (error) {
    if (error instanceof AuthError && (error.status === 422 || /already|exists|registered/i.test(error.message))) {
      return redirect("/?n=username-taken");
    }
    return redirect("/?n=signup-failed");
  }

  try {
    await login(email, password);
    return redirect("/");
  } catch {
    return redirect("/?n=created");
  }
}

export default async (req: Request, context: Context) => {
  if (req.method !== "POST") return redirect("/");
  if (!isSameOrigin(req)) return redirect("/?n=forbidden");

  const action = new URL(req.url).pathname.replace(/^\/auth\//, "");
  if (action === "logout") {
    try {
      await logout();
    } catch {
      // Cookies are cleared regardless.
    }
    return redirect("/");
  }

  const form = await req.formData();
  if (action === "login") return handleLogin(form);
  if (action === "signup") return handleSignup(form);
  return redirect("/");
};

export const config: Config = {
  path: ["/auth/login", "/auth/signup", "/auth/logout"],
};
