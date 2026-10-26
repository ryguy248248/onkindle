import { escapeHtml } from "./html.js";

export function formatTime(date: Date): string {
  return date.toISOString().slice(11, 16) + " UTC";
}

export function renderMessage(m: { id: number; author: string; body: string; createdAt: Date }): string {
  return `<li class="msg" data-id="${m.id}"><span class="who">${escapeHtml(m.author)}</span> <span class="when">${formatTime(
    m.createdAt,
  )}</span><div class="text">${escapeHtml(m.body)}</div></li>`;
}
