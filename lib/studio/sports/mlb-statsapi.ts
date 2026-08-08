// Content Studio — MLB StatsAPI.
//
// Official, free, no key. ESPN covers "who plays whom"; this covers the
// baseball-specific detail the gameday graphic actually wants — probable
// pitchers and their season line ("Sonny Gray 13-2, 2.93 ERA, 98 K").

export type ProbablePitcher = {
  id: number;
  fullName: string;
};

export type ProbableMatchup = {
  gamePk: number;
  venue?: string;
  gameDate: string;
  away?: ProbablePitcher;
  home?: ProbablePitcher;
};

const BASE = 'https://statsapi.mlb.com/api/v1';

/** StatsAPI wants MM/DD/YYYY for its schedule endpoint. */
function mmddyyyy(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${m}/${d}/${date.getFullYear()}`;
}

type SchedulePayload = {
  dates?: {
    games?: {
      gamePk?: number;
      gameDate?: string;
      venue?: { name?: string };
      teams?: {
        away?: { probablePitcher?: { id?: number; fullName?: string } };
        home?: { probablePitcher?: { id?: number; fullName?: string } };
      };
    }[];
  }[];
};

export async function probableMatchups(date: Date): Promise<ProbableMatchup[]> {
  const url = `${BASE}/schedule?sportId=1&date=${encodeURIComponent(mmddyyyy(date))}&hydrate=probablePitcher,venue`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), next: { revalidate: 300 } });
    if (!res.ok) return [];
    const payload = (await res.json()) as SchedulePayload;

    return (payload.dates ?? []).flatMap((d) =>
      (d.games ?? []).map((g) => {
        const toPitcher = (p?: { id?: number; fullName?: string }): ProbablePitcher | undefined =>
          p?.id && p.fullName ? { id: p.id, fullName: p.fullName } : undefined;

        return {
          gamePk: g.gamePk ?? 0,
          venue: g.venue?.name,
          gameDate: g.gameDate ?? '',
          away: toPitcher(g.teams?.away?.probablePitcher),
          home: toPitcher(g.teams?.home?.probablePitcher),
        };
      })
    );
  } catch {
    return [];
  }
}

type PeoplePayload = {
  people?: {
    fullName?: string;
    stats?: {
      splits?: {
        stat?: { wins?: number; losses?: number; era?: string; strikeOuts?: number };
      }[];
    }[];
  }[];
};

/**
 * Build the bottom-bar stat line for a pitcher.
 *
 * Returns null rather than a partial string when the season split is missing —
 * an empty "13-2, , 98 K" on a finished graphic is worse than the user typing
 * the line themselves.
 */
export async function pitcherStatLine(personId: number): Promise<string | null> {
  const url = `${BASE}/people/${personId}?hydrate=stats(group=[pitching],type=[season])`;

  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(10_000), next: { revalidate: 900 } });
    if (!res.ok) return null;

    const payload = (await res.json()) as PeoplePayload;
    const person = payload.people?.[0];
    const stat = person?.stats?.[0]?.splits?.[0]?.stat;
    if (!person?.fullName || !stat) return null;

    const { wins, losses, era, strikeOuts } = stat;
    if (wins === undefined || losses === undefined || !era || strikeOuts === undefined) return null;

    return `${person.fullName} ${wins}-${losses}, ${era} ERA, ${strikeOuts} K`;
  } catch {
    return null;
  }
}
