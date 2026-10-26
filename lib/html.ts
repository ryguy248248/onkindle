// Server-rendered HTML kept deliberately simple so it works in the Kindle
// e-ink browser: no frameworks, no modern JS, high contrast, big tap targets.

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function page(title: string, body: string, extraHead = ""): Response {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<link rel="stylesheet" href="/style.css">
${extraHead}
</head>
<body>
<div class="wrap">
<h1 class="brand"><a href="/">onkindle</a></h1>
${body}
</div>
</body>
</html>`;
  return new Response(html, {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
    },
  });
}

export function notice(text: string | null, kind: "error" | "ok" = "ok"): string {
  return text ? `<p class="notice ${kind}">${escapeHtml(text)}</p>` : "";
}

export function redirect(location: string): Response {
  return new Response(null, { status: 303, headers: { Location: location, "cache-control": "no-store" } });
}
