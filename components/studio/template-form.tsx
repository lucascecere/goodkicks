'use client';

// Content Studio — the generated form.
//
// Every input in the studio is produced from a template's `fields` array. No
// template ever writes form markup, which is what keeps "add a template" to one
// file: declare the fields, get the whole editing UI.
//
// Client-safe by construction. It imports only plain data (design tokens, team
// palettes) — never the registry, which pulls in Satori render functions.

import { getPath, setPath } from '@/lib/studio/params';
import { STOCK_BACKGROUNDS } from '@/lib/studio/design';
import {
  teamOptions,
  getTeam,
  LEAGUE_LABELS,
  LEAGUE_OPTIONS,
  LEAGUE_LINE_LABEL,
  leagueOf,
  firstTeamId,
  swapVenueLeague,
  type League,
} from '@/lib/studio/team-colors';
import type { FieldDef } from '@/lib/studio/types';

type Props = {
  fields: FieldDef[];
  values: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
};

const inputClass =
  'w-full bg-black/40 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/25 focus:outline-none focus:border-brand-rust/70 transition-colors';

/** Team picker, scoped to the current league. An out-of-league value (e.g. from
 *  an older saved post) stays selectable so switching never silently drops it. */
function TeamSelect({
  value,
  league,
  onChange,
}: {
  value: string;
  league: League;
  onChange: (v: string) => void;
}) {
  const opts = teamOptions(league);
  const inList = opts.some((o) => o.value === value);
  const t = getTeam(value);
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputClass}>
      {!inList && value ? (
        <option value={value} className="bg-[#1A1A1A]">
          {`${LEAGUE_LABELS[t.league]} · ${t.city} ${t.name}`}
        </option>
      ) : null}
      {opts.map((o) => (
        <option key={o.value} value={o.value} className="bg-[#1A1A1A]">
          {o.label}
        </option>
      ))}
    </select>
  );
}

function Field({
  field,
  value,
  onChange,
  league,
  onLeagueChange,
}: {
  field: FieldDef;
  value: unknown;
  onChange: (v: unknown) => void;
  /** Effective league (derived from the home team) — used by team/league fields. */
  league: League;
  onLeagueChange: (l: League) => void;
}) {
  const str = typeof value === 'string' ? value : value == null ? '' : String(value);

  if (field.type === 'toggle') {
    const on = value === true;
    return (
      <button
        type="button"
        onClick={() => onChange(!on)}
        className="flex items-center gap-3 w-full text-left group"
      >
        <span
          className={`relative w-10 h-6 rounded-full transition-colors shrink-0 ${
            on ? 'bg-brand-rust' : 'bg-white/15'
          }`}
        >
          <span
            className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
              on ? 'left-5' : 'left-1'
            }`}
          />
        </span>
        <span className="text-sm text-white/80 group-hover:text-white transition-colors">
          {field.label}
        </span>
      </button>
    );
  }

  return (
    <div>
      <label className="block text-[11px] uppercase tracking-[0.14em] text-white/40 mb-1.5">
        {field.label}
      </label>

      {field.type === 'textarea' ? (
        <textarea
          value={str}
          rows={field.rows ?? 3}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={`${inputClass} resize-y leading-relaxed`}
        />
      ) : field.type === 'select' ? (
        <select value={str} onChange={(e) => onChange(e.target.value)} className={inputClass}>
          {field.options.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#1A1A1A]">
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === 'league' ? (
        <select
          value={league}
          onChange={(e) => onLeagueChange(e.target.value as League)}
          className={inputClass}
        >
          {LEAGUE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value} className="bg-[#1A1A1A]">
              {o.label}
            </option>
          ))}
        </select>
      ) : field.type === 'team' ? (
        <TeamSelect value={str} league={league} onChange={onChange} />
      ) : field.type === 'image' ? (
        <div className="space-y-2">
          <select value={str} onChange={(e) => onChange(e.target.value)} className={inputClass}>
            {/* A photo the user pasted won't be in the shipped list; keep it
                selectable so the dropdown doesn't silently reset their choice. */}
            {!STOCK_BACKGROUNDS.some((b) => b.value === str) && str ? (
              <option value={str} className="bg-[#1A1A1A]">
                Custom — {str.split('/').pop()}
              </option>
            ) : null}
            {STOCK_BACKGROUNDS.map((b) => (
              <option key={b.value} value={b.value} className="bg-[#1A1A1A]">
                {b.label}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={str}
            placeholder="…or paste an image path / URL"
            onChange={(e) => onChange(e.target.value)}
            className={`${inputClass} text-xs`}
          />
        </div>
      ) : field.type === 'number' ? (
        <input
          type="number"
          value={str}
          min={field.min}
          max={field.max}
          step={field.step}
          onChange={(e) => onChange(e.target.value === '' ? 0 : Number(e.target.value))}
          className={inputClass}
        />
      ) : field.type === 'color' ? (
        <div className="flex gap-2">
          <input
            type="color"
            value={str || '#000000'}
            onChange={(e) => onChange(e.target.value)}
            className="w-11 h-9 bg-transparent border border-white/10 rounded cursor-pointer"
          />
          <input
            type="text"
            value={str}
            onChange={(e) => onChange(e.target.value)}
            className={inputClass}
          />
        </div>
      ) : (
        <input
          type={field.type === 'date' ? 'date' : field.type === 'time' ? 'time' : 'text'}
          value={str}
          placeholder={field.placeholder}
          onChange={(e) => onChange(e.target.value)}
          className={inputClass}
        />
      )}

      {field.help ? <p className="text-[11px] text-white/30 mt-1.5 leading-relaxed">{field.help}</p> : null}
    </div>
  );
}

export function TemplateForm({ fields, values, onChange }: Props) {
  // Preserve declaration order of groups — the template author sequenced them
  // to match how the graphic reads top to bottom.
  const groups: { name: string; fields: FieldDef[] }[] = [];
  for (const field of fields) {
    const name = field.group ?? 'Content';
    const existing = groups.find((g) => g.name === name);
    if (existing) existing.fields.push(field);
    else groups.push({ name, fields: [field] });
  }

  // League is derived from the home team (the palette owner), so the League
  // selector needs no stored prop — picking one just re-homes the team pickers.
  const homeKey =
    fields.find((f) => f.key === 'homeTeam')?.key ?? fields.find((f) => f.type === 'team')?.key;
  const effLeague: League = leagueOf(homeKey ? (getPath(values, homeKey) as string) : null);

  // Changing league: re-home every team field into the new league (keeping the
  // pair distinct), then re-tag the league-dependent labels the template has.
  function applyLeague(next: League) {
    let out = setPath(values, 'league', next);
    const used: string[] = [];
    for (const f of fields) {
      if (f.type !== 'team') continue;
      const cur = getPath(out, f.key) as string;
      const id = leagueOf(cur) === next ? cur : firstTeamId(next, used[used.length - 1]);
      out = setPath(out, f.key, id);
      used.push(id);
    }
    if (getPath(out, 'lineLabel') !== undefined) out = setPath(out, 'lineLabel', LEAGUE_LINE_LABEL[next]);
    const venue = getPath(out, 'venue');
    if (typeof venue === 'string') out = setPath(out, 'venue', swapVenueLeague(venue, next));
    onChange(out);
  }

  return (
    // Two columns so the whole editor reads as one compact block rather than a
    // tall single-file stack; groups flow left-to-right, top-to-bottom.
    <div className="grid sm:grid-cols-2 gap-x-6 gap-y-7">
      {groups.map((group) => (
        <div key={group.name}>
          <p className="text-[10px] uppercase tracking-[0.22em] text-white/30 mb-3 pb-2 border-b border-white/10">
            {group.name}
          </p>
          <div className="space-y-4">
            {group.fields.map((field) => (
              <Field
                key={field.key}
                field={field}
                value={getPath(values, field.key)}
                onChange={(v) => onChange(setPath(values, field.key, v))}
                league={effLeague}
                onLeagueChange={applyLeague}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
