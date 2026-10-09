// The striped market awning over every stall: cream and one brand colour,
// with a scalloped edge. Pure CSS, so it scales to any width with no image.

const TONES = {
  navy: '#0D1B2A',
  forest: '#2F4F3A',
  stone: '#8F918D',
} as const;

export type AwningTone = keyof typeof TONES;

const ORDER: AwningTone[] = ['navy', 'forest', 'navy', 'stone'];

/** A stable colour per business so a stall looks the same everywhere. */
export function awningTone(key: string): AwningTone {
  let h = 0;
  for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  return ORDER[h % ORDER.length];
}

export function Awning({ tone = 'navy', height = 28, className = '' }: { tone?: AwningTone; height?: number; className?: string }) {
  const c = TONES[tone];
  const stripe = 26;
  return (
    // The drop-shadow outlines every stripe and scallop in the stall colour, so
    // the white stripes read on a white page and on the cream masthead alike.
    <div
      aria-hidden
      className={`relative w-full ${className}`}
      style={{ height: height + 10, filter: `drop-shadow(0 1px 0 ${c}) drop-shadow(0 -1px 0 ${c})` }}
    >
      <div
        className="absolute inset-x-0 top-0"
        style={{
          height,
          background: `repeating-linear-gradient(90deg, ${c} 0 ${stripe}px, #FFFFFF ${stripe}px ${stripe * 2}px)`,
        }}
      />
      {/* Scallops: one half-circle per stripe, same colours, hanging below. */}
      <div
        className="absolute inset-x-0"
        style={{
          top: height - 1,
          height: 11,
          background: `repeating-linear-gradient(90deg, ${c} 0 ${stripe}px, #FFFFFF ${stripe}px ${stripe * 2}px)`,
          WebkitMaskImage: `radial-gradient(circle at ${stripe / 2}px 0, #000 ${stripe / 2}px, transparent ${stripe / 2 + 0.5}px)`,
          maskImage: `radial-gradient(circle at ${stripe / 2}px 0, #000 ${stripe / 2}px, transparent ${stripe / 2 + 0.5}px)`,
          WebkitMaskSize: `${stripe}px 11px`,
          maskSize: `${stripe}px 11px`,
          WebkitMaskRepeat: 'repeat-x',
          maskRepeat: 'repeat-x',
        }}
      />
    </div>
  );
}
