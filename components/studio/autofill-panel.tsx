'use client';

// Content Studio — sports auto-fill panel.
//
// Shown only for templates that declare `autofillKind: 'sports'`. Pick a league
// and a date, load the slate, apply a game. Everything it fills stays editable
// — it's a head start, not a lock.

import { useCallback, useState } from 'react';

type Game = {
  id: string;
  label: string;
  time: string;
  status: 'scheduled' | 'in_progress' | 'final';
  patch: Record<string, unknown>;
};

const LEAGUES = [
  { value: 'mlb', label: 'MLB' },
  { value: 'nhl', label: 'NHL' },
  { value: 'nba', label: 'NBA' },
  { value: 'nfl', label: 'NFL' },
];

const controlClass =
  'bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-rust/70 transition-colors';

/** Local YYYY-MM-DD — toISOString() would roll over to tomorrow after 8pm ET. */
function todayLocal(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${m}-${day}`;
}

export function AutofillPanel({
  templateId,
  onApply,
}: {
  templateId: string;
  onApply: (patch: Record<string, unknown>) => void;
}) {
  const [league, setLeague] = useState('mlb');
  const [date, setDate] = useState(todayLocal);
  const [games, setGames] = useState<Game[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [oddsAvailable, setOddsAvailable] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    setNote(null);
    setGames(null);
    try {
      const params = new URLSearchParams({ league, date, template: templateId });
      const res = await fetch(`/api/admin/studio/autofill?${params}`);
      if (!res.ok) throw new Error(await res.text());
      const json = await res.json();
      setGames(json.games ?? []);
      setOddsAvailable(json.oddsAvailable !== false);
      if (!json.games?.length) setNote(json.note ?? 'No games found.');
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Could not load games.');
    } finally {
      setLoading(false);
    }
  }, [league, date, templateId]);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5 mb-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30 mb-3 pb-2 border-b border-white/10">
        Auto-fill from schedule
      </p>

      <div className="flex gap-2">
        <select value={league} onChange={(e) => setLeague(e.target.value)} className={controlClass}>
          {LEAGUES.map((l) => (
            <option key={l.value} value={l.value} className="bg-[#1A1A1A]">
              {l.label}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={`${controlClass} flex-1`}
        />
        <button
          onClick={load}
          disabled={loading}
          className="bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-4 rounded-lg text-sm font-medium transition-colors shrink-0"
        >
          {loading ? '…' : 'Load'}
        </button>
      </div>

      {note ? <p className="text-[11px] text-white/40 mt-3 leading-relaxed">{note}</p> : null}

      {games && games.length > 0 ? (
        <div className="mt-3 space-y-1.5 max-h-64 overflow-auto">
          {games.map((g) => (
            <button
              key={g.id}
              onClick={() => onApply(g.patch)}
              className="w-full flex items-center justify-between gap-3 text-left px-3 py-2 rounded-lg bg-black/30 hover:bg-black/50 border border-transparent hover:border-brand-rust/40 transition-colors"
            >
              <span className="text-sm text-white/90 truncate">{g.label}</span>
              <span className="text-[11px] text-white/40 shrink-0">
                {g.status === 'final' ? 'Final' : g.time}
              </span>
            </button>
          ))}
        </div>
      ) : null}

      {games && games.length > 0 && !oddsAvailable ? (
        <p className="text-[11px] text-white/30 mt-3 leading-relaxed">
          Odds not filled — THE_ODDS_API_KEY isn&apos;t set. Everything else came from the live
          schedule.
        </p>
      ) : null}
    </div>
  );
}
