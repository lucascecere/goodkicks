// A small striped market awning: a thin band of stripes with a scalloped
// edge, sitting on top of a shop's photo. Kept deliberately slim (Lucas,
// 10-09: "bring the awnings back a bit, not too much"). Pure CSS.

const TONES = {
  navy: '#0D1B2A',
  forest: '#2F4F3A',
} as const;

export type AwningTone = keyof typeof TONES;

/** A stable colour per business so a shop looks the same everywhere. */
export function awningTone(key: string): AwningTone {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return h % 2 ? 'forest' : 'navy';
}

export function Awning({
  tone = 'navy',
  band = 8,
  stripe = 14,
  className = '',
}: {
  tone?: AwningTone;
  /** Height of the striped band, px. */
  band?: number;
  /** Width of one stripe, px; the scallops are one stripe wide. */
  stripe?: number;
  className?: string;
}) {
  const c = TONES[tone];
  const drop = Math.round(stripe / 2);
  const stripes = `repeating-linear-gradient(90deg, ${c} 0 ${stripe}px, #FFFFFF ${stripe}px ${stripe * 2}px)`;
  const mask = `radial-gradient(circle at ${stripe / 2}px 0, #000 ${drop}px, transparent ${drop + 0.5}px)`;
  return (
    <div
      aria-hidden
      className={`relative w-full ${className}`}
      style={{ height: band + drop, filter: `drop-shadow(0 1px 0 ${c})` }}
    >
      <div className="absolute inset-x-0 top-0" style={{ height: band, background: stripes }} />
      <div
        className="absolute inset-x-0"
        style={{
          top: band - 1,
          height: drop + 1,
          background: stripes,
          WebkitMaskImage: mask,
          maskImage: mask,
          WebkitMaskSize: `${stripe}px ${drop + 1}px`,
          maskSize: `${stripe}px ${drop + 1}px`,
          WebkitMaskRepeat: 'repeat-x',
          maskRepeat: 'repeat-x',
        }}
      />
    </div>
  );
}
