// "Personal" campaign style: reads like an email Lucas typed himself. No logo
// header, no button, no "you signed up" footer (wrong for a shop that never
// did). Just the body, then a small unsubscribe line. Shared by the editor
// preview and the send route so what you preview is what goes out.

export const UNSUB_PLACEHOLDER = '{{UNSUB_URL}}';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export function buildPersonalHtml(bodyText: string, unsubUrl = UNSUB_PLACEHOLDER): string {
  const paragraphs = bodyText
    .split(/\n\n+/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 16px">${escapeHtml(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#ffffff">
<div style="max-width:600px;padding:20px 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.6;color:#1f2328">
${paragraphs}
<p style="margin:28px 0 0;font-size:12px;color:#8a8f98">Not interested? <a href="${unsubUrl}" style="color:#8a8f98">Unsubscribe</a> and I won't email again.</p>
</div></body></html>`;
}

export function buildPersonalText(bodyText: string, unsubUrl = UNSUB_PLACEHOLDER): string {
  return `${bodyText.trim()}\n\n--\nNot interested? Unsubscribe: ${unsubUrl}`;
}
