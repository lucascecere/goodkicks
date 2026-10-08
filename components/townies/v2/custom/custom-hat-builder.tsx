'use client';

import { useCallback, useEffect, useId, useRef, useState, type ChangeEvent, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { fieldClass, labelClass } from '@/components/forms/form-kit';
import { FRONT_BOUNDS, FrontHat, SIDE_BOUNDS, SideHat, type HatStyleId, type Placed, type SideMark } from './hat-art';
import { LOGO_MAX_BYTES, LOGO_TYPES, logoForUpload, normaliseLogo, removeWhite, renderMockup } from './image-utils';
import { BLANKS, BLANK_BRANDS, blankById, type Colorway } from '@/lib/townies/blanks';

/* ---------- options ---------- */



const COLOURS = [
  { name: 'Natural', hex: '#EDE6D6' },
  { name: 'White', hex: '#F7F6F2' },
  { name: 'Black', hex: '#1F1F1F' },
  { name: 'Navy', hex: '#1B2433' },
  { name: 'Forest', hex: '#2F4F3A' },
  { name: 'Maroon', hex: '#5C1F2B' },
  { name: 'Royal blue', hex: '#2A4C9C' },
  { name: 'Grey', hex: '#8D9094' },
  { name: 'Khaki', hex: '#C3AE87' },
];

const THREADS = [
  { name: 'White', hex: '#FFFFFF' },
  { name: 'Natural', hex: '#EDE6D6' },
  { name: 'Navy', hex: '#1B2433' },
  { name: 'Black', hex: '#1F1F1F' },
  { name: 'Forest', hex: '#2F4F3A' },
  { name: 'Maroon', hex: '#5C1F2B' },
  { name: 'Gold', hex: '#C9A24A' },
];

const QUANTITIES = ['25 to 49', '50 to 99', '100 to 199', '200+'];

const hexOf = (name: string, list = COLOURS) => list.find((c) => c.name === name)?.hex ?? '#EDE6D6';
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

type Logo = { file: File; src: string; aspect: number; clean: string | null };

/* ---------- small pieces ---------- */

function Step({ n, title, children, hint }: { n: string; title: string; children: ReactNode; hint?: ReactNode }) {
  return (
    <fieldset className="border-t border-rule pt-6">
      <legend className="contents">
        <span className="flex items-baseline gap-3">
          <span className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted">{n}</span>
          <span className="font-label text-[1.0625rem] font-bold text-text">{title}</span>
        </span>
      </legend>
      <div className="mt-4">{children}</div>
      {hint && <p className="mt-3 text-[0.8125rem] leading-relaxed text-muted">{hint}</p>}
    </fieldset>
  );
}

function BlankPicker({ value, onChange }: { value: string; onChange: (id: string) => void }) {
  const current = blankById(value);
  const [brand, setBrand] = useState<string>(current.brand);
  const models = BLANKS.filter((b) => b.brand === brand);
  return (
    <div>
      <div role="tablist" aria-label="Maker" className="mb-3 flex gap-1">
        {BLANK_BRANDS.map((b) => (
          <button
            key={b}
            type="button"
            role="tab"
            aria-selected={brand === b}
            onClick={() => {
              setBrand(b);
              const first = BLANKS.find((m) => m.brand === b);
              if (first && current.brand !== b) onChange(first.id);
            }}
            className={`font-label px-4 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
              brand === b ? 'bg-text text-white' : 'border border-rule text-text hover:border-text'
            }`}
          >
            {b}
          </button>
        ))}
      </div>
      <div role="radiogroup" aria-label="Hat" className="grid gap-2 sm:grid-cols-2">
        {models.map((m) => {
          const on = m.id === value;
          return (
            <label
              key={m.id}
              className={`block cursor-pointer border p-3.5 transition-colors focus-within:ring-2 focus-within:ring-[#2F4F3A] ${
                on ? 'border-text bg-[#F1EEE8]' : 'border-rule hover:border-text/50'
              }`}
            >
              <input type="radio" name="blank" value={m.id} checked={on} onChange={() => onChange(m.id)} className="sr-only" />
              <span className="flex items-baseline justify-between gap-2">
                <span className="text-[0.9375rem] font-semibold text-text">{m.brand} {m.model}</span>
                <span className="font-label text-[0.625rem] font-semibold uppercase tracking-[0.12em] text-muted">
                  {m.colorways.length} colours
                </span>
              </span>
              <span className="mt-1 block text-[0.8125rem] leading-snug text-muted">{m.short}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ColorwayPicker({
  list,
  value,
  onChange,
}: {
  list: Colorway[];
  value: string;
  onChange: (v: string) => void;
}) {
  // Split swatch: front panel left, brim lower right, mesh/back upper right.
  return (
    <div>
      <p className="font-label mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">
        Selected <span className="ml-1 normal-case tracking-normal text-text">{value}</span>
      </p>
      <div role="radiogroup" aria-label="Colourway" className="flex max-h-[232px] flex-wrap gap-2 overflow-y-auto p-1">
        {list.map((c) => {
          const checked = c.name === value;
          return (
            <label key={c.name} title={c.name} className="relative cursor-pointer">
              <input type="radio" name="colorway" value={c.name} checked={checked} onChange={() => onChange(c.name)} className="peer sr-only" />
              <span className="sr-only">{c.name}</span>
              <span
                aria-hidden
                className={`grid h-9 w-9 grid-cols-2 grid-rows-2 overflow-hidden rounded-full border border-black/15 ring-offset-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#2F4F3A] ${checked ? 'ring-2 ring-text' : ''}`}
              >
                <span className="row-span-2" style={{ background: c.front }} />
                <span style={{ background: c.back }} />
                <span style={{ background: c.brim }} />
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function Swatches({
  name,
  value,
  onChange,
  list = COLOURS,
  label,
}: {
  name: string;
  value: string;
  onChange: (v: string) => void;
  list?: { name: string; hex: string }[];
  label: string;
}) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="font-label mb-2 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">
        {label} <span className="ml-1 normal-case tracking-normal text-text">{value}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        {list.map((c) => {
          const checked = c.name === value;
          return (
            <label key={c.name} className="relative cursor-pointer" title={c.name}>
              <input
                type="radio"
                name={name}
                value={c.name}
                checked={checked}
                onChange={() => onChange(c.name)}
                className="peer sr-only"
              />
              <span className="sr-only">{c.name}</span>
              <span
                aria-hidden
                className={`block h-9 w-9 rounded-full border border-black/15 ring-offset-2 transition peer-focus-visible:ring-2 peer-focus-visible:ring-[#2F4F3A] ${
                  checked ? 'ring-2 ring-text' : ''
                }`}
                style={{ background: c.hex }}
              />
            </label>
          );
        })}
      </div>
    </div>
  );
}

function Toggle({ id, label, checked, onChange }: { id: string; label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center gap-3 text-[0.9375rem] text-text">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-[#2F4F3A]"
      />
      {label}
    </label>
  );
}

function Range({
  id,
  label,
  value,
  min,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <label htmlFor={id} className="font-label mb-1 block text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-muted">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[#2F4F3A]"
      />
    </div>
  );
}

const btnSolid =
  'font-label inline-flex items-center justify-center bg-text px-7 py-4 text-[0.75rem] font-semibold uppercase tracking-[0.16em] text-white transition-colors hover:bg-[#2F4F3A] disabled:opacity-60';
const btnOutline =
  'font-label inline-flex items-center justify-center border border-text px-5 py-3 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] text-text transition-colors hover:bg-text hover:text-white disabled:opacity-50';

function FilePick({
  id,
  label,
  onFile,
  current,
  onClear,
}: {
  id: string;
  label: string;
  onFile: (f: File) => void;
  current?: string;
  onClear?: () => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <label htmlFor={id} className={`${btnOutline} cursor-pointer focus-within:ring-2 focus-within:ring-[#2F4F3A]`}>
        {current ? 'Replace file' : label}
        <input
          id={id}
          type="file"
          accept=".png,.jpg,.jpeg,.svg,image/png,image/jpeg,image/svg+xml"
          className="sr-only"
          onChange={(e: ChangeEvent<HTMLInputElement>) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = '';
          }}
        />
      </label>
      {current && (
        <span className="flex min-w-0 items-center gap-2 text-[0.875rem] text-muted">
          <span className="max-w-[12rem] truncate">{current}</span>
          {onClear && (
            <button type="button" onClick={onClear} className="underline underline-offset-4 hover:text-text">
              Remove
            </button>
          )}
        </span>
      )}
    </div>
  );
}

/* ---------- the builder ---------- */

export function CustomHatBuilder({ howItWorks }: { howItWorks?: ReactNode }) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const frontRef = useRef<SVGSVGElement>(null);
  const sideRef = useRef<SVGSVGElement>(null);
  const crownRef = useRef<SVGGElement>(null);

  // Real blanks and their real colourways only (lib/townies/blanks.ts).
  const [blankId, setBlankId] = useState(BLANKS[0].id);
  const [colorwayByBlank, setColorwayByBlank] = useState<Record<string, string>>({});
  const blank = blankById(blankId);
  const style: HatStyleId = blank.profile;
  const [view, setView] = useState<'front' | 'side'>('front');

  const [logo, setLogo] = useState<Logo | null>(null);
  const [pos, setPos] = useState({ x: 288, y: 258 });
  const [width, setWidth] = useState(150);
  const [removeBg, setRemoveBg] = useState(false);
  const [stitched, setStitched] = useState(true);
  const [dragging, setDragging] = useState(false);

  const [sideKind, setSideKind] = useState<'none' | 'text' | 'logo'>('none');
  const [sideText, setSideText] = useState('');
  const [sideThread, setSideThread] = useState('White');
  const [sideSize, setSideSize] = useState(34);
  const [sideLogo, setSideLogo] = useState<Logo | null>(null);
  const [sideW, setSideW] = useState(80);

  const [fileError, setFileError] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'done' | 'error'>('idle');
  const [serverError, setServerError] = useState('');
  const [mockupUrl, setMockupUrl] = useState<string | null>(null);

  const colorway =
    blank.colorways.find((c) => c.name === colorwayByBlank[blank.id]) ?? blank.colorways[0];
  const crown = colorway.front;
  const brim = colorway.brim;
  const back = colorway.back !== colorway.front ? colorway.back : undefined;
  const colourLine = colorway.name;
  const hatLine = `${blank.brand} ${blank.model}`;

  // White-background knockout is computed once per logo, the first time it is asked for.
  useEffect(() => {
    if (!removeBg) return;
    let live = true;
    if (logo && !logo.clean) removeWhite(logo.src).then((clean) => live && setLogo((l) => (l ? { ...l, clean } : l)));
    if (sideLogo && !sideLogo.clean)
      removeWhite(sideLogo.src).then((clean) => live && setSideLogo((l) => (l ? { ...l, clean } : l)));
    return () => {
      live = false;
    };
  }, [removeBg, logo, sideLogo]);

  useEffect(() => () => {
    if (mockupUrl) URL.revokeObjectURL(mockupUrl);
  }, [mockupUrl]);

  async function readLogo(f: File): Promise<Logo | null> {
    setFileError('');
    if (!LOGO_TYPES.includes(f.type)) {
      setFileError('That file type will not work here. Use a PNG, JPG or SVG.');
      return null;
    }
    if (f.size > LOGO_MAX_BYTES) {
      setFileError('That file is over 5MB. A smaller export of the same logo is plenty.');
      return null;
    }
    try {
      const { src, aspect } = await normaliseLogo(f);
      return { file: f, src, aspect, clean: null };
    } catch {
      setFileError('We could not open that file. Try a PNG export of the logo.');
      return null;
    }
  }

  async function onFrontFile(f: File) {
    const l = await readLogo(f);
    if (!l) return;
    setLogo(l);
    setView('front');
    setPos({ x: 288, y: 258 });
    // Wide logos start at 150 wide, tall ones are kept to about 130 high.
    setWidth(Math.round(clamp(Math.min(140, 110 * l.aspect), FRONT_BOUNDS.minW, FRONT_BOUNDS.maxW)));
  }

  async function onSideFile(f: File) {
    const l = await readLogo(f);
    if (!l) return;
    setSideLogo(l);
    setView('side');
    setSideW(Math.round(clamp(Math.min(80, 70 * l.aspect), SIDE_BOUNDS.minW, SIDE_BOUNDS.maxW)));
  }

  const frontPlaced: Placed | null = logo
    ? { src: removeBg && logo.clean ? logo.clean : logo.src, aspect: logo.aspect, x: pos.x, y: pos.y, w: width }
    : null;

  const sideMark: SideMark =
    sideKind === 'text' && sideText.trim()
      ? { kind: 'text', text: sideText, thread: hexOf(sideThread, THREADS), size: sideSize }
      : sideKind === 'logo' && sideLogo
        ? {
            kind: 'logo',
            logo: {
              src: removeBg && sideLogo.clean ? sideLogo.clean : sideLogo.src,
              aspect: sideLogo.aspect,
              x: SIDE_BOUNDS.cx,
              y: SIDE_BOUNDS.cy,
              w: sideW,
            },
          }
        : { kind: 'none' };

  /* ----- moving the logo ----- */

  const toLocal = useCallback((clientX: number, clientY: number) => {
    const g = crownRef.current;
    const m = g?.getScreenCTM();
    if (!m) return null;
    return new DOMPoint(clientX, clientY).matrixTransform(m.inverse());
  }, []);

  function onLogoPointerDown(e: PointerEvent<SVGGElement>) {
    e.preventDefault();
    const start = toLocal(e.clientX, e.clientY);
    if (!start) return;
    const dx = start.x - pos.x;
    const dy = start.y - pos.y;
    const pointerId = e.pointerId;
    setDragging(true);
    const move = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      const p = toLocal(ev.clientX, ev.clientY);
      if (!p) return;
      setPos({
        x: clamp(p.x - dx, FRONT_BOUNDS.minX, FRONT_BOUNDS.maxX),
        y: clamp(p.y - dy, FRONT_BOUNDS.minY, FRONT_BOUNDS.maxY),
      });
    };
    const up = (ev: globalThis.PointerEvent) => {
      if (ev.pointerId !== pointerId) return;
      setDragging(false);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
  }

  function onLogoKeyDown(e: KeyboardEvent<SVGGElement>) {
    const step = e.shiftKey ? 12 : 4;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    };
    if (moves[e.key]) {
      e.preventDefault();
      const [dx, dy] = moves[e.key];
      setPos((p) => ({
        x: clamp(p.x + dx, FRONT_BOUNDS.minX, FRONT_BOUNDS.maxX),
        y: clamp(p.y + dy, FRONT_BOUNDS.minY, FRONT_BOUNDS.maxY),
      }));
    } else if (e.key === '+' || e.key === '=' || e.key === '-') {
      e.preventDefault();
      setWidth((w) => clamp(w + (e.key === '-' ? -6 : 6), FRONT_BOUNDS.minW, FRONT_BOUNDS.maxW));
    }
  }

  /* ----- export + submit ----- */

  const caption = () => [
    `${hatLine} · ${colourLine}`,
    'Mockup for a quote. Colours are approximate; thread colours and stitch count confirmed with your price.',
  ];

  async function makeMockup() {
    if (!frontRef.current) throw new Error('no svg');
    return renderMockup({
      front: frontRef.current,
      side: sideMark.kind !== 'none' ? sideRef.current : null,
      caption: caption(),
    });
  }

  async function download() {
    try {
      const blob = await makeMockup();
      const url = URL.createObjectURL(blob);
      setMockupUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      const a = document.createElement('a');
      a.href = url;
      a.download = 'townies-custom-hat-mockup.png';
      a.click();
    } catch {
      setFileError('The mockup did not render. Try again, or send the form and we will draw it up.');
    }
  }

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setServerError('');
    try {
      const fd = new FormData(e.currentTarget);
      fd.set('style', `${blank.brand} ${blank.model} (${blank.name})`);
      fd.set('colours', colourLine);
      fd.set(
        'frontLogo',
        logo
          ? `${logo.file.name}, about ${Math.round((width / 250) * 100)}% of the front panel width${removeBg ? ', white background removed' : ''}`
          : 'No logo uploaded',
      );
      fd.set(
        'sidePlacement',
        sideMark.kind === 'text'
          ? `Text "${sideText.trim().slice(0, 18)}" in ${sideThread} thread`
          : sideMark.kind === 'logo' && sideLogo
            ? `Second logo: ${sideLogo.file.name}`
            : 'None',
      );

      const blob = await makeMockup();
      fd.set('mockup', blob, 'townies-mockup.png');
      const url = URL.createObjectURL(blob);
      setMockupUrl((old) => {
        if (old) URL.revokeObjectURL(old);
        return url;
      });
      if (logo) {
        const up = await logoForUpload(logo.file);
        fd.set('logo', up.file, up.name);
        if (up.resized) fd.set('logoResized', 'yes');
      }
      if (sideMark.kind === 'logo' && sideLogo) {
        const up = await logoForUpload(sideLogo.file, 1.5 * 1024 * 1024);
        fd.set('sideLogo', up.file, up.name);
      }

      const res = await fetch('/api/custom-quote', { method: 'POST', body: fd });
      if (res.ok) {
        setStatus('done');
        document.getElementById('custom-details')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      const body = (await res.json().catch(() => null)) as { error?: string } | null;
      setServerError(body?.error ?? 'That did not go through. Try again in a minute.');
      setStatus('error');
    } catch {
      setServerError('That did not go through. Check your connection and try again.');
      setStatus('error');
    }
  }

  const today = new Date().toISOString().slice(0, 10);

  /* ----- render ----- */

  return (
    <>
      <section className="bg-white">
        <div className="mx-auto grid max-w-[1320px] gap-8 px-4 py-10 sm:px-8 sm:py-14 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:gap-14">
          {/* Stage. Phones: pinned under the header (and smaller) so the hat stays
              in view while picking blanks and colourways below it. */}
          <div className="sticky top-[4.75rem] z-20 -mx-4 bg-white px-4 pb-2 pt-2 shadow-[0_8px_12px_-12px_rgba(13,27,42,0.35)] sm:top-[5.5rem] lg:top-24 lg:mx-0 lg:self-start lg:bg-transparent lg:p-0 lg:shadow-none">
            <div className="relative bg-[#F1EEE8]">
              <div className="absolute left-3 top-3 z-10 flex border border-text/20 bg-white/70 backdrop-blur-sm" role="group" aria-label="View">
                {(['front', 'side'] as const).map((v) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={view === v}
                    onClick={() => setView(v)}
                    className={`font-label px-3.5 py-2 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors ${
                      view === v ? 'bg-text text-white' : 'text-text hover:bg-white'
                    }`}
                  >
                    {v === 'front' ? 'Front' : 'Side'}
                  </button>
                ))}
              </div>
              <FrontHat
                id={`${uid}f`}
                style={style}
                crown={crown}
                brim={brim}
                back={back}
                mesh={blank.mesh}
                stitched={stitched}
                logo={frontPlaced}
                svgRef={frontRef}
                crownRef={crownRef}
                active={dragging}
                onLogoPointerDown={onLogoPointerDown}
                onLogoKeyDown={onLogoKeyDown}
                className={`mx-auto block h-auto max-h-[32svh] w-full select-none lg:max-h-none ${view === 'front' ? '' : 'hidden'}`}
              />
              <SideHat
                id={`${uid}s`}
                style={style}
                crown={crown}
                brim={brim}
                back={back}
                mesh={blank.mesh}
                stitched={stitched}
                mark={sideMark}
                svgRef={sideRef}
                className={`mx-auto block h-auto max-h-[32svh] w-full select-none lg:max-h-none ${view === 'side' ? '' : 'hidden'}`}
              />
            </div>
            <p className="mt-2 text-[0.75rem] text-muted lg:mt-3 lg:text-[0.8125rem]">
              {view === 'front'
                ? logo
                  ? 'Drag the logo to place it. Arrow keys work too, and + or - resizes.'
                  : 'Add your logo and it lands on the front panel.'
                : 'The left side panel, for a town name, a zip code or a second logo.'}
            </p>
          </div>

          {/* Controls */}
          <div className="space-y-8">
            <Step n="01" title="Pick the hat" hint="The blanks we embroider on, from Weld, Richardson and Yupoong.">
              <BlankPicker value={blank.id} onChange={setBlankId} />
            </Step>

            <Step
              n="02"
              title="Colourway"
              hint={`${blank.colorways.length} colourways, as ${blank.brand} makes them. Colours on screen are approximate; we confirm the exact blank with your quote.`}
            >
              <ColorwayPicker
                list={blank.colorways}
                value={colorway.name}
                onChange={(v) => setColorwayByBlank((m) => ({ ...m, [blank.id]: v }))}
              />
            </Step>

            <Step
              n="03"
              title="Your logo"
              hint="PNG, JPG or SVG, up to 5MB. A logo on a transparent background works best. Direct embroidery: we'll confirm stitch count and thread colours."
            >
              <div className="space-y-5">
                <FilePick
                  id={`${uid}-logo`}
                  label="Upload your logo"
                  current={logo?.file.name}
                  onFile={onFrontFile}
                  onClear={() => setLogo(null)}
                />
                {fileError && (
                  <p role="alert" className="text-[0.875rem] text-red-700">
                    {fileError}
                  </p>
                )}
                {logo && (
                  <>
                    <Range
                      id={`${uid}-size`}
                      label="Logo size"
                      value={width}
                      min={FRONT_BOUNDS.minW}
                      max={FRONT_BOUNDS.maxW}
                      onChange={setWidth}
                    />
                    <div className="flex flex-wrap gap-x-6 gap-y-3">
                      <Toggle id={`${uid}-bg`} label="Remove white background" checked={removeBg} onChange={setRemoveBg} />
                      <Toggle id={`${uid}-stitch`} label="Stitched look" checked={stitched} onChange={setStitched} />
                    </div>
                    <button type="button" className={btnOutline} onClick={() => setPos({ x: 288, y: 258 })}>
                      Centre it
                    </button>
                  </>
                )}
              </div>
            </Step>

            <Step n="04" title="Side panel (optional)">
              <div className="space-y-5">
                <div role="radiogroup" aria-label="Side panel" className="flex flex-wrap gap-2">
                  {(
                    [
                      ['none', 'Nothing'],
                      ['text', 'Text'],
                      ['logo', 'Second logo'],
                    ] as const
                  ).map(([k, l]) => (
                    <label
                      key={k}
                      className={`font-label cursor-pointer border px-4 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.14em] transition-colors focus-within:ring-2 focus-within:ring-[#2F4F3A] ${
                        sideKind === k ? 'border-text bg-text text-white' : 'border-rule text-text hover:border-text/50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="side-kind"
                        value={k}
                        checked={sideKind === k}
                        onChange={() => {
                          setSideKind(k);
                          setView(k === 'none' ? 'front' : 'side');
                        }}
                        className="sr-only"
                      />
                      {l}
                    </label>
                  ))}
                </div>

                {sideKind === 'text' && (
                  <>
                    <div>
                      <label htmlFor={`${uid}-sidetext`} className={labelClass}>
                        Side text
                      </label>
                      <input
                        id={`${uid}-sidetext`}
                        className={fieldClass}
                        maxLength={18}
                        placeholder="EST. 1662 or 02186"
                        value={sideText}
                        onChange={(e) => setSideText(e.target.value)}
                      />
                    </div>
                    <Swatches name="thread" label="Thread" list={THREADS} value={sideThread} onChange={setSideThread} />
                    <Range id={`${uid}-sidesize`} label="Text size" value={sideSize} min={18} max={56} onChange={setSideSize} />
                  </>
                )}

                {sideKind === 'logo' && (
                  <>
                    <FilePick
                      id={`${uid}-sidelogo`}
                      label="Upload second logo"
                      current={sideLogo?.file.name}
                      onFile={onSideFile}
                      onClear={() => setSideLogo(null)}
                    />
                    {sideLogo && (
                      <Range
                        id={`${uid}-sidew`}
                        label="Side logo size"
                        value={sideW}
                        min={SIDE_BOUNDS.minW}
                        max={SIDE_BOUNDS.maxW}
                        onChange={setSideW}
                      />
                    )}
                  </>
                )}
              </div>
            </Step>

            <div className="flex flex-wrap gap-3 border-t border-rule pt-6">
              <a href="#custom-details" className={btnSolid}>
                Request a price
              </a>
              <button type="button" onClick={download} className={btnOutline}>
                Download mockup
              </button>
            </div>
          </div>
        </div>
      </section>

      {howItWorks}

      {/* Details */}
      <section id="custom-details" className="scroll-mt-24 bg-white">
        <div className="mx-auto max-w-[1320px] px-4 py-12 sm:px-8 sm:py-16">
          {status === 'done' ? (
            <div className="mx-auto max-w-xl py-10 text-center" role="status">
              <h2 className="display text-[2.25rem] text-text sm:text-[3rem]">Got it.</h2>
              <p className="mt-3 text-[1.0625rem] text-muted">We&rsquo;ll reply with a price within two business days.</p>
              {mockupUrl && (
                <a href={mockupUrl} download="townies-custom-hat-mockup.png" className={`${btnSolid} mt-8`}>
                  Download your mockup
                </a>
              )}
            </div>
          ) : (
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.6fr)] lg:gap-14">
              <div>
                <p className="font-label text-[0.6875rem] font-semibold uppercase tracking-[0.2em] text-muted">Your details</p>
                <h2 className="display mt-3 text-[2.25rem] text-text sm:text-[2.75rem]">Send it over.</h2>
                <p className="mt-4 max-w-sm text-[1rem] leading-relaxed text-muted">
                  Your mockup and logo come with this form. We reply with a price within two business days, and nothing is
                  ordered until you approve it.
                </p>
              </div>

              <form onSubmit={onSubmit} className="space-y-5" noValidate={false}>
                {/* Honeypot: people never see it, form-filling bots usually do. */}
                <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label htmlFor={`${uid}-hp`}>Leave this empty</label>
                  <input id={`${uid}-hp`} name="company_website" tabIndex={-1} autoComplete="off" />
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${uid}-org`} className={labelClass}>
                      Business, team or school
                    </label>
                    <input id={`${uid}-org`} name="organisation" className={fieldClass} placeholder="Quincy Youth Lacrosse" autoComplete="organization" />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-name`} className={labelClass}>
                      Your name
                    </label>
                    <input id={`${uid}-name`} name="name" required className={fieldClass} autoComplete="name" />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor={`${uid}-email`} className={labelClass}>
                      Email
                    </label>
                    <input id={`${uid}-email`} name="email" type="email" required className={fieldClass} autoComplete="email" placeholder="you@email.com" />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-phone`} className={labelClass}>
                      Phone <span className="normal-case tracking-normal">(optional)</span>
                    </label>
                    <input id={`${uid}-phone`} name="phone" type="tel" className={fieldClass} autoComplete="tel" />
                  </div>
                </div>

                <div className="grid gap-5 sm:grid-cols-3">
                  <div>
                    <label htmlFor={`${uid}-town`} className={labelClass}>
                      Town in Massachusetts
                    </label>
                    <input id={`${uid}-town`} name="town" className={fieldClass} placeholder="Braintree" autoComplete="address-level2" />
                  </div>
                  <div>
                    <label htmlFor={`${uid}-qty`} className={labelClass}>
                      How many hats
                    </label>
                    <select id={`${uid}-qty`} name="quantity" required defaultValue="" className={fieldClass}>
                      <option value="" disabled>
                        Choose one
                      </option>
                      {QUANTITIES.map((q) => (
                        <option key={q} value={q}>
                          {q}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`${uid}-date`} className={labelClass}>
                      Needed by <span className="normal-case tracking-normal">(optional)</span>
                    </label>
                    <input id={`${uid}-date`} name="neededBy" type="date" min={today} className={fieldClass} />
                  </div>
                </div>

                <div>
                  <label htmlFor={`${uid}-notes`} className={labelClass}>
                    Notes
                  </label>
                  <textarea
                    id={`${uid}-notes`}
                    name="notes"
                    rows={4}
                    maxLength={2000}
                    className={fieldClass}
                    placeholder="Thread colours you have in mind, a split of styles, or anything the mockup can't show."
                  />
                </div>

                <p className="text-[0.8125rem] text-muted">
                  Direct embroidery. We&rsquo;ll confirm stitch count and thread colours.
                  {!logo && ' No logo yet? Send the form anyway and reply with it later.'}
                </p>

                {status === 'error' && (
                  <p role="alert" className="text-[0.875rem] text-red-700">
                    {serverError}
                  </p>
                )}

                <button type="submit" disabled={status === 'sending'} className={btnSolid}>
                  {status === 'sending' ? 'Sending' : 'Request a price'}
                </button>
              </form>
            </div>
          )}
        </div>
      </section>
    </>
  );
}
