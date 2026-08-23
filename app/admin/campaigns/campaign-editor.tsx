'use client';

import { useState, useMemo, useRef } from 'react';
import { chromeFor } from '@/lib/email/campaign-chrome';
import { BRAND_LABELS, type RealBrand } from '@/lib/admin/brand';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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
    <div className="p-6 sm:p-8 max-w-5xl space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/campaigns" className="text-white/40 hover:text-white transition-colors text-sm">← Campaigns</Link>
      </div>

      {/* Campaign name */}
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Campaign name…"
        className="w-full bg-transparent text-white text-2xl font-semibold placeholder:text-white/20 border-none outline-none focus:ring-0"
      />

      {/* Sending brand — sets the From address and the email's chrome. Separate
          from the audience filter in Recipients: a Townies-branded email to the
          Good Kicks list is a normal thing to send now that Good Kicks is a
          Townies product line. */}
      <div className="flex items-center gap-3">
        <span className="text-xs uppercase tracking-widest text-brand-muted font-medium">Send as</span>
        <div className="inline-flex rounded-lg bg-white/5 p-1">
          {(['townies', 'goodkicks'] as RealBrand[]).map((b) => (
            <button
              key={b}
              type="button"
              onClick={() => setBrand(b)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                brand === b ? 'bg-white text-brand-ink' : 'text-white/60 hover:text-white'
              }`}
            >
              {BRAND_LABELS[b]}
            </button>
          ))}
        </div>
      </div>

      {/* Status banners */}
      {sendStatus.type === 'done' && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-xl px-5 py-3 text-green-300 text-sm">{sendStatus.message}</div>
      )}
      {sendStatus.type === 'error' && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-5 py-3 text-red-300 text-sm">Error: {sendStatus.message}</div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">
        {/* Left: content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-brand-rule p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-brand-muted font-medium">Email Content</p>
              <div className="flex gap-1 bg-[#F0EAD9] p-0.5 rounded-lg">
                {(['compose', 'html'] as ContentMode[]).map((m) => (
                  <button key={m} type="button" onClick={() => setContentMode(m)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${contentMode === m ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-muted hover:text-brand-ink'}`}>
                    {m === 'compose' ? 'Compose' : 'Upload HTML'}
                  </button>
                ))}
              </div>
            </div>

            {/* Subject + preheader always visible */}
            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">Subject <span className="text-brand-rust">*</span></label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="e.g. your next foot bag is on us 🤙"
                className="w-full border border-brand-rule rounded-lg px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust" />
            </div>
            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">Preview text <span className="text-brand-muted text-xs font-normal">(inbox snippet)</span></label>
              <input type="text" value={preheader} onChange={(e) => setPreheader(e.target.value)} placeholder="e.g. The circle's been waiting for this one."
                className="w-full border border-brand-rule rounded-lg px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust" />
            </div>

            {contentMode === 'compose' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1.5">Headline <span className="text-brand-rust">*</span></label>
                  <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)} placeholder="e.g. new colorways just dropped."
                    className="w-full border border-brand-rule rounded-lg px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1.5">Body <span className="text-brand-rust">*</span></label>
                  <p className="text-xs text-brand-muted mb-2">Blank line between paragraphs.</p>
                  <textarea value={bodyText} onChange={(e) => setBodyText(e.target.value)} rows={7}
                    placeholder={"Hey, just wanted to share...\n\nDouble-return for a new paragraph."}
                    className="w-full border border-brand-rule rounded-lg px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust resize-y" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-brand-ink mb-1.5">Button text <span className="text-brand-muted text-xs font-normal">(optional)</span></label>
                    <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)} placeholder="shop now →"
                      className="w-full border border-brand-rule rounded-lg px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-ink mb-1.5">Button URL <span className="text-brand-muted text-xs font-normal">(optional)</span></label>
                    <input type="url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)} placeholder="https://goodkicks.co/shop"
                      className="w-full border border-brand-rule rounded-lg px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust" />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1.5">HTML file <span className="text-brand-rust">*</span></label>
                <input ref={fileInputRef} type="file" accept=".html,text/html" className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHtmlFile(f); }} />
                {!customHtml ? (
                  <div onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleHtmlFile(f); }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${dragOver ? 'border-brand-rust bg-brand-rust/5' : 'border-brand-rule hover:border-brand-rust/40 hover:bg-[#FAF7F2]'}`}>
                    <p className="text-brand-ink font-medium text-sm mb-1">Drop your .html file here</p>
                    <p className="text-brand-muted text-xs">or click to browse</p>
                  </div>
                ) : (
                  <div className="border border-brand-rule rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-brand-rust/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-brand-rust">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-brand-ink truncate">{htmlFileName}</p>
                        <p className="text-xs text-brand-muted">{(customHtml.length / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button type="button" onClick={() => { setCustomHtml(''); setHtmlFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-xs text-brand-muted hover:text-red-500 transition-colors flex-shrink-0">Remove</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: recipients + actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-brand-rule p-5 sm:p-6 space-y-3">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium">Recipients</p>

            {/* Audience brand narrows whichever mode is chosen below. Leaving
                both unchecked means no brand filter at all, which is exactly how
                every campaign behaved before contacts carried a brand. */}
            <div className="pb-1">
              <p className="text-xs text-brand-muted mb-1.5">Limit to brand</p>
              <div className="flex gap-4">
                {(['townies', 'goodkicks'] as RealBrand[]).map((b) => (
                  <label key={b} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={audienceBrands.has(b)}
                      onChange={() => toggleAudienceBrand(b)}
                      className="accent-brand-rust"
                    />
                    {BRAND_LABELS[b]}
                  </label>
                ))}
              </div>
              {audienceBrands.size === 0 && (
                <p className="text-[11px] text-brand-muted mt-1">No filter — every brand.</p>
              )}
            </div>

            {([['all', 'All contacts', audienceCount], ['segment', 'By segment', null], ['individual', 'Pick contacts', null]] as const).map(([m, label, badge]) => (
              <div key={m}>
                <label className="flex items-center gap-3 cursor-pointer py-0.5">
                  <input type="radio" name="recip" checked={recipientMode === m} onChange={() => setRecipientMode(m)} className="accent-brand-rust" />
                  <span className="text-sm text-brand-ink font-medium">{label}</span>
                  {badge !== null && <span className="ml-auto text-xs bg-[#F0EAD9] px-2 py-0.5 rounded-full text-brand-muted font-medium">{badge}</span>}
                  {m === 'individual' && recipientMode === 'individual' && selectedEmails.size > 0 && (
                    <span className="ml-auto text-xs bg-brand-rust/10 text-brand-rust px-2 py-0.5 rounded-full font-medium">{selectedEmails.size} selected</span>
                  )}
                </label>

                {m === 'segment' && recipientMode === 'segment' && (
                  <div className="pl-6 space-y-2 pt-1 pb-1">
                    {ALL_SOURCES.map((src) => {
                      const sc = sourceCounts.find((s) => s.source === src);
                      return (
                        <label key={src} className="flex items-center gap-2.5 cursor-pointer">
                          <input type="checkbox" checked={selectedSources.has(src)} onChange={() => toggleSource(src)} className="accent-brand-rust" />
                          <span className="text-sm text-brand-ink">{SOURCE_LABELS[src]}</span>
                          <span className="ml-auto text-xs text-brand-muted">{sc?.count ?? 0}</span>
                        </label>
                      );
                    })}
                  </div>
                )}

                {m === 'individual' && recipientMode === 'individual' && (
                  <div className="pt-2 pb-1 space-y-2">
                    <input type="text" value={contactSearch} onChange={(e) => setContactSearch(e.target.value)} placeholder="Search name or email…"
                      className="w-full border border-brand-rule rounded-lg px-3 py-2 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust" />
                    {filteredContacts.length > 0 && (
                      <button type="button" onClick={toggleAllFiltered} className="text-xs text-brand-rust hover:underline">
                        {filteredContacts.every((c) => selectedEmails.has(c.email)) ? 'Deselect all' : `Select all (${filteredContacts.length})`}
                      </button>
                    )}
                    <div className="max-h-52 overflow-y-auto border border-brand-rule rounded-lg divide-y divide-brand-rule">
                      {filteredContacts.length === 0
                        ? <p className="px-3 py-3 text-sm text-brand-muted text-center">No contacts found.</p>
                        : filteredContacts.map((c) => (
                          <label key={c.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#FAF7F2] cursor-pointer">
                            <input type="checkbox" checked={selectedEmails.has(c.email)} onChange={() => toggleEmail(c.email)} className="accent-brand-rust flex-shrink-0" />
                            <div className="min-w-0">
                              {c.name && <p className="text-sm text-brand-ink leading-tight truncate">{c.name}</p>}
                              <p className="text-xs text-brand-muted truncate">{c.email}</p>
                            </div>
                          </label>
                        ))
                      }
                    </div>
                  </div>
                )}
              </div>
            ))}

            <div className="border-t border-brand-rule pt-3 flex items-center justify-between">
              <span className="text-sm text-brand-muted">Sending to</span>
              <span className="text-sm font-semibold text-brand-ink">{count} contact{count !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <div className="flex gap-2">
              <button onClick={() => setPreviewOpen(true)}
                className="flex-1 bg-white border border-brand-rule rounded-lg px-4 py-2.5 text-sm text-brand-ink font-medium hover:bg-[#FAF7F2] transition-colors">
                Preview
              </button>
              <button onClick={saveDraft} disabled={saveStatus === 'saving'}
                className="flex-1 bg-white border border-brand-rule rounded-lg px-4 py-2.5 text-sm text-brand-ink font-medium hover:bg-[#FAF7F2] transition-colors disabled:opacity-50">
                {saveStatus === 'saving' ? 'Saving…' : saveStatus === 'saved' ? 'Saved ✓' : 'Save Draft'}
              </button>
            </div>
            {saveStatus === 'error' && <p className="text-xs text-red-500">{saveError}</p>}

            {!confirming ? (
              <button onClick={() => setConfirming(true)} disabled={!isValid() || sendStatus.type === 'sending' || count === 0}
                className="w-full bg-brand-rust text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-brand-rust/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                {sendStatus.type === 'sending' ? 'Sending…' : `Send to ${count} contact${count !== 1 ? 's' : ''} →`}
              </button>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-amber-800 font-medium">Send to {count} contacts? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={handleSend} className="flex-1 bg-brand-rust text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-rust/90 transition-colors">Yes, send it</button>
                  <button onClick={() => setConfirming(false)} className="flex-1 bg-white border border-brand-rule rounded-lg px-3 py-2 text-sm text-brand-ink hover:bg-[#FAF7F2] transition-colors">Cancel</button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={(e) => { if (e.target === e.currentTarget) setPreviewOpen(false); }}>
          <div className="min-h-full bg-black/75 flex flex-col items-center py-6 px-4">
            {/* Controls bar */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-4">
              <div className="flex gap-1 bg-white/10 rounded-lg p-0.5">
                {(['desktop', 'mobile'] as Device[]).map((d) => (
                  <button key={d} onClick={() => setPreviewDevice(d)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors flex items-center gap-1.5 ${previewDevice === d ? 'bg-white text-brand-ink' : 'text-white/60 hover:text-white'}`}>
                    {d === 'desktop'
                      ? <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
                      : <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><rect x="5" y="2" width="14" height="20" rx="2"/><line x1="12" y1="18" x2="12.01" y2="18"/></svg>}
                    {d === 'desktop' ? 'Desktop' : 'Mobile'}
                  </button>
                ))}
              </div>
              <button onClick={() => setPreviewOpen(false)}
                className="bg-white/10 hover:bg-white/20 text-white rounded-full w-8 h-8 flex items-center justify-center text-lg leading-none transition-colors">×</button>
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
                      {subject && <div className="bg-[#FAF7F2] border-b border-[#E5DDD0] px-5 py-3">
                        <p className="text-xs text-[#78716C]"><strong className="text-[#1C1917]">Subject:</strong> {subject}</p>
                        {preheader && <p className="text-xs text-[#78716C] mt-1"><strong className="text-[#1C1917]">Preview:</strong> {preheader}</p>}
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
