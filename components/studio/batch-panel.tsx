'use client';

// Content Studio — batch create a week of sports drafts.

import { useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TEAM_COLORS, LEAGUE_LABELS, type League } from '@/lib/studio/team-colors';

const controlClass =
  'bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-brand-rust/70 transition-colors';

const LEAGUES: League[] = ['mlb', 'nhl', 'nba', 'nfl'];

/**
 * Boston teams lead the list because they are the reason this button exists.
 * "Every game in the league" stays available but is not the default — nobody
 * wants 100 drafts.
 */
const BOSTON: Record<League, string> = {
  mlb: 'mlb-bos',
  nhl: 'nhl-bos',
  nba: 'nba-bos',
  nfl: 'nfl-ne',
};

export function BatchPanel() {
  const router = useRouter();
  const [league, setLeague] = useState<League>('mlb');
  const [teamId, setTeamId] = useState<string>(BOSTON.mlb);
  const [days, setDays] = useState(7);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  const teams = Object.values(TEAM_COLORS).filter((t) => t.league === league);

  const run = useCallback(async () => {
    setBusy(true);
    setNote(null);
    try {
      const res = await fetch('/api/admin/studio/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ league, teamId: teamId || null, days, templateId: 'sports-gameday' }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Could not generate');
      setNote(json.created ? `Created ${json.created} draft${json.created === 1 ? '' : 's'}.` : (json.note ?? 'Nothing to create.'));
      if (json.created) router.refresh();
    } catch (err) {
      setNote(err instanceof Error ? err.message : 'Could not generate');
    } finally {
      setBusy(false);
    }
  }, [league, teamId, days, router]);

  return (
    <div className="bg-white/[0.03] border border-white/10 rounded-xl p-5">
      <p className="text-[10px] uppercase tracking-[0.22em] text-white/30 mb-1 pb-2 border-b border-white/10">
        Generate the week
      </p>
      <p className="text-[11px] text-white/30 my-3 leading-relaxed">
        One gameday draft per fixture, filled from the live schedule and scheduled at first pitch.
        All drafts — nothing posts itself.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <select
          value={league}
          onChange={(e) => {
            const next = e.target.value as League;
            setLeague(next);
            setTeamId(BOSTON[next]);
          }}
          className={controlClass}
        >
          {LEAGUES.map((l) => (
            <option key={l} value={l} className="bg-[#1A1A1A]">
              {LEAGUE_LABELS[l]}
            </option>
          ))}
        </select>

        <select value={days} onChange={(e) => setDays(Number(e.target.value))} className={controlClass}>
          {[3, 7, 10, 14].map((d) => (
            <option key={d} value={d} className="bg-[#1A1A1A]">
              Next {d} days
            </option>
          ))}
        </select>

        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
          className={`${controlClass} col-span-2`}
        >
          <option value="" className="bg-[#1A1A1A]">
            Every game in the league
          </option>
          {teams.map((t) => (
            <option key={t.id} value={t.id} className="bg-[#1A1A1A]">
              {t.city} {t.name}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={run}
        disabled={busy}
        className="w-full mt-3 bg-white/10 hover:bg-white/20 disabled:opacity-50 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
      >
        {busy ? 'Generating…' : 'Generate drafts'}
      </button>

      {note ? <p className="text-[11px] text-white/40 mt-3 leading-relaxed">{note}</p> : null}
    </div>
  );
}
