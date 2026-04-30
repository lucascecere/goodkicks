'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { X } from 'lucide-react';

const SEGMENTS = [
  { label: '10% off',      code: 'KICKS10',  color: '#C15A3A' },
  { label: 'free ship',    code: 'FREESHIP', color: '#5A5E68' },
  { label: '15% off',      code: 'KICKS15',  color: '#5BA4B4' },
  { label: '10% off',      code: 'KICKS10',  color: '#A89870' },
  { label: '20% off',      code: 'KICKS20',  color: '#D4A84B' },
  { label: 'free ship',    code: 'FREESHIP', color: '#4A4848' },
];

const N = SEGMENTS.length; // 6
const SLICE = 360 / N;     // 60deg each
const CX = 150, CY = 150, R = 128, R_INNER = 44;

function polar(cx: number, cy: number, r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function slicePath(i: number) {
  const start = i * SLICE;
  const end   = start + SLICE;
  const s = polar(CX, CY, R, start);
  const e = polar(CX, CY, R, end);
  return `M ${CX} ${CY} L ${s.x.toFixed(2)} ${s.y.toFixed(2)} A ${R} ${R} 0 0 1 ${e.x.toFixed(2)} ${e.y.toFixed(2)} Z`;
}

export function SpinWheelPopup() {
  const [visible,  setVisible]  = useState(false);
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [winner,   setWinner]   = useState<typeof SEGMENTS[0] | null>(null);
  const [email,    setEmail]    = useState('');
  const [step,     setStep]     = useState<'idle' | 'form' | 'success'>('idle');
  const [sending,  setSending]  = useState(false);
  const rotRef = useRef(0);

  useEffect(() => {
    if (localStorage.getItem('gk_spin_seen')) return;
    const t = setTimeout(() => setVisible(true), 4000);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    localStorage.setItem('gk_spin_seen', '1');
    setVisible(false);
  }

  function spin() {
    if (spinning || step !== 'idle') return;
    const idx = Math.floor(Math.random() * N);
    // Rotate so that segment idx lands under the pointer (top = 0deg in our polar system)
    // Segment i center is at i*SLICE + SLICE/2 degrees from top
    // We need that center at 0deg (top), so we rotate wheel by -(i*SLICE + SLICE/2)
    // Add 5 full spins for drama
    const landAngle = -(idx * SLICE + SLICE / 2);
    const total = rotRef.current - (rotRef.current % 360) + 5 * 360 + landAngle;
    rotRef.current = total;
    setRotation(total);
    setSpinning(true);
    setTimeout(() => {
      setSpinning(false);
      setWinner(SEGMENTS[idx]);
      setStep('form');
    }, 4200);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!winner) return;
    setSending(true);
    try {
      await fetch('/api/discount', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, discountCode: winner.code, discountLabel: winner.label }),
      });
    } catch {}
    setSending(false);
    setStep('success');
    localStorage.setItem('gk_spin_seen', '1');
  }

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-brand-ink/70 backdrop-blur-sm" onClick={dismiss} />

      {/* Modal */}
      <div className="relative bg-brand-cream rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
        {/* Close */}
        <button
          onClick={dismiss}
          aria-label="Close"
          className="absolute top-4 right-4 z-10 p-1.5 text-brand-muted hover:text-brand-ink transition-colors rounded-full hover:bg-brand-rule"
        >
          <X size={18} />
        </button>

        <div className="px-6 pt-8 pb-6 text-center space-y-2">
          <p className="text-xs uppercase tracking-widest text-brand-muted font-medium">spin to win</p>
          <h2 className="font-display text-3xl text-brand-ink">your discount awaits.</h2>
          {step === 'idle' && (
            <p className="text-brand-muted text-sm">give it a spin — every segment wins.</p>
          )}
          {step === 'form' && winner && (
            <p className="text-brand-muted text-sm">
              you landed on <span className="font-semibold text-brand-ink">{winner.label}</span>! enter your email to claim it.
            </p>
          )}
          {step === 'success' && winner && (
            <p className="text-brand-muted text-sm">code sent! check your inbox.</p>
          )}
        </div>

        {/* Wheel */}
        {step !== 'success' && (
          <div className="flex justify-center px-6 pb-4">
            <div className="relative" style={{ width: 300, height: 300 }}>
              {/* Pointer triangle */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1 z-10"
                style={{
                  width: 0,
                  height: 0,
                  borderLeft: '10px solid transparent',
                  borderRight: '10px solid transparent',
                  borderTop: '22px solid #1A1A1A',
                }}
              />

              {/* Spinning wheel */}
              <svg
                viewBox="0 0 300 300"
                width="300"
                height="300"
                style={{
                  transform: `rotate(${rotation}deg)`,
                  transition: spinning ? 'transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)' : 'none',
                }}
              >
                {/* Segments */}
                {SEGMENTS.map((seg, i) => {
                  const midDeg = i * SLICE + SLICE / 2;
                  const textPos = polar(CX, CY, 88, midDeg);
                  return (
                    <g key={i}>
                      <path d={slicePath(i)} fill={seg.color} stroke="#F5EFE3" strokeWidth="1.5" />
                      <text
                        x={textPos.x}
                        y={textPos.y}
                        textAnchor="middle"
                        dominantBaseline="middle"
                        fill="#F5EFE3"
                        fontSize="11"
                        fontWeight="600"
                        fontFamily="sans-serif"
                        transform={`rotate(${midDeg}, ${textPos.x}, ${textPos.y})`}
                      >
                        {seg.label}
                      </text>
                    </g>
                  );
                })}

                {/* Center circle */}
                <circle cx={CX} cy={CY} r={R_INNER + 6} fill="#F5EFE3" />
                <circle cx={CX} cy={CY} r={R_INNER} fill="#F5EFE3" />
              </svg>

              {/* Logo in center — overlaid so it doesn't rotate */}
              <div
                className="absolute rounded-full overflow-hidden bg-brand-cream flex items-center justify-center"
                style={{
                  width: R_INNER * 2,
                  height: R_INNER * 2,
                  top: CY - R_INNER,
                  left: CX - R_INNER,
                }}
              >
                <Image
                  src="/brand/logo.png"
                  alt="Good Kicks"
                  width={R_INNER * 2}
                  height={R_INNER * 2}
                  className="object-contain"
                />
              </div>
            </div>
          </div>
        )}

        {/* CTA / Form / Success */}
        <div className="px-6 pb-8 space-y-3">
          {step === 'idle' && (
            <button
              onClick={spin}
              disabled={spinning}
              className="w-full bg-brand-rust text-white py-3.5 rounded-lg font-medium text-lg hover:bg-brand-rust/90 transition-colors disabled:opacity-60"
            >
              {spinning ? 'spinning…' : 'spin the wheel'}
            </button>
          )}

          {step === 'form' && winner && (
            <form onSubmit={handleSubmit} className="space-y-3">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="your@email.com"
                className="w-full border border-brand-rule rounded-lg px-4 py-3 text-brand-ink placeholder:text-brand-muted/60 focus:outline-none focus:ring-2 focus:ring-brand-rust/40 bg-white"
              />
              <button
                type="submit"
                disabled={sending}
                className="w-full bg-brand-rust text-white py-3.5 rounded-lg font-medium text-lg hover:bg-brand-rust/90 transition-colors disabled:opacity-60"
              >
                {sending ? 'sending…' : `claim ${winner.label} →`}
              </button>
            </form>
          )}

          {step === 'success' && winner && (
            <div className="text-center space-y-4">
              <div className="bg-brand-ink text-brand-cream rounded-lg py-4 px-6">
                <p className="text-xs uppercase tracking-widest text-brand-cream/60 mb-1">your code</p>
                <p className="font-display text-3xl tracking-widest">{winner.code}</p>
              </div>
              <p className="text-brand-muted text-xs">enter at checkout · {winner.label} applied automatically</p>
              <button
                onClick={dismiss}
                className="w-full border border-brand-rule text-brand-ink py-3 rounded-lg font-medium hover:border-brand-ink transition-colors"
              >
                start shopping →
              </button>
            </div>
          )}

          <button onClick={dismiss} className="w-full text-center text-brand-muted text-xs hover:text-brand-ink transition-colors py-1">
            no thanks
          </button>
        </div>
      </div>
    </div>
  );
}
