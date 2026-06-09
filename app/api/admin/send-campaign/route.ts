import { NextRequest } from 'next/server';
import { cookies } from 'next/headers';
import { Resend } from 'resend';
import { createSupabaseServiceClient } from '@/lib/supabase/client';

async function checkAuth(): Promise<boolean> {
  const cookieStore = await cookies();
  return cookieStore.get('gk_admin')?.value === process.env.ADMIN_PASSWORD;
}

function buildHtml({
  headline,
  bodyText,
  ctaText,
  ctaUrl,
  preheader,
}: {
  headline: string;
  bodyText: string;
  ctaText?: string;
  ctaUrl?: string;
  preheader?: string;
}): string {
  const paragraphs = bodyText
    .split(/\n\n+/)
    .map((p) => p.trim().replace(/\n/g, '<br/>'))
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 18px;color:#57534E;line-height:1.75;font-size:16px">${p}</p>`)
    .join('');

  const cta =
    ctaText && ctaUrl
      ? `<div style="margin:32px 0">
           <a href="${ctaUrl}" style="background:#C0541A;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">${ctaText}</a>
         </div>`
      : '';

  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;font-size:1px;line-height:1px;color:#FFFDF8">
         ${preheader}&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌&nbsp;‌
       </div>`
    : '';

  return `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#F5EFE3">
${preheaderHtml}
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;max-width:600px;margin:0 auto;background:#FFFDF8">
  <div style="background:#C0541A;padding:24px 32px">
    <span style="font-family:Georgia,'Times New Roman',serif;font-size:26px;color:#fff;font-weight:bold;letter-spacing:-0.5px">good kicks.</span>
  </div>
  <div style="padding:40px 32px">
    <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:30px;margin:0 0 24px;color:#1C1917;font-weight:normal;line-height:1.25">${headline}</h1>
    ${paragraphs}
    ${cta}
  </div>
  <div style="border-top:1px solid #E5DDD0;padding:24px 32px;background:#FAF7F2">
    <p style="color:#78716C;font-size:12px;margin:0;line-height:1.7">
      Good Kicks &nbsp;·&nbsp; <a href="https://goodkicks.co" style="color:#C0541A;text-decoration:none">goodkicks.co</a><br/>
      You received this because you signed up or placed an order with us.<br/>
      <a href="mailto:info@goodkicks.co?subject=Unsubscribe" style="color:#78716C">Unsubscribe</a>
    </p>
  </div>
</div>
</body>
</html>`;
}

export async function POST(req: NextRequest) {
  if (!(await checkAuth())) return new Response('Unauthorized', { status: 401 });

  const { subject, preheader, headline, bodyText, ctaText, ctaUrl, sources, emails, customHtml } = await req.json() as {
    subject: string;
    preheader?: string;
    headline?: string;
    bodyText?: string;
    ctaText?: string;
    ctaUrl?: string;
    sources?: string[];
    emails?: string[];
    customHtml?: string;
  };

  if (!subject?.trim()) {
    return Response.json({ error: 'subject is required' }, { status: 400 });
  }
  if (!customHtml && (!headline?.trim() || !bodyText?.trim())) {
    return Response.json({ error: 'headline and bodyText are required when not using custom HTML' }, { status: 400 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return Response.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });

  const supabase = createSupabaseServiceClient();
  let query = supabase.from('contacts').select('email, name');
  if (emails && emails.length > 0) {
    query = query.in('email', emails);
  } else if (sources && sources.length > 0) {
    query = query.overlaps('sources', sources);
  }
  const { data: contacts, error: dbErr } = await query;
  if (dbErr) return Response.json({ error: dbErr.message }, { status: 500 });
  if (!contacts || contacts.length === 0) {
    return Response.json({ error: 'No contacts match the selected segments' }, { status: 400 });
  }

  const resend = new Resend(resendKey);
  const html = customHtml ?? buildHtml({ headline: headline!, bodyText: bodyText!, ctaText, ctaUrl, preheader });

  const CHUNK = 100;
  let sent = 0;
  let failed = 0;

  for (let i = 0; i < contacts.length; i += CHUNK) {
    const chunk = contacts.slice(i, i + CHUNK);
    const messages = chunk.map((c) => ({
      from: 'Good Kicks <info@goodkicks.co>',
      to: c.email,
      subject: subject.trim(),
      html,
    }));
    const { error: batchErr } = await resend.batch.send(messages);
    if (batchErr) {
      failed += chunk.length;
    } else {
      sent += chunk.length;
    }
  }

  return Response.json({ sent, failed });
}
