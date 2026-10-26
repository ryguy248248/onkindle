import type { Config, Context } from "@netlify/functions";
import { desc } from "drizzle-orm";
import { db } from "../../db/index.js";
import { messages } from "../../db/schema.js";
import { currentUser, displayName } from "../../lib/auth.js";
import { escapeHtml, notice, page } from "../../lib/html.js";
import { renderMessage } from "../../lib/render.js";

const NOTICES: Record<string, [string, "ok" | "error"]> = {
  "bad-login": ["Wrong username or password.", "error"],
  "bad-username": ["Usernames are 3–20 letters, numbers or underscores.", "error"],
  "short-password": ["Passwords need at least 6 characters.", "error"],
  "username-taken": ["That username is taken. Try another one.", "error"],
  "signup-failed": ["Could not create the account. Please try again.", "error"],
  "created": ["Account created. Log in with your username and password.", "ok"],
  "missing": ["Please fill in every field.", "error"],
  "forbidden": ["That request was blocked. Please try again from this page.", "error"],
  "empty": ["Type a message first.", "error"],
  "too-long": ["Messages can be up to 500 characters.", "error"],
  "slow-down": ["Slow down a little — wait a few seconds between messages.", "error"],
};

function noticeFor(url: URL): string {
  const entry = NOTICES[url.searchParams.get("n") || ""];
  return entry ? notice(entry[0], entry[1]) : "";
}

function loginPage(url: URL): Response {
  return page(
    "onkindle chat",
    `<p class="lede">A live chat room made for the Kindle browser. Log in or create an account to join.</p>
${noticeFor(url)}
<h2>Log in</h2>
<form method="post" action="/auth/login">
<label for="l-user">Username</label>
<input id="l-user" name="username" type="text" autocomplete="username" autocapitalize="off" autocorrect="off" required>
<label for="l-pass">Password</label>
<input id="l-pass" name="password" type="password" autocomplete="current-password" required>
<button type="submit">Log in</button>
</form>
<hr>
<h2>Create an account</h2>
<form method="post" action="/auth/signup">
<label for="s-user">Username</label>
<input id="s-user" name="username" type="text" minlength="3" maxlength="20" pattern="[A-Za-z0-9_]{3,20}" autocomplete="username" autocapitalize="off" autocorrect="off" required>
<p class="hint">3–20 letters, numbers or underscores.</p>
<label for="s-pass">Password</label>
<input id="s-pass" name="password" type="password" autocomplete="new-password" minlength="6" required>
<p class="hint">At least 6 characters.</p>
<button type="submit">Create account</button>
</form>`,
  );
}

export default async (req: Request, context: Context) => {
  const url = new URL(req.url);
  const user = await currentUser();
  if (!user) return loginPage(url);

  const recent = await db.select().from(messages).orderBy(desc(messages.id)).limit(50);
  const latestId = recent.length ? recent[0].id : 0;

  return page(
    "Chat · onkindle",
    `<div class="bar"><span>Chatting as <strong>${escapeHtml(displayName(user))}</strong></span>
<form method="post" action="/auth/logout" class="inline"><button type="submit" class="link">Log out</button></form></div>
${noticeFor(url)}
<form id="send" method="post" action="/api/messages" class="send">
<label for="body" class="sr">Message</label>
<input id="body" name="body" type="text" maxlength="500" autocomplete="off" placeholder="Say something…" required>
<button type="submit">Send</button>
</form>
<p class="status" id="status">Newest messages are at the top. <a href="/">Refresh</a></p>
<ul id="messages" class="messages" data-latest="${latestId}">
${recent.length ? recent.map(renderMessage).join("\n") : '<li class="empty" id="empty">No messages yet. Say hello!</li>'}
</ul>`,
    `<noscript><meta http-equiv="refresh" content="30"></noscript>
<script src="/chat.js" defer></script>`,
  );
};

export const config: Config = {
  path: "/",
};
