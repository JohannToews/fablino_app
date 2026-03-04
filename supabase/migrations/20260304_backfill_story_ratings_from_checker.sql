-- ============================================================
-- Backfill story_ratings from consistency_check_results
-- ============================================================
-- Source: consistency_check_results (issues_found, issues_corrected, issue_details)
-- Target: story_ratings (issues_found, issues_corrected, weakest_part, weakness_reason)
--
-- issue_details strings use two formats:
--   Old: [CATEGORY/SEVERITY] problem: "original" → fix
--   New: [CATEGORY:SUBCATEGORY/SEVERITY@segment] problem: "original" → fix
--
-- Run the DRY-RUN SELECT first to verify, then the UPDATE.

-- ─── DRY RUN: Preview what will be updated ───
-- Uncomment this SELECT to preview before running the UPDATE.

/*
SELECT
  r.id           AS rating_id,
  r.story_id,
  r.story_title,
  r.issues_found AS current_issues_found,
  c.issues_found AS new_issues_found,
  c.issues_corrected AS new_issues_corrected,
  c.issue_details
FROM public.story_ratings r
JOIN LATERAL (
  SELECT ccr.*
  FROM public.consistency_check_results ccr
  WHERE (ccr.story_id IS NOT NULL AND ccr.story_id = r.story_id)
     OR (ccr.story_id IS NULL AND ccr.story_title = r.story_title
         AND (ccr.user_id = r.user_id OR (ccr.user_id IS NULL AND r.user_id IS NULL)))
  ORDER BY
    CASE WHEN ccr.story_id IS NOT NULL THEN 0 ELSE 1 END,
    ccr.created_at DESC
  LIMIT 1
) c ON true
WHERE r.issues_found IS NULL;
*/

-- ─── ACTUAL UPDATE ───
UPDATE public.story_ratings AS r
SET
  issues_found     = c.issues_found,
  issues_corrected = c.issues_corrected,
  weakest_part     = c.derived_weakest_part,
  weakness_reason  = c.derived_weakness_reason
FROM (
  SELECT
    rat.id AS rating_id,
    ccr.issues_found,
    ccr.issues_corrected,

    -- Derive weakest_part from issue_details:
    -- Count segment references per detail string.
    -- New format: @beginning/@middle/@ending in the bracket prefix
    -- Old format: keyword heuristic fallback
    (SELECT
      CASE
        WHEN seg_counts.b >= seg_counts.m AND seg_counts.b >= seg_counts.e AND seg_counts.b > 0 THEN 'beginning'
        WHEN seg_counts.e >= seg_counts.m AND seg_counts.e >= seg_counts.b AND seg_counts.e > 0 THEN 'ending'
        WHEN seg_counts.m > 0 THEN 'middle'
        ELSE NULL
      END
     FROM (
       SELECT
         COUNT(*) FILTER (WHERE d ~ '@beginning\]' OR d ~* '\m(anfang|beginning|einleitung|eröffnung)\M') AS b,
         COUNT(*) FILTER (WHERE d ~ '@middle\]') AS m,
         COUNT(*) FILTER (WHERE d ~ '@ending\]' OR d ~* '\m(ende|ending|schluss|abschluss|resolution)\M') AS e
       FROM unnest(ccr.issue_details) AS d
     ) seg_counts
    ) AS derived_weakest_part,

    -- Derive weakness_reason from CRITICAL errors:
    -- New format: [CAT:SUBCAT/CRITICAL...] → extract CAT:SUBCAT
    -- Old format: [CAT/CRITICAL] → extract CAT
    (SELECT mode() WITHIN GROUP (ORDER BY cat)
     FROM (
       SELECT
         CASE
           WHEN d ~ '^\[[A-Z_]+:[A-Z_]+/CRITICAL' THEN (regexp_match(d, '^\[([A-Z_]+:[A-Z_]+)/CRITICAL'))[1]
           WHEN d ~ '^\[[A-Z_]+/CRITICAL' THEN (regexp_match(d, '^\[([A-Z_]+)/CRITICAL'))[1]
           ELSE NULL
         END AS cat
       FROM unnest(ccr.issue_details) AS d
     ) cats
     WHERE cat IS NOT NULL
    ) AS derived_weakness_reason

  FROM public.story_ratings rat
  JOIN LATERAL (
    SELECT cr.*
    FROM public.consistency_check_results cr
    WHERE (cr.story_id IS NOT NULL AND cr.story_id = rat.story_id)
       OR (cr.story_id IS NULL AND cr.story_title = rat.story_title
           AND (cr.user_id = rat.user_id OR (cr.user_id IS NULL AND rat.user_id IS NULL)))
    ORDER BY
      CASE WHEN cr.story_id IS NOT NULL THEN 0 ELSE 1 END,
      cr.created_at DESC
    LIMIT 1
  ) ccr ON true
  WHERE rat.issues_found IS NULL
) c
WHERE r.id = c.rating_id;
