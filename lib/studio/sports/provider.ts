// Content Studio — the sports data seam.
//
// Templates never touch a vendor's response shape. They ask for a GameSummary
// and get one, so swapping ESPN for a paid provider later is a one-file change
// with no template edits and no visual regression risk.

import type { League } from '../team-colors';

export type GameStatus = 'scheduled' | 'in_progress' | 'final';

export type GameSummary = {
  /** Provider's own id, kept so a later call can fetch detail for one game. */
  id: string;
  league: League;
  /** ISO 8601, UTC. Formatting for display is the caller's job. */
  startsAt: string;
  /** Palette ids (`mlb-bos`), already mapped — not vendor abbreviations. */
  awayTeamId: string;
  homeTeamId: string;
  /**
   * Vendor display names ("Boston Red Sox"). Kept because The Odds API shares
   * no id space with ESPN — full names are the only join key available.
   */
  awayName?: string;
  homeName?: string;
  venue?: string;
  status: GameStatus;
  awayScore?: number;
  homeScore?: number;
};

export type OddsLine = {
  moneyLineAway?: string;
  moneyLineHome?: string;
  total?: string;
  spreadAway?: string;
  spreadHome?: string;
};

export interface SportsProvider {
  /** Games for one league on one calendar day (local to the league). */
  schedule(league: League, date: Date): Promise<GameSummary[]>;
}

/** American odds always carry an explicit sign; -110 and +110 differ. */
export function formatAmerican(value: number | undefined): string | undefined {
  if (value === undefined || Number.isNaN(value)) return undefined;
  return value > 0 ? `+${value}` : `${value}`;
}

/** YYYYMMDD, the format both ESPN and most schedule endpoints expect. */
export function yyyymmdd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}${m}${d}`;
}
