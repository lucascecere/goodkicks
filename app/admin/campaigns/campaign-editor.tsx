'use client';

import { useState, useMemo, useRef } from 'react';
import { chromeFor } from '@/lib/email/campaign-chrome';
import { BRAND_LABELS, type RealBrand } from '@/lib/admin/brand';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { btn, field } from '@/components/admin/ui';

const ALL_SOURCES = ['order', 'newsletter', 'discount', 'ambassador', 'contact'] as const;
type Source = typeof ALL_SOURCES[number];
const SOURCE_LABELS: Record<Source, string> = {
  order: 'Customers (orders)', newsletter: 'Newsletter sign-ups',
  discount: 'Discount wheel', ambassador: 'Ambassadors', contact: 'Contact form',
};

interface SourceCount { source: string; count: number; }
interface Contact { id: string; name: string | null; email: string; brands?: string[]; }
type RecipientMode = 'all' | 'segment' | 'individual';
type ContentMode = 'compose' | 'html';
type Device = 'desktop' | 'mobile';

export interface InitialCampaign {
  id: string;
  name: string;
  subject: string;
  preheader: string | null;
  headline: string | null;
  body_text: string | null;
  cta_text: string | null;
  cta_url: string | null;
  custom_html: string | null;
  brand?: RealBrand;
  audience_brands?: string[];
  content_mode: ContentMode;
  recipient_mode: RecipientMode;
  sources: string[];
  emails: string[];
  status: 'draft' | 'sent';
}

interface Props {
  initialCampaign?: InitialCampaign;
  /** Seeds the sending brand for a NEW campaign, from the admin switcher. */
  initialBrand?: RealBrand;
  totalContacts: number;
  sourceCounts: SourceCount[];
  contacts: Contact[];
}

// Reads the SAME chrome map the send route uses, so what you preview is what
// actually goes out — these were two independent copies of one email before.
function buildPreviewHtml(subject: string, headline: string, bodyText: string, ctaText: string, ctaUrl: string, preheader: string, brand: RealBrand) {
  const chrome = chromeFor(brand);
  const paragraphs = bodyText.split(/\n\n+/).map((p) => p.trim().replace(/\n/g, '<br>')).filter(Boolean)
    .map((p) => `<p style="margin:0 0 18px;color:#57534E;line-height:1.75;font-size:16px;font-family:-apple-system,sans-serif">${p}</p>`).join('');
  const cta = ctaText && ctaUrl
    ? `<div style="margin:32px 0"><a href="${ctaUrl}" style="background:${chrome.accent};color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;font-family:-apple-system,sans-serif">${ctaText}</a></div>` : '';
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
  body{margin:0;padding:0;background:${chrome.bg}}
  .wrap{background:${chrome.bg};padding:24px 16px}
  .email{max-width:580px;margin:0 auto;background:#FFFDF8;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12)}
  @media(max-width:620px){.wrap{padding:0!important}.email{border-radius:0!important}.hdr{padding:18px 20px!important}.bdy{padding:28px 20px!important}.h1{font-size:22px!important}.cta-a{display:block!important;text-align:center!important}.ftr{padding:20px!important}}
</style></head><body>
<div class="wrap"><div class="email">
  ${subject ? `<div style="background:#FAF7F2;border-bottom:1px solid #E5DDD0;padding:12px 28px"><p style="margin:0;font-size:12px;color:#78716C;font-family:-apple-system,sans-serif"><strong style="color:#1C1917">Subject:</strong> ${subject}${preheader ? ` &nbsp;·&nbsp; <em>${preheader}</em>` : ''}</p></div>` : ''}
  <div class="hdr" style="background:${chrome.header};padding:22px 32px"><span style="font-family:Georgia,serif;font-size:24px;color:#fff;font-weight:bold">${chrome.wordmark}</span></div>
  <div class="bdy" style="padding:36px 32px">
    <h1 class="h1" style="font-family:Georgia,serif;font-size:28px;margin:0 0 22px;color:#1C1917;font-weight:normal;line-height:1.25">${headline || '<span style="color:#A8A29E">(headline here)</span>'}</h1>
    ${paragraphs || '<p style="color:#A8A29E;font-size:15px;font-family:-apple-system,sans-serif">(body text here)</p>'}
    ${cta ? `<div style="margin:32px 0"><a class="cta-a" href="${ctaUrl}" style="background:${chrome.accent};color:#fff;padding:14px 32px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block;font-family:-apple-system,sans-serif">${ctaText}</a></div>` : ''}
  </div>
  <div class="ftr" style="border-top:1px solid #E5DDD0;padding:22px 32px;background:#FAF7F2">
    <p style="color:#78716C;font-size:12px;margin:0;line-height:1.8;font-family:-apple-system,sans-serif">${chrome.name} &nbsp;&middot;&nbsp; <a href="${chrome.url}" style="color:${chrome.accent};text-decoration:none">${chrome.site}</a><br>You received this because you signed up or placed an order.<br><a href="#" style="color:#78716C">Unsubscribe</a></p>
  </div>
</div></div></body></html>`;
}

export function CampaignEditor({ initialCampaign, initialBrand, totalContacts, sourceCounts, contacts }: Props) {
  const router = useRouter();
  const c = initialCampaign;

  const [campaignId, setCampaignId] = useState(c?.id);
  const [name, setName] = useState(c?.name ?? 'Untitled Campaign');
  const [subject, setSubject] = useState(c?.subject ?? '');
  const [preheader, setPreheader] = useState(c?.preheader ?? '');
  const [headline, setHeadline] = useState(c?.headline ?? '');
  const [bodyText, setBodyText] = useState(c?.body_text ?? '');
  const [ctaText, setCtaText] = useState(c?.cta_text ?? '');
  const [ctaUrl, setCtaUrl] = useState(c?.cta_url ?? '');
  const [contentMode, setContentMode] = useState<ContentMode>(c?.content_mode ?? 'compose');
  const [customHtml, setCustomHtml] = useState(c?.custom_html ?? '');
  const [htmlFileName, setHtmlFileName] = useState(c?.custom_html ? 'uploaded.html' : '');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [brand, setBrand] = useState<RealBrand>(c?.brand ?? initialBrand ?? 'townies');
  const [audienceBrands, setAudienceBrands] = useState<Set<RealBrand>>(
    new Set((c?.audience_brands ?? []) as RealBrand[]),
  );
  const [recipientMode, setRecipientMode] = useState<RecipientMode>(c?.recipient_mode ?? 'all');
  const [selectedSources, setSelectedSources] = useState<Set<Source>>(new Set((c?.sources ?? []) as Source[]));
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set(c?.emails ?? []));
  const [contactSearch, setContactSearch] = useState('');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<Device>('desktop');
  const [confirming, setConfirming] = useState(false);

  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [sendStatus, setSendStatus] = useState<{ type: 'idle' | 'sending' | 'done' | 'error'; message?: string }>({ type: 'idle' });

  const isSent = c?.status === 'sent' && !campaignId; // immutable once sent (only if loaded that way)

  const filteredContacts = useMemo(() => {
    const q = contactSearch.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter((c) => c.email.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q));
  }, [contacts, contactSearch]);

  function toggleSource(s: Source) {
    const next = new Set(selectedSources);
    next.has(s) ? next.delete(s) : next.add(s);
    setSelectedSources(next);
  }
  function toggleEmail(e: string) {
    const next = new Set(selectedEmails);
    next.has(e) ? next.delete(e) : next.add(e);
    setSelectedEmails(next);
  }
  function toggleAllFiltered() {
    const allSel = filteredContacts.every((c) => selectedEmails.has(c.email));
    const next = new Set(selectedEmails);
    filteredContacts.forEach((c) => allSel ? next.delete(c.email) : next.add(c.email));
    setSelectedEmails(next);
  }

  function handleHtmlFile(file: File) {
    if (!file.name.endsWith('.html') && file.type !== 'text/html') { alert('Please upload an .html file.'); return; }
    const reader = new FileReader();
    reader.onload = (e) => { setCustomHtml(e.target?.result as string ?? ''); setHtmlFileName(file.name); };
    reader.readAsText(file);
  }

  function buildPayload() {
    return {
      name, subject, preheader: preheader || undefined,
      headline: contentMode === 'compose' ? headline : undefined,
      bodyText: contentMode === 'compose' ? bodyText : undefined,
      ctaText: contentMode === 'compose' && ctaText ? ctaText : undefined,
      ctaUrl: contentMode === 'compose' && ctaUrl ? ctaUrl : undefined,
      customHtml: contentMode === 'html' ? customHtml : undefined,
      contentMode, recipientMode,
      brand,
      audienceBrands: [...audienceBrands],
      sources: recipientMode === 'segment' ? [...selectedSources] : [],
      emails: recipientMode === 'individual' ? [...selectedEmails] : [],
    };
  }

  // The "All contacts" badge has to respect the audience filter, or it promises
  // a reach the send will not deliver.
  const audienceCount = useMemo(() => {
    if (audienceBrands.size === 0) return totalContacts;
    return contacts.filter((c) => (c.brands ?? []).some((b) => audienceBrands.has(b as RealBrand))).length;
  }, [contacts, audienceBrands, totalContacts]);

  function toggleAudienceBrand(b: RealBrand) {
    setAudienceBrands((prev) => {
      const next = new Set(prev);
      if (next.has(b)) next.delete(b);
      else next.add(b);
      return next;
    });
  }

  async function saveDraft(): Promise<string | null> {
    setSaveStatus('saving');
    setSaveError('');
    try {
      let res: Response;
      if (campaignId) {
        res = await fetch(`/api/admin/campaigns/${campaignId}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) });
      } else {
        res = await fetch('/api/admin/campaigns', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(buildPayload()) });
        if (res.ok) {
          const json = await res.json();
          setCampaignId(json.id);
          router.replace(`/admin/campaigns/${json.id}`);
          setSaveStatus('saved');
          return json.id;
        }
      }
      if (!res.ok) { const j = await res.json(); setSaveStatus('error'); setSaveError(j.error ?? 'Save failed'); return null; }
      setSaveStatus('saved');
      return campaignId!;
    } catch { setSaveStatus('error'); setSaveError('Network error'); return null; }
  }

  async function handleSend() {
    setConfirming(false);
    setSendStatus({ type: 'sending' });
    const id = await saveDraft();
    if (!id) { setSendStatus({ type: 'error', message: 'Could not save before sending.' }); return; }
    try {
      const res = await fetch(`/api/admin/campaigns/${id}/send`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) setSendStatus({ type: 'error', message: json.error ?? 'Send failed' });
      else setSendStatus({ type: 'done', message: `Sent to ${json.sent} contact${json.sent !== 1 ? 's' : ''}${json.failed > 0 ? ` (${json.failed} failed)` : ''}.` });
    } catch { setSendStatus({ type: 'error', message: 'Network error' }); }
  }

  function recipientCount() {
    if (recipientMode === 'all') return totalContacts;
    if (recipientMode === 'individual') return selectedEmails.size;
    if (selectedSources.size === 0) return 0;
    return sourceCounts.filter((s) => selectedSources.has(s.source as Source)).reduce((n, s) => n + s.count, 0);
  }

  function isValid() {
    const hasContent = contentMode === 'html' ? !!customHtml : (!!headline.trim() && !!bodyText.trim());
    const hasRecipients = recipientMode === 'all' || (recipientMode === 'segment' && selectedSources.size > 0) || (recipientMode === 'individual' && selectedEmails.size > 0);
    return !!subject.trim() && hasContent && hasRecipients;
  }

  const count = recipientCount();

  return (
    <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-8 sm:py-10">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/campaigns" className="inline-flex items-center gap-1 font-label text-[11px] font-semibold uppercase tracking-[0.16em] text-town-cream/50 hover:text-town-cream">← Campaigns</Link>
      </div>

      {/* Campaign name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Campaign name…"
        className="w-full border-none bg-transparent font-block text-3xl font-bold text-town-cream outline-none placeholder:text-town-cream/25 focus:ring-0 sm:text-4xl"
      />

      {/* Sending brand — sets the From address and the email's chrome. Separate
          from the audience filter in Recipients: a Townies-branded email to the
          Good Kicks list is a normal thing to send now that Good Kicks is a
          Townies product line. */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="admin-eyebrow">Send as</span>
        <div className="inline-flex rounded-full border border-town-cream/15 p-1">
          {(['townies', 'goodkicks'] as RealBrand[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBrand(b)}
              className={`rounded-full px-3.5 py-1.5 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${
                brand === b ? 'bg-town-cream text-town-navy' : 'text-town-cream/60 hover:text-town-cream'
              }`}
            >
              {BRAND_LABELS[b]}
            </button>
          ))}
        </div>
      </div>

      {/* Status banners */}
      {sendStatus.type === 'done' && (
        <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-5 py-3 text-sm text-emerald-300">{sendStatus.message}</div>
      )}
      {sendStatus.type === 'error' && (
        <div className="rounded-xl border border-red-400/30 bg-red-400/10 px-5 py-3 text-sm text-red-300">Error: {sendStatus.message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: content */}
        <div className="lg:col-span-3">
          <div className="space-y-4 rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-4 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="admin-eyebrow">Email Content</p>
              <div className="flex gap-1 rounded-full border border-town-cream/15 p-0.5">
                {(['compose', 'html'] as ContentMode[]).map((m) => (
                  <button key={m} type="button" onClick={() => setContentMode(m)}
                    className={`rounded-full px-3 py-1 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${contentMode === m ? 'bg-town-cream text-town-navy' : 'text-town-cream/60 hover:text-town-cream'}`}>
                    {m === 'compose' ? 'Compose' : 'Upload HTML'}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject + preheader always visible */}
            <div>
              <label className="admin-eyebrow mb-1.5 block">Subject <span className="text-amber-300">*</span></label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. your next foot bag is on us 🤙"
                className={field} />
            </div>
            <div>
              <label className="admin-eyebrow mb-1.5 block">Preview text <span className="font-normal normal-case tracking-normal text-town-cream/40">(inbox snippet)</span></label>
              <input type="text" value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="e.g. The circle's been waiting for this one."
                className={field} />
            </div>

            {contentMode === 'compose' ? (
              <>
                <div>
                  <label className="admin-eyebrow mb-1.5 block">Headline <span className="text-amber-300">*</span></label>
                  <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. new colorways just dropped."
                    className={field} />
                </div>
                <div>
                  <label className="admin-eyebrow mb-1.5 block">Body <span className="text-amber-300">*</span></label>
                  <p className="mb-2 text-xs text-town-cream/45">Blank line between paragraphs.</p>
                  <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={7}
                    placeholder={"Hey, just wanted to share...\n\nDouble-return for a new paragraph."}
                    className={`${field} resize-y`} />
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <div>
                    <label className="admin-eyebrow mb-1.5 block">Button text <span className="font-normal normal-case tracking-normal text-town-cream/40">(optional)</span></label>
                    <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="shop now →"
                      className={field} />
                  </div>
                  <div>
                    <label className="admin-eyebrow mb-1.5 block">Button URL <span className="font-normal normal-case tracking-normal text-town-cream/40">(optional)</span></label>
                    <input type="url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://goodkicks.co/shop"
                      className={field} />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="admin-eyebrow mb-1.5 block">HTML file <span className="text-amber-300">*</span></label>
                <input ref={fileInputRef} type="file" accept=".html,text/html" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHtmlFile(f); }} />
                {!customHtml ? (
                  <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleHtmlFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`cursor-pointer rounded-xl border-2 border-dashed p-10 text-center transition-colors ${dragOver ? 'border-town-cream/60 bg-town-cream/[0.06]' : 'border-town-cream/15 hover:border-town-cream/40 hover:bg-town-cream/[0.04]'}`}>
                    <p className="mb-1 text-sm font-semibold text-town-cream">Drop your .html file here</p>
                    <p className="text-xs text-town-cream/45">or click to browse</p>
                  </div>
                ) : (
                  <div className="flex items-center justify-between gap-3 rounded-xl border border-town-cream/15 p-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-town-cream/10">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-town-cream">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-town-cream">{htmlFileName}</p>
                        <p className="text-xs text-town-cream/45">{(customHtml.length / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setCustomHtml(''); setHtmlFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="flex-shrink-0 text-xs text-town-cream/50 transition-colors hover:text-red-300">Remove</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: recipients + actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="space-y-3 rounded-xl border border-town-cream/10 bg-town-cream/[0.04] p-4 sm:p-6">
            <p className="admin-eyebrow">Recipients</p>

            {/* Audience brand narrows whichever mode is chosen below. Leaving
                both unchecked means no brand filter at all, which is exactly how
                every campaign behaved before contacts carried a brand. */}
            <div className="pb-1">
              <p className="mb-1.5 text-xs text-town-cream/45">Limit to brand</p>
              <div className="flex gap-4">
                {(['townies', 'goodkicks'] as RealBrand[]).map((b) => (
                  <label key={b} className="flex cursor-pointer items-center gap-2 text-sm text-town-cream">
                    <input
                      type="checkbox"
                      checked={audienceBrands.has(b)}
                      onChange={() => toggleAudienceBrand(b)}
                      className="accent-town-cream"
                    />
                    {BRAND_LABELS[b]}
                  </label>
                ))}
              </div>
              {audienceBrands.size === 0 && (
                <p className="mt-1 text-[11px] text-town-cream/45">No filter — every brand.</p>
              )}
            </div>

            {([['all', 'All contacts', audienceCount], ['segment', 'By segment', null], ['individual', 'Pick contacts', null]] as const).map(([m, label, badge]) => (
              <div key={m}>
                <label className="flex items-center gap-3 cursor-pointer py-0.5">
                  <input type="radio" name="recip" checked={recipientMode === m} onChange={() => setRecipientMode(m)} className="accent-town-cream" />
                  <span className="text-sm font-semibold text-town-cream">{label}</span>
                  {badge !== null && <span className="ml-auto rounded-full border border-town-cream/15 px-2 py-0.5 text-xs font-semibold text-town-cream/70">{badge}</span>}
                  {m === 'individual' && recipientMode === 'individual' && selectedEmails.size > 0 && (
                    <span className="ml-auto rounded-full bg-town-cream px-2 py-0.5 text-xs font-semibold text-town-navy">{selectedEmails.size} selected</span>
                  )}
                </label>

                {m === 'segment' && recipientMode === 'segment' && (
                  <div className="pl-6 space-y-2 pt-1 pb-1">
                    {ALL_SOURCES.map((src) => {
                      const sc = sourceCounts.find((s) => s.source === src);
                      return (
                        <label key={src} className="flex items-center gap-2.5 cursor-pointer">
                          <input type="checkbox" checked={selectedSources.has(src)} onChange={() => toggleSource(src)} className="accent-town-cream" />
                          <span className="text-sm text-town-cream">{SOURCE_LABELS[src]}</span>
                          <span className="ml-auto text-xs text-town-cream/45">{sc?.count ?? 0}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {m === 'individual' && recipientMode === 'individual' && (
                  <div className="pt-2 pb-1 space-y-2">
                    <input type="text" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Search name or email…"
                      className={field} />
                    {filteredContacts.length > 0 && (
                      <button type="button" onClick={toggleAllFiltered} className="text-xs font-semibold text-town-cream hover:underline">
                        {filteredContacts.every((c) => selectedEmails.has(c.email)) ? 'Deselect all' : `Select all (${filteredContacts.length})`}
                      </button>
                    )}
                    <div className="max-h-52 divide-y divide-town-cream/[0.07] overflow-y-auto rounded-lg border border-town-cream/15">
                      {filteredContacts.length === 0
                        ? <p className="px-3 py-3 text-center text-sm text-town-cream/45">No contacts found.</p>
                        : filteredContacts.map((c) => (
                          <label key={c.id} className="flex cursor-pointer items-center gap-2.5 px-3 py-2.5 hover:bg-town-cream/[0.04]">
                            <input type="checkbox" checked={selectedEmails.has(c.email)} onChange={() => toggleEmail(c.email)} className="accent-town-cream flex-shrink-0" />
                            <div className="min-w-0">
                              {c.name && <p className="truncate text-sm leading-tight text-town-cream">{c.name}</p>}
                              <p className="truncate text-xs text-town-cream/45">{c.email}</p>
                            </div>
                          </label>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="flex items-center justify-between border-t border-town-cream/10 pt-3">
              <span className="text-sm text-town-cream/55">Sending to</span>
              <span className="text-sm font-semibold text-town-cream">{count} contact{count !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <button onClick={() => setPreviewOpen(true)}
                className={`${btn.secondary} flex-1`}>
                Preview
              </button>
              <button onClick={saveDraft} disabled={saveStatus === 'saving'}
                className={`${btn.secondary} flex-1`}>
                {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Save Draft'}
              </button>
            </div>
            {saveStatus === 'error' && <p className="text-xs text-red-300">{saveError}</p>}

            {!confirming ? (
              <button onClick={() => setConfirming(true)} disabled={!isValid() || sendStatus.type === 'sending' || count === 0}
                className={`${btn.primary} w-full disabled:cursor-not-allowed`}>
                {sendStatus.type === 'sending' ? 'Sending…' : `Send to ${count} contact${count !== 1 ? 's' : ''} →`}
              </button>
            ) : (
              <div className="space-y-3 rounded-xl border border-amber-400/30 bg-amber-400/10 p-4">
                <p className="text-sm font-semibold text-amber-200">Send to {count} contacts? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={handleSend} className={`${btn.primary} flex-1`}>Yes, send it</button>
                  <button onClick={() => setConfirming(false)} className={`${btn.secondary} flex-1`}>Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setPreviewOpen(false); }}>
          <div className="flex min-h-full flex-col items-center bg-town-navy/90 px-4 py-6 backdrop-blur-sm">
            {/* Controls bar */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-4">
              <div className="flex gap-1 rounded-full border border-town-cream/15 p-0.5">
                {(['desktop', 'mobile'] as Device[]).map((d) => (
                  <button key={d} onClick={() => setPreviewDevice(d)}
                    className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-label text-[11px] font-semibold uppercase tracking-[0.12em] transition-colors ${previewDevice === d ? 'bg-town-cream text-town-navy' : 'text-town-cream/60 hover:text-town-cream'}`}>
                    {d === 'desktop'
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
                    {d === 'desktop' ? 'Desktop' : 'Mobile'}
                  </button>
                ))}
              </div>
              <button onClick={() => setPreviewOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-full border border-town-cream/20 text-lg leading-none text-town-cream transition-colors hover:border-town-cream/50">×</button>
            </div>

            {/* Preview frame */}
            <div className={`w-full transition-all duration-300 ${previewDevice === 'mobile' ? 'max-w-[390px]' : 'max-w-2xl'}`}>
              {previewDevice === 'mobile' && (
                <div className="bg-[#1A1A1A] rounded-[40px] p-3 shadow-2xl border-4 border-[#333]">
                  <div className="bg-[#1A1A1A] rounded-[8px] h-5 w-24 mx-auto mb-2 flex items-center justify-center">
                    <div className="w-16 h-1.5 bg-[#333] rounded-full" />
                  </div>
                  <div className="rounded-[24px] overflow-hidden">
                    {contentMode === 'html' && customHtml
                      ? <iframe srcDoc={customHtml} className="w-full border-0" style={{ height: '560px' }} title="Mobile preview" sandbox="allow-same-origin" />
                      : <div dangerouslySetInnerHTML={{ __html: buildPreviewHtml(subject, headline, bodyText, ctaText, ctaUrl, preheader, brand) }} />
                    }
                  </div>
                  <div className="h-4" />
                </div>
              )}
              {previewDevice === 'desktop' && (
                contentMode === 'html' && customHtml
                  ? <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
                      {subject && <div className="border-b border-town-cream/10 bg-town-navy px-5 py-3">
                        <p className="text-xs text-town-cream/55"><strong className="text-town-cream">Subject:</strong> {subject}</p>
                        {preheader && <p className="mt-1 text-xs text-town-cream/55"><strong className="text-town-cream">Preview:</strong> {preheader}</p>}
                      </div>}
                      <iframe srcDoc={customHtml} className="w-full border-0" style={{ height: '600px' }} title="Email preview" sandbox="allow-same-origin" />
                    </div>
                  : <div dangerouslySetInnerHTML={{ __html: buildPreviewHtml(subject, headline, bodyText, ctaText, ctaUrl, preheader, brand) }} />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
