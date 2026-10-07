'use client';

// Content Studio — drag-to-move for template blocks.
//
// The preview is a server-rendered PNG, so there's nothing in the DOM to grab.
// Instead the user picks a block here, drags anywhere on the preview, and the
// drag distance (scaled from screen to canvas pixels) is stored as that
// block's offset in `props.offsets`. The template applies it on render, so the
// preview, the export and the saved post all agree.

import type { Offset, MovableDef } from '@/lib/studio/types';

export type Offsets = Record<string, Offset>;

const NUDGE = 10;

export function readOffsets(values: Record<string, unknown>): Offsets {
  const raw = values.offsets;
  return raw && typeof raw === 'object' ? (raw as Offsets) : {};
}

export function withOffset(
  values: Record<string, unknown>,
  id: string,
  next: Offset
): Record<string, unknown> {
  const offsets = { ...readOffsets(values) };
  if (next.x || next.y) offsets[id] = { x: Math.round(next.x), y: Math.round(next.y) };
  else delete offsets[id];
  return { ...values, offsets };
}

export function MovePanel({
  movable,
  selected,
  onSelect,
  values,
  onChange,
}: {
  movable: MovableDef[];
  selected: string;
  onSelect: (id: string) => void;
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const offsets = readOffsets(values);
  const current = offsets[selected] ?? { x: 0, y: 0 };
  const nudge = (dx: number, dy: number) =>
    onChange(withOffset(values, selected, { x: current.x + dx, y: current.y + dy }));
  const anyMoved = Object.keys(offsets).length > 0;

  const btn =
    'w-8 h-8 flex items-center justify-center rounded-md border border-white/10 text-white/60 hover:text-white hover:border-white/30 transition-colors text-sm';

  return (
    <div className="mt-5 border-t border-white/10 pt-4">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30 mb-2">Move</p>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {movable.map((m) => {
          const moved = Boolean(offsets[m.id]);
          const on = m.id === selected;
          return (
            <button
              key={m.id}
              onClick={() => onSelect(m.id)}
              className={`text-xs rounded-full px-3 py-1.5 border transition-colors ${
                on
                  ? 'bg-white text-black border-white'
                  : 'border-white/15 text-white/70 hover:text-white hover:border-white/35'
              }`}
            >
              {m.label}
              {moved ? ' •' : ''}
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-white/40 leading-relaxed mb-3">
        Pick one, then drag on the preview. Arrows nudge it 10px.
      </p>
      <div className="flex items-center gap-1.5">
        <button className={btn} onClick={() => nudge(-NUDGE, 0)} aria-label="Nudge left">←</button>
        <button className={btn} onClick={() => nudge(0, -NUDGE)} aria-label="Nudge up">↑</button>
        <button className={btn} onClick={() => nudge(0, NUDGE)} aria-label="Nudge down">↓</button>
        <button className={btn} onClick={() => nudge(NUDGE, 0)} aria-label="Nudge right">→</button>
        <button
          onClick={() => onChange(withOffset(values, selected, { x: 0, y: 0 }))}
          disabled={!offsets[selected]}
          className="ml-2 text-xs text-white/50 hover:text-white disabled:opacity-30 transition-colors"
        >
          Reset
        </button>
        {anyMoved ? (
          <button
            onClick={() => onChange({ ...values, offsets: {} })}
            className="ml-auto text-xs text-white/40 hover:text-white transition-colors"
          >
            Reset all
          </button>
        ) : null}
      </div>
    </div>
  );
}
