// Content Studio — the template registry.
//
// The single list the whole studio reads. The gallery, the editor form, the
// preview, and the PNG route all resolve templates through here, so adding a
// template is: write the file, add one line below. Nothing else changes.

import { gamedayTemplate } from './templates/sports/gameday';
import { finalScoreTemplate } from './templates/sports/final-score';
import { headlineTemplate } from './templates/news/headline';
import { breakingTemplate } from './templates/news/breaking';
import { funFactTemplate } from './templates/town/fun-fact';
import { townSpotlightTemplate } from './templates/town/spotlight';
import { dropTemplate } from './templates/brand/drop';
import { newTownTemplate } from './templates/brand/new-town';
import { CATEGORY_ORDER, type AnyTemplate, type TemplateCategory } from './types';

// Order within a category is the order the gallery shows them in.
const ALL: AnyTemplate[] = [
  gamedayTemplate,
  finalScoreTemplate,
  headlineTemplate,
  breakingTemplate,
  funFactTemplate,
  townSpotlightTemplate,
  dropTemplate,
  newTownTemplate,
];

export const TEMPLATES: Record<string, AnyTemplate> = Object.fromEntries(
  ALL.map((t) => [t.id, t])
);

export function getTemplate(id: string | undefined | null): AnyTemplate | null {
  if (!id) return null;
  return TEMPLATES[id] ?? null;
}

export function listTemplates(): AnyTemplate[] {
  return ALL;
}

/** Templates grouped for the gallery, in the canonical category order. */
export function templatesByCategory(): { category: TemplateCategory; templates: AnyTemplate[] }[] {
  return CATEGORY_ORDER.map((category) => ({
    category,
    templates: ALL.filter((t) => t.category === category),
  })).filter((group) => group.templates.length > 0);
}
