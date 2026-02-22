/**
 * Element Blocks — Phase 5, Task 5.2
 * Builds story element sections (opening, perspective, macguffin, etc.) from SelectedElements.
 */

import type { SelectedElements, StoryElement } from '../../types.ts';

const TYPE_LABELS: Record<string, string> = {
  opening_style: 'OPENING STYLE',
  narrative_perspective: 'NARRATIVE PERSPECTIVE',
  macguffin: 'KEY OBJECT',
  setting_detail: 'SETTING',
  humor_technique: 'HUMOR TECHNIQUE',
  tension_technique: 'TENSION TECHNIQUE',
  closing_style: 'CLOSING STYLE',
};

function getElementsList(elements: SelectedElements): Array<{ label: string; element: StoryElement }> {
  const out: Array<{ label: string; element: StoryElement }> = [];
  if (elements.opening) out.push({ label: TYPE_LABELS.opening_style, element: elements.opening });
  if (elements.perspective) out.push({ label: TYPE_LABELS.narrative_perspective, element: elements.perspective });
  if (elements.macguffin) out.push({ label: TYPE_LABELS.macguffin, element: elements.macguffin });
  if (elements.settingDetail) out.push({ label: TYPE_LABELS.setting_detail, element: elements.settingDetail });
  if (elements.humorTechnique) out.push({ label: TYPE_LABELS.humor_technique, element: elements.humorTechnique });
  if (elements.tensionTechnique) out.push({ label: TYPE_LABELS.tension_technique, element: elements.tensionTechnique });
  if (elements.closing) out.push({ label: TYPE_LABELS.closing_style, element: elements.closing });
  return out;
}

export function buildElementBlocks(elements: SelectedElements): string {
  const list = getElementsList(elements);
  return list
    .map(({ label, element }) => `## ${label}:\n${element.content_en}`)
    .join('\n\n');
}
