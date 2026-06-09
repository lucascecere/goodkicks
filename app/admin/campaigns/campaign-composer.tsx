'use client';

import { useState, useMemo, useRef } from 'react';

const ALL_SOURCES = ['order', 'newsletter', 'discount', 'ambassador', 'contact'] as const;
type Source = typeof ALL_SOURCES[number];

const SOURCE_LABELS: Record<Source, string> = {
  order: 'Customers (orders)',
  newsletter: 'Newsletter sign-ups',
  discount: 'Discount wheel',
  ambassador: 'Ambassadors',
  contact: 'Contact form',
};

interface SourceCount { source: string; count: number; }
interface Contact { id: string; name: string | null; email: string; }

interface Props {
  totalContacts: number;
  sourceCounts: SourceCount[];
  contacts: Contact[];
}

type Mode = 'all' | 'segment' | 'individual';
type ContentMode = 'compose' | 'html';

function buildPreviewHtml(subject: string, headline: string, bodyText: string, ctaText: string, ctaUrl: string, preheader: string): string {
  const paragraphs = bodyText
    .split(/\n\n+/)
    .map((p) => p.trim().replace(/\n/g, '<br/>'))
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 18px;color:#57534E;line-height:1.75;font-size:15px">${p}</p>`)
    .join('');

  const cta =
    ctaText && ctaUrl
      ? `<div style="margin:32px 0"><a href="${ctaUrl}" style="background:#C0541A;color:#fff;padding:14px 28px;border-radius:6px;text-decoration:none;font-weight:600;font-size:15px;display:inline-block">${ctaText}</a></div>`
      : '';

  return `
    <div style="background:#F5EFE3;padding:24px 0;min-height:100%">
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:580px;margin:0 auto;background:#FFFDF8;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.12)">
        ${subject ? `<div style="background:#FAF7F2;border-bottom:1px solid #E5DDD0;padding:12px 28px"><p style="margin:0;font-size:12px;color:#78716C"><strong style="color:#1C1917">Subject:</strong> ${subject}</p>${preheader ? `<p style="margin:4px 0 0;font-size:12px;color:#78716C"><strong style="color:#1C1917">Preview:</strong> ${preheader}</p>` : ''}</div>` : ''}
        <div style="background:#C0541A;padding:22px 32px">
          <span style="font-family:Georgia,'Times New Roman',serif;font-size:24px;color:#fff;font-weight:bold">good kicks.</span>
        </div>
        <div style="padding:36px 32px">
          <h1 style="font-family:Georgia,'Times New Roman',serif;font-size:28px;margin:0 0 22px;color:#1C1917;font-weight:normal;line-height:1.3">${headline || '<span style="color:#A8A29E">(headline here)</span>'}</h1>
          ${paragraphs || '<p style="color:#A8A29E;font-size:15px">(body text here)</p>'}
          ${cta}
        </div>
        <div style="border-top:1px solid #E5DDD0;padding:22px 32px;background:#FAF7F2">
          <p style="color:#78716C;font-size:12px;margin:0;line-height:1.7">Good Kicks · <a href="https://goodkicks.co" style="color:#C0541A;text-decoration:none">goodkicks.co</a><br/>You received this because you signed up or placed an order.<br/><a href="#" style="color:#78716C">Unsubscribe</a></p>
        </div>
      </div>
    </div>`;
}

export function CampaignComposer({ totalContacts, sourceCounts, contacts }: Props) {
  const [subject, setSubject] = useState('');
  const [preheader, setPreheader] = useState('');
  const [headline, setHeadline] = useState('');
  const [bodyText, setBodyText] = useState('');
  const [ctaText, setCtaText] = useState('');
  const [ctaUrl, setCtaUrl] = useState('');
  const [contentMode, setContentMode] = useState<ContentMode>('compose');
  const [customHtml, setCustomHtml] = useState('');
  const [htmlFileName, setHtmlFileName] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [mode, setMode] = useState<Mode>('all');
  const [selectedSources, setSelectedSources] = useState<Set<Source>>(new Set());
  const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
  const [contactSearch, setContactSearch] = useState('');

  const [previewOpen, setPreviewOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [status, setStatus] = useState<{ type: 'idle' | 'sending' | 'done' | 'error'; message?: string }>({ type: 'idle' });

  const filteredContacts = useMemo(() => {
    const q = contactSearch.toLowerCase().trim();
    if (!q) return contacts;
    return contacts.filter(
      (c) => c.email.toLowerCase().includes(q) || c.name?.toLowerCase().includes(q)
    );
  }, [contacts, contactSearch]);

  function toggleSource(source: Source) {
    const next = new Set(selectedSources);
    next.has(source) ? next.delete(source) : next.add(source);
    setSelectedSources(next);
  }

  function toggleEmail(email: string) {
    const next = new Set(selectedEmails);
    next.has(email) ? next.delete(email) : next.add(email);
    setSelectedEmails(next);
  }

  function handleHtmlFile(file: File) {
    if (!file.name.endsWith('.html') && file.type !== 'text/html') {
      alert('Please upload an .html file.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      setCustomHtml(e.target?.result as string ?? '');
      setHtmlFileName(file.name);
    };
    reader.readAsText(file);
  }

  function toggleAllFiltered() {
    const allSelected = filteredContacts.every((c) => selectedEmails.has(c.email));
    const next = new Set(selectedEmails);
    if (allSelected) {
      filteredContacts.forEach((c) => next.delete(c.email));
    } else {
      filteredContacts.forEach((c) => next.add(c.email));
    }
    setSelectedEmails(next);
  }

  function recipientCount(): number {
    if (mode === 'all') return totalContacts;
    if (mode === 'individual') return selectedEmails.size;
    if (selectedSources.size === 0) return 0;
    const selected = [...selectedSources];
    return sourceCounts
      .filter((s) => selected.includes(s.source as Source))
      .reduce((sum, s) => sum + s.count, 0);
  }

  function isValid() {
    const hasRecipients =
      mode === 'all' ||
      (mode === 'segment' && selectedSources.size > 0) ||
      (mode === 'individual' && selectedEmails.size > 0);
    const hasContent =
      contentMode === 'html' ? !!customHtml : (!!headline.trim() && !!bodyText.trim());
    return subject.trim() && hasContent && hasRecipients;
  }

  async function handleSend() {
    setConfirming(false);
    setStatus({ type: 'sending' });

    const payload: Record<string, unknown> = {
      subject: subject.trim(),
      preheader: preheader.trim() || undefined,
    };
    if (contentMode === 'html') {
      payload.customHtml = customHtml;
    } else {
      payload.headline = headline.trim();
      payload.bodyText = bodyText.trim();
      payload.ctaText = ctaText.trim() || undefined;
      payload.ctaUrl = ctaUrl.trim() || undefined;
    }
    if (mode === 'segment') payload.sources = [...selectedSources];
    if (mode === 'individual') payload.emails = [...selectedEmails];

    try {
      const res = await fetch('/api/admin/send-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) {
        setStatus({ type: 'error', message: json.error ?? 'Send failed' });
      } else {
        setStatus({ type: 'done', message: `Sent to ${json.sent} contacts${json.failed > 0 ? ` (${json.failed} failed)` : ''}.` });
      }
    } catch {
      setStatus({ type: 'error', message: 'Network error — try again.' });
    }
  }

  const count = recipientCount();

  return (
    <div className="p-6 sm:p-8 max-w-5xl space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-white">Campaign Builder</h1>
        <p className="text-white/40 text-sm mt-1">compose and send a marketing email to your contacts</p>
      </div>

      {status.type === 'done' && (
        <div className="bg-green-900/30 border border-green-500/30 rounded-xl px-5 py-4 text-green-300 text-sm">
          {status.message}
        </div>
      )}
      {status.type === 'error' && (
        <div className="bg-red-900/30 border border-red-500/30 rounded-xl px-5 py-4 text-red-300 text-sm">
          Error: {status.message}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: Email content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-xl border border-brand-rule p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-xs uppercase tracking-widest text-brand-muted font-medium">Email Content</p>
              <div className="flex gap-1 bg-[#F0EAD9] p-0.5 rounded-lg">
                <button
                  type="button"
                  onClick={() => setContentMode('compose')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${contentMode === 'compose' ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-muted hover:text-brand-ink'}`}
                >
                  Compose
                </button>
                <button
                  type="button"
                  onClick={() => setContentMode('html')}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${contentMode === 'html' ? 'bg-white text-brand-ink shadow-sm' : 'text-brand-muted hover:text-brand-ink'}`}
                >
                  Upload HTML
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">Subject line <span className="text-brand-rust">*</span></label>
              <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g. your next foot bag is on us 🤙"
                className="w-full border border-brand-rule rounded-lg px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust" />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-ink mb-1.5">
                Preview text <span className="text-brand-muted text-xs font-normal">(shown in inbox before opening)</span>
              </label>
              <input type="text" value={preheader} onChange={(e) => setPreheader(e.target.value)}
                placeholder="e.g. The circle's been waiting for this one."
                className="w-full border border-brand-rule rounded-lg px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust" />
            </div>

            {contentMode === 'compose' ? (
              <>
                <div>
                  <label className="block text-sm font-medium text-brand-ink mb-1.5">Headline <span className="text-brand-rust">*</span></label>
                  <input type="text" value={headline} onChange={(e) => setHeadline(e.target.value)}
                    placeholder="e.g. new colorways just dropped."
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
                    <label className="block text-sm font-medium text-brand-ink mb-1.5">
                      Button text <span className="text-brand-muted text-xs font-normal">(optional)</span>
                    </label>
                    <input type="text" value={ctaText} onChange={(e) => setCtaText(e.target.value)}
                      placeholder="shop now →"
                      className="w-full border border-brand-rule rounded-lg px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-brand-ink mb-1.5">
                      Button URL <span className="text-brand-muted text-xs font-normal">(optional)</span>
                    </label>
                    <input type="url" value={ctaUrl} onChange={(e) => setCtaUrl(e.target.value)}
                      placeholder="https://goodkicks.co/shop"
                      className="w-full border border-brand-rule rounded-lg px-3 py-2.5 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust" />
                  </div>
                </div>
              </>
            ) : (
              <div>
                <label className="block text-sm font-medium text-brand-ink mb-1.5">HTML file <span className="text-brand-rust">*</span></label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,text/html"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleHtmlFile(f); }}
                />
                {!customHtml ? (
                  <div
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDragOver(false);
                      const f = e.dataTransfer.files[0];
                      if (f) handleHtmlFile(f);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors ${
                      dragOver ? 'border-brand-rust bg-brand-rust/5' : 'border-brand-rule hover:border-brand-rust/40 hover:bg-[#FAF7F2]'
                    }`}
                  >
                    <p className="text-brand-ink font-medium text-sm mb-1">Drop your .html file here</p>
                    <p className="text-brand-muted text-xs">or click to browse</p>
                  </div>
                ) : (
                  <div className="border border-brand-rule rounded-xl p-4 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 bg-brand-rust/10 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4 text-brand-rust">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                          <polyline points="14,2 14,8 20,8"/>
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-brand-ink truncate">{htmlFileName}</p>
                        <p className="text-xs text-brand-muted">{(customHtml.length / 1024).toFixed(1)} KB</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setCustomHtml(''); setHtmlFileName(''); if (fileInputRef.current) fileInputRef.current.value = ''; }}
                      className="text-xs text-brand-muted hover:text-red-500 transition-colors flex-shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right: Recipients + actions */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-brand-rule p-5 sm:p-6 space-y-3">
            <p className="text-xs uppercase tracking-widest text-brand-muted font-medium">Recipients</p>

            {/* Mode: All */}
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input type="radio" name="mode" checked={mode === 'all'} onChange={() => setMode('all')} className="accent-brand-rust" />
              <span className="text-sm text-brand-ink font-medium">All contacts</span>
              <span className="ml-auto text-xs bg-[#F0EAD9] px-2 py-0.5 rounded-full text-brand-muted font-medium">{totalContacts}</span>
            </label>

            {/* Mode: Segment */}
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input type="radio" name="mode" checked={mode === 'segment'} onChange={() => setMode('segment')} className="accent-brand-rust" />
              <span className="text-sm text-brand-ink font-medium">By segment</span>
            </label>
            {mode === 'segment' && (
              <div className="pl-6 space-y-2 pb-1">
                {ALL_SOURCES.map((source) => {
                  const sc = sourceCounts.find((s) => s.source === source);
                  return (
                    <label key={source} className="flex items-center gap-2.5 cursor-pointer">
                      <input type="checkbox" checked={selectedSources.has(source)} onChange={() => toggleSource(source)} className="accent-brand-rust" />
                      <span className="text-sm text-brand-ink">{SOURCE_LABELS[source]}</span>
                      <span className="ml-auto text-xs text-brand-muted">{sc?.count ?? 0}</span>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Mode: Individual */}
            <label className="flex items-center gap-3 cursor-pointer py-1">
              <input type="radio" name="mode" checked={mode === 'individual'} onChange={() => setMode('individual')} className="accent-brand-rust" />
              <span className="text-sm text-brand-ink font-medium">Pick contacts</span>
              {mode === 'individual' && selectedEmails.size > 0 && (
                <span className="ml-auto text-xs bg-brand-rust/10 text-brand-rust px-2 py-0.5 rounded-full font-medium">{selectedEmails.size} selected</span>
              )}
            </label>
            {mode === 'individual' && (
              <div className="pl-0 space-y-2 pb-1">
                <input
                  type="text"
                  value={contactSearch}
                  onChange={(e) => setContactSearch(e.target.value)}
                  placeholder="Search name or email…"
                  className="w-full border border-brand-rule rounded-lg px-3 py-2 text-sm text-brand-ink placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-rust/30 focus:border-brand-rust"
                />
                {filteredContacts.length > 0 && (
                  <button
                    type="button"
                    onClick={toggleAllFiltered}
                    className="text-xs text-brand-rust hover:underline"
                  >
                    {filteredContacts.every((c) => selectedEmails.has(c.email)) ? 'Deselect all' : `Select all ${filteredContacts.length > contacts.length ? 'filtered' : ''} (${filteredContacts.length})`}
                  </button>
                )}
                <div className="max-h-52 overflow-y-auto border border-brand-rule rounded-lg divide-y divide-brand-rule">
                  {filteredContacts.length === 0 ? (
                    <p className="px-3 py-3 text-sm text-brand-muted text-center">No contacts found.</p>
                  ) : (
                    filteredContacts.map((c) => (
                      <label key={c.id} className="flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#FAF7F2] cursor-pointer">
                        <input type="checkbox" checked={selectedEmails.has(c.email)} onChange={() => toggleEmail(c.email)} className="accent-brand-rust flex-shrink-0" />
                        <div className="min-w-0">
                          {c.name && <p className="text-sm text-brand-ink leading-tight truncate">{c.name}</p>}
                          <p className="text-xs text-brand-muted truncate">{c.email}</p>
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-brand-rule pt-3 flex items-center justify-between">
              <span className="text-sm text-brand-muted">Sending to</span>
              <span className="text-sm font-semibold text-brand-ink">{count} contact{count !== 1 ? 's' : ''}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="space-y-2.5">
            <button
              onClick={() => setPreviewOpen(true)}
              className="w-full bg-white border border-brand-rule rounded-lg px-4 py-2.5 text-sm text-brand-ink font-medium hover:bg-[#FAF7F2] transition-colors"
            >
              Preview email
            </button>

            {!confirming ? (
              <button
                onClick={() => setConfirming(true)}
                disabled={!isValid() || status.type === 'sending' || count === 0}
                className="w-full bg-brand-rust text-white rounded-lg px-4 py-2.5 text-sm font-medium hover:bg-brand-rust/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {status.type === 'sending' ? 'Sending…' : `Send to ${count} contact${count !== 1 ? 's' : ''} →`}
              </button>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                <p className="text-sm text-amber-800 font-medium">Send to {count} contacts? This cannot be undone.</p>
                <div className="flex gap-2">
                  <button onClick={handleSend} className="flex-1 bg-brand-rust text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-rust/90 transition-colors">
                    Yes, send it
                  </button>
                  <button onClick={() => setConfirming(false)} className="flex-1 bg-white border border-brand-rule rounded-lg px-3 py-2 text-sm text-brand-ink hover:bg-[#FAF7F2] transition-colors">
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview modal */}
      {previewOpen && (
        <div
          className="fixed inset-0 z-50 overflow-y-auto"
          onClick={(e) => { if (e.target === e.currentTarget) setPreviewOpen(false); }}
        >
          <div className="min-h-full bg-black/70 flex items-start justify-center py-8 px-4">
            <div className="relative w-full max-w-2xl">
              <button
                onClick={() => setPreviewOpen(false)}
                className="absolute -top-3 right-0 z-10 bg-white text-brand-muted hover:text-brand-ink rounded-full w-8 h-8 flex items-center justify-center shadow-lg text-lg leading-none transition-colors"
                aria-label="Close preview"
              >
                ×
              </button>
              {contentMode === 'html' && customHtml ? (
                <div className="bg-white rounded-xl overflow-hidden shadow-2xl">
                  {subject && (
                    <div className="bg-[#FAF7F2] border-b border-[#E5DDD0] px-5 py-3">
                      <p className="text-xs text-[#78716C]"><strong className="text-[#1C1917]">Subject:</strong> {subject}</p>
                      {preheader && <p className="text-xs text-[#78716C] mt-1"><strong className="text-[#1C1917]">Preview:</strong> {preheader}</p>}
                    </div>
                  )}
                  <iframe
                    srcDoc={customHtml}
                    className="w-full border-0"
                    style={{ height: '600px' }}
                    title="Email preview"
                    sandbox="allow-same-origin"
                  />
                </div>
              ) : (
                <div
                  dangerouslySetInnerHTML={{
                    __html: buildPreviewHtml(subject, headline, bodyText, ctaText, ctaUrl, preheader),
                  }}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
