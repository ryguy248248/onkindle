import type { Config, Context } from "@netlify/functions";
import { and, desc, eq, gt, gte } from "drizzle-orm";
import { db } from "../../db/index.js";
import { messages } from "../../db/schema.js";
import { currentUser, displayName, isSameOrigin } from "../../lib/auth.js";
import { redirect } from "../../lib/html.js";
import { renderMessage } from "../../lib/render.js";

const MIN_SECONDS_BETWEEN_POSTS = 2;

function wantsJson(req: Request): boolean {
  return (req.headers.get("accept") || "").includes("application/json");
}

function fail(req: Request, code: string, status: number): Response {
  return wantsJson(req) ? Response.json({ error: code }, { status }) : redirect(`/?n=${code}`);
}

export default async (req: Request, context: Context) => {
  const user = await currentUser();
  if (!user) return fail(req, "unauthorized", 401);

  if (req.method === "GET") {
    const after = Math.max(0, parseInt(new URL(req.url).searchParams.get("after") || "0", 10) || 0);
    const rows = await db.select().from(messages).where(gt(messages.id, after)).orderBy(desc(messages.id)).limit(50);
    return Response.json(
      { latest: rows.length ? rows[0].id : after, html: rows.map(renderMessage).join("") },
      { headers: { "cache-control": "no-store" } },
    );
  }

  if (req.method === "POST") {
    if (!isSameOrigin(req)) return fail(req, "forbidden", 403);

    const form = await req.formData();
    const body = String(form.get("body") || "").replace(/\s+/g, " ").trim();
    if (!body) return fail(req, "empty", 400);
    if (body.length > 500) return fail(req, "too-long", 400);

    const since = new Date(Date.now() - MIN_SECONDS_BETWEEN_POSTS * 1000);
    const [recent] = await db
      .select({ id: messages.id })
      .from(messages)
      .where(and(eq(messages.userId, user.id), gte(messages.createdAt, since)))
      .limit(1);
    if (recent) return fail(req, "slow-down", 429);

    await db.insert(messages).values({ userId: user.id, author: displayName(user), body });
    return wantsJson(req) ? Response.json({ ok: true }, { status: 201 }) : redirect("/");
  }

  return new Response("Method not allowed", { status: 405 });
};

export const config: Config = {
  path: "/api/messages",
};
