/**
 * Story Element Selector — Phase 4, Task 4.5
 *
 * Selects concrete story elements (opening, perspective, macguffin, etc.).
 * Always: opening_style, narrative_perspective, closing_style.
 * Conditional: macguffin, setting_detail (50%), humor_technique, tension_technique.
 * Max 2 DB queries: one for all elements, one for history.
 */

import type {
  StoryElement,
  SelectedElements,
  ElementSelectorParams,
  ElementType,
  EmotionFlowSupabase,
  IntensityLevel,
  ToneMode,
  BlueprintCategory,
  AgeGroup,
} from '../types.ts';
import { weightedRandom } from '../utils.ts';

const ELEMENT_TYPES: ElementType[] = [
  'opening_style',
  'narrative_perspective',
  'macguffin',
  'setting_detail',
  'humor_technique',
  'tension_technique',
  'closing_style',
];

export interface ShouldSelectParams {
  ageGroup: string;
  theme: string;
  intensity: IntensityLevel;
  tone: ToneMode;
  blueprintCategory?: BlueprintCategory;
}

/**
 * Decides whether an element type should be selected for the given params.
 */
export function shouldSelectElement(
  elementType: ElementType,
  params: ShouldSelectParams
): boolean {
  const { ageGroup, theme, intensity, tone, blueprintCategory } = params;
  switch (elementType) {
    case 'opening_style':
    case 'narrative_perspective':
    case 'closing_style':
      return true;
    case 'macguffin':
      return (
        ['magic_fantasy', 'adventure_action'].includes(theme) || intensity === 'deep'
      );
    case 'setting_detail':
      return Math.random() < 0.5;
    case 'humor_technique':
      return (
        (tone === 'comedic' || tone === 'absurd') || blueprintCategory === 'humor'
      );
    case 'tension_technique':
      return intensity === 'deep' && ageGroup !== '6-7';
    default:
      return false;
  }
}

// ─── Fallbacks when DB fails or no elements (required types only) ─────

export const FALLBACK_OPENING: StoryElement = {
  id: 'fallback-opening',
  element_key: 'opening_default',
  element_type: 'opening_style',
  content_en:
    'Start the story with an unexpected moment that immediately grabs attention.',
  labels: null,
  compatible_themes: null,
  compatible_categories: null,
  age_groups: [],
  weight: 10,
  is_active: true,
  created_at: '',
};

export const FALLBACK_PERSPECTIVE: StoryElement = {
  id: 'fallback-perspective',
  element_key: 'perspective_default',
  element_type: 'narrative_perspective',
  content_en: 'Tell the story in third person.',
  labels: null,
  compatible_themes: null,
  compatible_categories: null,
  age_groups: [],
  weight: 10,
  is_active: true,
  created_at: '',
};

export const FALLBACK_CLOSING: StoryElement = {
  id: 'fallback-closing',
  element_key: 'closing_default',
  element_type: 'closing_style',
  content_en: 'End with an image that lingers.',
  labels: null,
  compatible_themes: null,
  compatible_categories: null,
  age_groups: [],
  weight: 10,
  is_active: true,
  created_at: '',
};

// ─── History: one query, then group by element_type (last 3 per type) ─

interface UsageRow {
  element_key: string;
  element_type: string;
  created_at: string;
}

async function getElementUsageHistory(
  supabase: EmotionFlowSupabase,
  kidProfileId: string,
  limit: number
): Promise<UsageRow[]> {
  try {
    const res = await supabase
      .from('story_element_usage')
      .select('element_key, element_type, created_at')
      .eq('kid_profile_id', kidProfileId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (res.error || !res.data) return [];
    const data = res.data as UsageRow[];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function getRecentKeysByType(
  history: UsageRow[],
  elementType: ElementType,
  count: number
): string[] {
  const keys: string[] = [];
  for (const row of history) {
    if (row.element_type === elementType && !keys.includes(row.element_key)) {
      keys.push(row.element_key);
      if (keys.length >= count) break;
    }
  }
  return keys;
}

// ─── Single-element selection (filter, exclude history, weighted random) ─

function selectOneElement(
  allElements: StoryElement[],
  recentKeys: string[],
  theme: string,
  blueprintCategory?: string
): StoryElement | null {
  let candidates = allElements.filter(
    (e) =>
      (e.compatible_themes == null ||
        e.compatible_themes.length === 0 ||
        e.compatible_themes.includes(theme)) &&
      (blueprintCategory == null ||
        e.compatible_categories == null ||
        e.compatible_categories.length === 0 ||
        e.compatible_categories.includes(blueprintCategory as BlueprintCategory)) &&
      !recentKeys.includes(e.element_key)
  );
  if (candidates.length === 0) {
    candidates = allElements.filter(
      (e) =>
        (e.compatible_themes == null ||
          e.compatible_themes.length === 0 ||
          e.compatible_themes.includes(theme)) &&
        (blueprintCategory == null ||
          e.compatible_categories == null ||
          e.compatible_categories.length === 0 ||
          e.compatible_categories.includes(blueprintCategory as BlueprintCategory))
    );
  }
  if (candidates.length === 0) return null;
  const weights = candidates.map((e) => e.weight);
  return weightedRandom(candidates, weights);
}

// ─── Fetch all story_elements in one query ─────────────────────────────

type ElementRow = Record<string, unknown> & {
  id: string;
  element_key: string;
  element_type: string;
  content_en: string;
  labels: unknown;
  compatible_themes: string[] | null;
  compatible_categories: string[] | null;
  age_groups: string[];
  weight: number;
  is_active: boolean;
  created_at: string;
};

function rowToStoryElement(r: ElementRow): StoryElement {
  return {
    id: r.id,
    element_key: r.element_key,
    element_type: r.element_type as ElementType,
    content_en: r.content_en,
    labels: (r.labels as StoryElement['labels']) ?? null,
    compatible_themes: r.compatible_themes ?? null,
    compatible_categories: (r.compatible_categories as StoryElement['compatible_categories']) ?? null,
    age_groups: Array.isArray(r.age_groups) ? (r.age_groups as AgeGroup[]) : [],
    weight: typeof r.weight === 'number' ? r.weight : 10,
    is_active: r.is_active !== false,
    created_at: String(r.created_at ?? ''),
  };
}

async function fetchAllStoryElements(
  supabase: EmotionFlowSupabase
): Promise<StoryElement[]> {
  try {
    const res = await supabase
      .from('story_elements')
      .select('*')
      .eq('is_active', true)
      .in('element_type', ELEMENT_TYPES)
      .limit(500);
    if (res.error || !res.data) return [];
    const rows = Array.isArray(res.data) ? (res.data as ElementRow[]) : [];
    return rows.map(rowToStoryElement);
  } catch {
    return [];
  }
}

function filterByAge(elements: StoryElement[], ageGroup: string): StoryElement[] {
  return elements.filter(
    (e) =>
      e.age_groups.length === 0 || e.age_groups.includes(ageGroup as AgeGroup)
  );
}

// ─── Main selector ───────────────────────────────────────────────────

export async function selectStoryElements(
  params: ElementSelectorParams,
  supabase: EmotionFlowSupabase
): Promise<SelectedElements> {
  const { kidProfileId, ageGroup, theme, intensity, tone, blueprintCategory } =
    params;

  try {
    const [allElements, history] = await Promise.all([
      fetchAllStoryElements(supabase),
      getElementUsageHistory(supabase, kidProfileId, 30),
    ]);

    const byType = new Map<ElementType, StoryElement[]>();
    for (const et of ELEMENT_TYPES) {
      const list = filterByAge(
        allElements.filter((e) => e.element_type === et),
        ageGroup
      );
      byType.set(et, list);
    }

    const pick = (
      elementType: ElementType,
      required: boolean,
      fallback: StoryElement | null
    ): StoryElement | null => {
      const list = byType.get(elementType) ?? [];
      const recentKeys = getRecentKeysByType(history, elementType, 3);
      const chosen = selectOneElement(list, recentKeys, theme, blueprintCategory);
      if (chosen) return chosen;
      return required ? fallback : null;
    };

    const shouldMacguffin =
      shouldSelectElement('macguffin', {
        ageGroup,
        theme,
        intensity,
        tone,
        blueprintCategory,
      });
    const shouldSetting =
      shouldSelectElement('setting_detail', {
        ageGroup,
        theme,
        intensity,
        tone,
        blueprintCategory,
      });
    const shouldHumor = shouldSelectElement('humor_technique', {
      ageGroup,
      theme,
      intensity,
      tone,
      blueprintCategory,
    });
    const shouldTension = shouldSelectElement('tension_technique', {
      ageGroup,
      theme,
      intensity,
      tone,
      blueprintCategory,
    });

    const opening =
      pick('opening_style', true, FALLBACK_OPENING) ?? FALLBACK_OPENING;
    const perspective =
      pick('narrative_perspective', true, FALLBACK_PERSPECTIVE) ??
      FALLBACK_PERSPECTIVE;
    const closing =
      pick('closing_style', true, FALLBACK_CLOSING) ?? FALLBACK_CLOSING;

    return {
      opening,
      perspective,
      closing,
      macguffin: shouldMacguffin ? pick('macguffin', false, null) : null,
      settingDetail: shouldSetting ? pick('setting_detail', false, null) : null,
      humorTechnique: shouldHumor ? pick('humor_technique', false, null) : null,
      tensionTechnique: shouldTension
        ? pick('tension_technique', false, null)
        : null,
    };
  } catch {
    return {
      opening: FALLBACK_OPENING,
      perspective: FALLBACK_PERSPECTIVE,
      closing: FALLBACK_CLOSING,
      macguffin: null,
      settingDetail: null,
      humorTechnique: null,
      tensionTechnique: null,
    };
  }
}
