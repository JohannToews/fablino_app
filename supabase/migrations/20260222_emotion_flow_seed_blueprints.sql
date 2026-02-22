-- ============================================================
-- Emotion-Flow-Engine: Seed Data — 21 Emotion Blueprints (Task 3.1)
-- Labels/descriptions: de + en only. Other languages via LLM later.
-- ON CONFLICT (blueprint_key) DO NOTHING for idempotency.
-- ============================================================

-- ─── 1. overconfidence_and_fall (growth) ──────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'overconfidence_and_fall',
  '{"de": "Übermut und Fall", "en": "Overconfidence and Fall"}',
  '{"de": "Kind überschätzt sich, scheitert, lernt Hilfe anzunehmen", "en": "Child overestimates themselves, fails, learns to accept help"}',
  'growth', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["overconfidence", "funny_failure", "accepting_help"],
      "arc_prompt": "The protagonist brags about doing something ALL BY THEMSELVES — building, solving, fixing. They try. It goes hilariously wrong (slapstick, exaggerated mess). A friend quietly helps. Together it works. Ending: a shared smile. Keep it LIGHT and FUNNY."
    },
    "8-9": {
      "steps": 4,
      "arc": ["overconfidence", "dismissing_others", "spectacular_failure", "humble_pride"],
      "arc_prompt": "The protagonist is SURE they can handle the challenge alone. They dismiss a friend''s offer to help — maybe even say something dismissive. The first step is easy. The second makes them pause. The THIRD breaks their plan completely — the failure should be exaggerated and partly funny, not sad. Now they have to go back to the friend they dismissed and ask for help. Show the HESITATION, the swallowed pride. The friend helps — not by doing it for them, but by showing a different approach. Together they succeed differently than imagined. End with quiet pride: ''maybe I don''t have to do everything alone.''"
    },
    "10-11": {
      "steps": 5,
      "arc": ["overconfidence", "dismissing_others", "spectacular_failure", "shame_and_pride", "asking_for_help"],
      "arc_prompt": "The protagonist doesn''t just think they can do it alone — they NEED to prove it. Maybe there''s a reason: someone doubted them, or they want to impress someone. They dismiss help from someone they consider less capable. Early success feeds the ego. Then a cascading failure — each fix creates a bigger problem. The LOW POINT: not just failure, but being SEEN failing by the person whose opinion matters. The hardest part: walking back to the person they dismissed. Write the internal struggle — the excuses they almost make, the words that stick in their throat. The friend''s response isn''t ''I told you so'' — it''s genuine. Together they find a solution that neither could have found alone. End with the realization that the friend''s different perspective was the missing piece. Quiet, earned pride."
    }
  }',
  'Child overestimates themselves, fails spectacularly, learns to accept help and value others'' perspectives',
  'Mix humor into the failure scene — the failure should be partly FUNNY, exaggerated, physical, not tragic. The shame should be brief, not crushing. The ending warmth should sneak up.',
  'medium → high → crash → low → medium → warm',
  'The help comes from the person the protagonist dismissed at the beginning. The friend''s ''useless'' hobby or skill turns out to be the key.',
  'Quiet pride. Not a triumphant fist-pump. A small smile and the thought: maybe I don''t have to do everything alone.',
  ARRAY['magic_fantasy', 'adventure_action', 'real_life', 'surprise'],
  ARRAY['8-9', '10-11'],
  ARRAY['frustration_tolerance', 'teamwork'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 2. fear_to_courage (growth) ──────────────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'fear_to_courage',
  '{"de": "Von Angst zu Mut", "en": "Fear to Courage"}',
  '{"de": "Kind überwindet eine konkrete Angst Schritt für Schritt", "en": "Child overcomes a specific fear step by step"}',
  'growth', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["specific_fear", "accidental_courage", "relief_and_joy"],
      "arc_prompt": "The protagonist is scared of something SPECIFIC and CONCRETE — a dark room, a big dog, the deep end of the pool. Not a monster, not something abstract. They want to avoid it. Then a situation makes them face it — maybe by accident, maybe to help someone they care about. The scary thing turns out to be less scary than imagined. Simple, warm relief. Keep the fear BRIEF and the resolution FAST. Use sensory details: what does the fear feel like in their tummy?"
    },
    "8-9": {
      "steps": 4,
      "arc": ["growing_fear", "avoidance_tactics", "forced_courage", "breakthrough"],
      "arc_prompt": "The protagonist has been avoiding something for a while — making excuses, taking detours, finding reasons not to. Maybe others don''t notice, or maybe someone has started to. Then a situation FORCES them to face it — someone needs help, or there''s no other way. The first moment is the worst: the shaking hands, the held breath. But they take ONE step. Then another. The scary thing is still scary, but they''re doing it. The breakthrough isn''t graceful — it''s shaky, imperfect, maybe even a little funny. But it''s REAL. Ending: earned pride and the thought ''I can do hard things.''"
    },
    "10-11": {
      "steps": 5,
      "arc": ["hidden_fear", "avoidance_and_shame", "exposure", "acting_despite_fear", "self_respect"],
      "arc_prompt": "The protagonist hides their fear because they think they SHOULD be over it by now. They''ve developed elaborate avoidance strategies that actually work — until they don''t. When someone discovers the fear, the SHAME of being afraid feels worse than the fear itself. Maybe someone says ''you''re still scared of THAT?'' This forces a choice: keep hiding, or face both the fear AND the embarrassment. The courage comes not from feeling brave but from being tired of the hiding. The moment of facing the fear: write it in slow motion. Every physical sensation. They don''t conquer the fear — they ACT DESPITE IT. The ending is quiet self-respect. Maybe the fear is still there, smaller now, but the protagonist knows they''re bigger than it."
    }
  }',
  'Child overcomes a specific fear step by step — courage is acting despite fear, not fearlessness',
  'The fear must feel REAL and specific — not abstract ''being scared'' but concrete physical sensations (stomach knots, sweaty palms, wobbly knees). The courage is NOT fearlessness — it''s acting DESPITE fear.',
  'high → higher → peak → release → warm',
  'The scary thing turns out to be different from what the protagonist imagined. The reality is manageable — it was the imagination that was terrifying.',
  'I was scared, but I did it anyway. Not fearless — brave.',
  ARRAY['magic_fantasy', 'adventure_action', 'real_life', 'surprise'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['self_confidence', 'emotional_regulation'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 3. failure_is_learning (growth) ──────────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'failure_is_learning',
  '{"de": "Scheitern ist Lernen", "en": "Failure is Learning"}',
  '{"de": "Kind scheitert, wird frustriert, findet einen neuen Weg", "en": "Child fails, gets frustrated, finds a new approach"}',
  'growth', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["excited_attempt", "messy_failure", "try_differently"],
      "arc_prompt": "The protagonist tries to do something with great enthusiasm — building, cooking, creating. It goes wrong in a funny, messy way. They''re upset for a moment, then notice something: the ''mistake'' actually looks interesting, or a friend shows them a different way. They try again DIFFERENTLY — not harder, differently. It works! Maybe not perfectly, but it works. Joy of discovery. Keep the failure FUN and the frustration SHORT."
    },
    "8-9": {
      "steps": 4,
      "arc": ["confident_start", "repeated_failure", "frustration_peak", "new_approach"],
      "arc_prompt": "The protagonist has a clear plan. They''re confident. Attempt one: doesn''t work. They try HARDER — same approach, more effort. Still doesn''t work. Frustration builds: maybe they blame the tools, the weather, bad luck. Third attempt: same approach, maximum effort. Spectacular failure. NOW the frustration peaks — they want to quit. But then they notice something they missed before, or they observe someone/something doing it completely differently. The shift: not trying harder, but trying SMARTER. A new approach — maybe inspired by something unexpected. It works. The satisfaction isn''t just about success — it''s about the discovery."
    },
    "10-11": {
      "steps": 5,
      "arc": ["ambitious_plan", "escalating_failures", "identity_crisis", "letting_go_of_the_plan", "creative_solution"],
      "arc_prompt": "The protagonist has invested in their approach — time, effort, maybe even told others about their plan. Early failures are easy to dismiss: bad luck, need more practice. But the failures keep coming and they''re getting harder to explain away. The CRISIS isn''t about the task — it''s about identity: ''Am I just not good enough?'' The protagonist considers quitting. Then a moment of letting go — not giving up on the GOAL, but giving up on the METHOD. This is different from trying harder. It requires admitting the original plan was wrong. The creative solution comes from connecting unrelated things — something they saw, experienced, or learned from a completely different context. The ending: ''The failures weren''t wasted — each one showed me what DOESN''T work, until I could see what does.''"
    }
  }',
  'Child fails, gets frustrated, discovers that trying differently (not harder) leads to creative solutions',
  'The frustration should feel authentic — not cute, not brief. Let the child SIT in the frustration for a moment. The new approach should come from observation or curiosity, not from an adult''s advice.',
  'high → crash → low → curious → rising → success',
  'The solution comes from an unexpected angle — a ''mistake'' from an earlier attempt turns out to be useful, or a completely different approach works.',
  'Satisfaction and a spark of curiosity: ''What else could I try?''',
  ARRAY['adventure_action', 'real_life', 'surprise'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['frustration_tolerance', 'perseverance'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 4. finding_your_voice (growth) ───────────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'finding_your_voice',
  '{"de": "Die eigene Stimme finden", "en": "Finding Your Voice"}',
  '{"de": "Kind überwindet Schüchternheit und verschafft sich Gehör", "en": "Child overcomes shyness and makes themselves heard"}',
  'growth', 'deep',
  '{
    "8-9": {
      "steps": 4,
      "arc": ["invisible", "overlooked", "inner_strength", "speaking_up"],
      "arc_prompt": "The protagonist has good ideas but never shares them — they think their ideas aren''t important enough, or they''re afraid of being wrong. They watch others get credit for similar ideas. The frustration builds silently. Then a moment where something MATTERS enough: an unfair situation, a wrong decision, a friend who needs defending. The words come out — imperfectly, shakily, maybe too loud or too soft. But they come out. And people LISTEN. Not because the protagonist is suddenly eloquent, but because the words are TRUE. Ending: a quiet realization — my voice was always there."
    },
    "10-11": {
      "steps": 5,
      "arc": ["self_silencing", "watching_others", "boiling_point", "imperfect_voice", "being_heard"],
      "arc_prompt": "The protagonist actively silences themselves — editing thoughts before they speak, deleting the text before sending, raising a hand and putting it down. They have REASONS: past embarrassment, someone who talked over them, a belief that ''people like me don''t speak up.'' They watch others speak confidently and feel a mix of admiration and resentment. The frustration builds through specific moments: an idea stolen, a decision made without asking, an injustice that nobody else seems to notice. The BOILING POINT: one moment too many. The protagonist speaks — and it''s NOT a perfect speech. The voice cracks. The sentence is messy. Maybe they say it wrong the first time and have to try again. But the CONTENT matters, and people can feel the authenticity. The surprise: others were feeling the same thing. The protagonist''s imperfect voice gave THEM permission to speak too. Ending: not ''I''m confident now'' but ''I spoke and the world didn''t end — I''ll do it again.''"
    }
  }',
  'Child overcomes shyness and self-silencing to make themselves heard — the voice shakes but it matters',
  'The silence should feel heavy. The moment of speaking up should feel like the loudest thing in the world — even if it''s actually quiet. Don''t make the protagonist suddenly confident. The voice shakes. The words come out wrong. But they COME OUT.',
  'low → frustrating → building → explosive → warm',
  'When the protagonist finally speaks, the reaction is not what they feared. People were waiting to hear from them.',
  'My voice matters. It was always there — I just hadn''t used it yet.',
  ARRAY['real_life', 'magic_fantasy', 'surprise'],
  ARRAY['8-9', '10-11'],
  ARRAY['self_confidence', 'conflict_resolution'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 5. standing_up_for_others (social) ───────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'standing_up_for_others',
  '{"de": "Für andere einstehen", "en": "Standing Up for Others"}',
  '{"de": "Kind beobachtet Ungerechtigkeit und findet Mut einzugreifen", "en": "Child witnesses injustice and finds courage to intervene"}',
  'social', 'medium',
  '{
    "8-9": {
      "steps": 4,
      "arc": ["witnessing_unfairness", "internal_conflict", "stepping_forward", "belonging"],
      "arc_prompt": "The protagonist sees something unfair happening — someone being excluded, blamed for something they didn''t do, or being treated differently. It bothers them, but speaking up feels risky: what if they become the next target? They try to ignore it. Can''t. They try indirect solutions — hinting, hoping someone else will step in. Nobody does. Then a moment where the unfairness gets worse, and the protagonist realizes: if not me, who? They step forward. Not with a big speech, but with a simple action or sentence. The reaction: the person being treated unfairly looks up with surprise and gratitude. Others who were also uncomfortable start joining. The unfairness doesn''t magically disappear, but it''s no longer invisible. Ending: belonging — the protagonist is now part of something good."
    },
    "10-11": {
      "steps": 5,
      "arc": ["witnessing", "rationalizing_inaction", "growing_discomfort", "costly_action", "earned_belonging"],
      "arc_prompt": "The protagonist witnesses ongoing unfairness — not a single event, but a pattern. They notice. Others seem not to (or choose not to). The protagonist rationalizes not acting: ''It''s not my problem,'' ''Maybe I''m overreacting,'' ''What can one person do?'' But the discomfort grows physically — it''s harder to laugh at the lunch table, harder to pretend everything is fine. The TURNING POINT: a moment where staying silent would make the protagonist complicit. The ACTION costs something real — social standing, convenience, a friendship. It''s not a heroic speech but a clear, firm sentence that names what''s happening. The aftermath is complicated: some people are grateful, some are angry, some pretend nothing happened. But the dynamic has shifted. Ending: the protagonist feels lighter. Being honest was harder than being silent, but silence had its own weight."
    }
  }',
  'Child witnesses injustice and finds the courage to intervene — standing up costs something but creates belonging',
  'The injustice must feel WRONG to the reader — not just told, but shown. The protagonist''s fear of intervening must be understandable. Standing up should cost something.',
  'witnessing → uncomfortable → tense → brave → relief + belonging',
  'Standing up doesn''t fix everything instantly. But it changes the dynamic — others join in, or the unfairness becomes visible to everyone.',
  'Proud and connected. ''I did the right thing, and I''m not alone.''',
  ARRAY['real_life', 'adventure_action', 'magic_fantasy'],
  ARRAY['8-9', '10-11'],
  ARRAY['fairness', 'empathy', 'conflict_resolution'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 6. the_outsider (social) ─────────────────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'the_outsider',
  '{"de": "Der Außenseiter", "en": "The Outsider"}',
  '{"de": "Kind ist anders, versucht sich anzupassen, wird am Ende für sein Anderssein geschätzt", "en": "Child is different, tries to fit in, is eventually valued for being different"}',
  'social', 'deep',
  '{
    "8-9": {
      "steps": 4,
      "arc": ["being_different", "trying_to_fit", "failing_to_fit", "valued_for_difference"],
      "arc_prompt": "The protagonist is noticeably different — a unique hobby, a way of seeing things, a skill nobody else cares about, a background that''s unfamiliar. They want to belong. They try to hide or change the thing that makes them different. It works for a moment — they blend in. But it feels wrong, like wearing shoes that don''t fit. Then a situation where their UNIQUE quality is exactly what''s needed. Nobody else can do it. The surprise on others'' faces. The protagonist realizes: fitting in meant becoming invisible, but being themselves made them irreplaceable. Ending: a new friendship based on who they actually are."
    },
    "10-11": {
      "steps": 5,
      "arc": ["painfully_different", "performance_of_normal", "identity_loss", "crisis_moment", "authentic_belonging"],
      "arc_prompt": "The protagonist is tired of being ''the different one.'' They study what ''normal'' looks like and start performing it — the right clothes, the right words, the right interests. It works. They''re included. But the inclusion feels hollow. The protagonist starts losing track of who they actually are — they can''t remember if they really like the music or if they''re pretending. The CRISIS: a moment that requires authenticity. Maybe someone asks a genuine question. Maybe a situation needs the exact skill/perspective the protagonist has been hiding. The choice: maintain the disguise or show up as themselves. They choose authenticity — not dramatically, but quietly. They stop pretending. Some people are confused. One person is relieved: ''I thought it was just me.'' Ending: not fitting IN but fitting TOGETHER. A smaller circle, but real."
    }
  }',
  'Child is different, tries to conform, discovers that authenticity creates deeper belonging than fitting in',
  'The loneliness must be felt, not just told. The adaptation attempts should be slightly heartbreaking — the protagonist changing themselves to fit. The moment of acceptance should come from an unexpected direction.',
  'lonely → hopeful → disappointed → accepting → surprised → warm',
  'The thing that made them different is exactly what''s needed in a crucial moment. Their ''weakness'' is actually a unique strength.',
  'I don''t need to change to belong. The right people will value me for who I am.',
  ARRAY['real_life', 'magic_fantasy', 'surprise'],
  ARRAY['8-9', '10-11'],
  ARRAY['self_confidence', 'diversity_appreciation'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 7. misunderstanding_resolved (social) ────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'misunderstanding_resolved',
  '{"de": "Das große Missverständnis", "en": "Misunderstanding Resolved"}',
  '{"de": "Freundschaft wird durch ein Missverständnis auf die Probe gestellt", "en": "Friendship tested by a misunderstanding"}',
  'social', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["friendship", "misunderstanding", "talking_it_out"],
      "arc_prompt": "Two good friends. One does something the other misunderstands — maybe taking something that was actually meant as a surprise, or saying something that sounds mean but wasn''t. Hurt feelings. They avoid each other. Then someone (or something) brings them together and they TALK. ''Oh! I thought you meant...'' ''No! I was trying to...'' Relief and laughter. They were both wrong about what happened. Ending: a hug or a shared laugh. Keep it SIMPLE and FAST — the misunderstanding should be easy for a 6-year-old to understand."
    },
    "8-9": {
      "steps": 4,
      "arc": ["close_friendship", "ambiguous_event", "growing_distance", "perspective_shift"],
      "arc_prompt": "Best friends. Then an event that LOOKS bad from one angle — the protagonist sees or hears something incomplete. They don''t ask about it — they ASSUME. The friend notices the distance and doesn''t understand it. Both are hurt: one feels betrayed, the other feels rejected without knowing why. The distance grows. Then a moment that forces them together — a shared task, an emergency, a third person who accidentally reveals the truth. The PERSPECTIVE SHIFT: the protagonist sees the event from the friend''s side and everything clicks. The conversation that follows is awkward and real: ''I thought you...'' ''But I was actually...'' Ending: ''Next time, I''ll ask before I assume.''"
    },
    "10-11": {
      "steps": 5,
      "arc": ["deep_friendship", "interpreted_betrayal", "cold_war", "forced_proximity", "mutual_understanding"],
      "arc_prompt": "A friendship with history. Then something happens that the protagonist interprets as betrayal — the friend chose someone else, shared a secret, or wasn''t there when it mattered. The protagonist doesn''t confront — they go cold. Polite but distant. The friend is confused, then hurt, then defensive. Both construct narratives about the other: ''They never really cared.'' A cold war of avoided eyes and careful words. Then forced proximity — they HAVE to work together, be in the same space, deal with the same problem. Slowly, through action not words, they see glimpses of the friend they remember. A crack appears in the wall. Finally: the conversation. It''s messy. Both have legitimate feelings. The revelation: each was trying to protect or help the other, and it backfired. The reconciliation isn''t ''you were right, I was wrong'' — it''s ''we both saw the same thing differently.'' Ending: the friendship is different now — more honest, with a new rule: talk before assuming."
    }
  }',
  'Friendship tested by misunderstanding — both sides had good intentions that collided, resolved through honest conversation',
  'Both sides must be understandable — the reader should see HOW the misunderstanding happened. The resolution comes from LISTENING, not from one person being right.',
  'warm → confusing → angry/hurt → understanding → warmer',
  'When they finally talk, they discover they were both trying to do something NICE for each other — their good intentions collided.',
  'Relief and a friendship that feels stronger because it survived a test.',
  ARRAY['real_life', 'adventure_action', 'surprise'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['conflict_resolution', 'empathy'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 8. unexpected_friendship (social) ────────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'unexpected_friendship',
  '{"de": "Unerwartete Freundschaft", "en": "Unexpected Friendship"}',
  '{"de": "Zwei sehr verschiedene Kinder entdecken eine überraschende Verbindung", "en": "Two very different children discover a surprising connection"}',
  'social', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["different", "stuck_together", "surprise_connection"],
      "arc_prompt": "Two kids who seem COMPLETELY different — one loud, one quiet; one likes mud, one likes books; one is big, one is small. They have to be together (seating arrangement, paired up, neighbors). Both are unhappy about it. Then they discover ONE thing they both love — an unexpected shared interest, a game only they know, a similar funny habit. Surprise and delight. They end up having the best time. Keep it LIGHT and let the discovery be funny."
    },
    "8-9": {
      "steps": 4,
      "arc": ["mutual_prejudice", "forced_proximity", "accidental_discovery", "genuine_connection"],
      "arc_prompt": "Two kids who have decided they don''t like each other — based on assumptions, different friend groups, a past incident, or just vibes. A situation forces them to cooperate: a shared project, getting lost together, being the only two left. The initial cooperation is tense and reluctant. Then an ACCIDENTAL DISCOVERY — a shared secret, an identical fear, a hobby they''d be embarrassed to admit to their ''real'' friends. The surprise breaks the ice. Working together, they discover they complement each other — one''s weakness is the other''s strength. Ending: not ''best friends forever'' but ''huh. you''re actually pretty cool.''"
    },
    "10-11": {
      "steps": 5,
      "arc": ["confirmed_prejudices", "reluctant_alliance", "cracks_in_armor", "vulnerability_shared", "real_friendship"],
      "arc_prompt": "Two protagonists from different worlds — different social groups, backgrounds, interests. Each has a mental picture of the other that''s mostly wrong. Circumstances force an alliance (a project, a problem, a shared enemy). The alliance is strategic, not personal: ''I don''t have to like you, we just have to get this done.'' Gradually, cracks: one of them drops their guard in a small way — an unguarded reaction, an accidental confession, a moment of genuine emotion. The other is surprised: that''s not what they expected. The TURNING POINT: a moment of shared vulnerability. One admits something real — a fear, a struggle, a secret — and the other recognizes it because they feel the same thing. The walls come down not because someone decided to be open, but because genuine connection is stronger than performed distance. Ending: a friendship that doesn''t make sense on paper but feels real."
    }
  }',
  'Two very different children discover a surprising connection — the best friendships are often the most unexpected',
  'The initial resistance should be MUTUAL — both have reasons to not like each other. The discovery of common ground should be accidental, not forced.',
  'resistant → awkward → surprised → curious → connected',
  'They discover they have an identical secret passion, fear, or experience that nobody else understands.',
  'The best people are often the ones you''d never have chosen.',
  ARRAY['real_life', 'adventure_action', 'magic_fantasy', 'surprise'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['diversity_appreciation', 'empathy', 'teamwork'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 9. letting_go (social) ───────────────────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'letting_go',
  '{"de": "Loslassen", "en": "Letting Go"}',
  '{"de": "Kind muss etwas/jemanden loslassen und findet Neues", "en": "Child has to let go of something/someone and finds something new"}',
  'social', 'deep',
  '{
    "8-9": {
      "steps": 4,
      "arc": ["holding_on", "change_is_coming", "sadness", "new_beginning"],
      "arc_prompt": "The protagonist loves something that''s changing — a friend moving away, a favorite place closing, a pet growing old, a phase ending. They try to hold on: collecting memories, making it last, resisting the change. But it''s happening. The sadness arrives — let it be REAL, not cute. A moment of genuine loss. Then, slowly: something new appears in the space that was made. Not a replacement — something different. A new friendship, a new place, a new chapter. The protagonist realizes they can carry the old love AND welcome the new thing. Ending: looking back with warmth and forward with curiosity."
    },
    "10-11": {
      "steps": 5,
      "arc": ["clinging", "bargaining", "grief", "empty_space", "unexpected_growth"],
      "arc_prompt": "The protagonist is facing a loss they can''t prevent — a best friend moving countries, a beloved grandparent''s decline, the end of childhood in some concrete way. They cling: making plans to keep everything the same, denying the change, getting angry at it. Bargaining: ''If I do X, maybe it won''t happen.'' But it does. The GRIEF should be specific and physical — a empty chair, a quiet room, a missing voice. Don''t solve it quickly. Let the protagonist sit with the emptiness. Then, in the space that the loss created, something unexpected grows — not a replacement, but a discovery that was only possible because of the change. Maybe a quality in themselves they didn''t know about, a new connection, a way of seeing the world differently. The ending is bittersweet: ''I miss what was. And I''m grateful for what is. Both things are true.''"
    }
  }',
  'Child must let go of something precious and discovers that loss creates space for unexpected growth',
  'Don''t rush the sadness. Let it breathe. But the story should NOT be sad overall — bittersweet. The new thing doesn''t REPLACE what was lost — it''s different and good in its own way.',
  'clinging → resisting → sad → open → curious → bittersweet-warm',
  'Letting go creates space for something the protagonist couldn''t have imagined. The loss enabled the gain.',
  'It''s okay to be sad about something ending AND happy about something beginning.',
  ARRAY['real_life', 'magic_fantasy'],
  ARRAY['8-9', '10-11'],
  ARRAY['emotional_regulation', 'resilience'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 10. first_time (courage) ─────────────────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'first_time',
  '{"de": "Das erste Mal", "en": "First Time"}',
  '{"de": "Kind erlebt etwas zum ersten Mal — Aufregung, Angst und Triumph", "en": "Child experiences something for the first time — excitement, fear, and triumph"}',
  'courage', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["excited_nervous", "small_setback", "i_did_it"],
      "arc_prompt": "The protagonist is about to do something for the FIRST TIME — first day, first swim, first sleepover, first performance. Butterflies in the tummy: half excited, half scared. They start. A small thing goes wrong — not catastrophic, but it feels huge. A wobble, a mistake, a moment of ''I can''t do this.'' Then: they try again. This time it works! The joy is BIG and PHYSICAL — jumping, laughing, running to tell someone. Keep the story ENERGETIC. The emotion is pure: fear → determination → JOY."
    },
    "8-9": {
      "steps": 4,
      "arc": ["anticipation", "rocky_start", "almost_quitting", "earned_triumph"],
      "arc_prompt": "The protagonist has been looking forward to AND dreading this first time. They''ve prepared — maybe overprepared. The START goes differently than expected: harder in some ways, easier in others. A setback shakes their confidence — they compare themselves to others who seem to find it easy. A moment of ''maybe this isn''t for me.'' But something pulls them back: curiosity, stubbornness, or seeing someone else struggle too. They push through — not perfectly, not gracefully, but genuinely. The TRIUMPH isn''t being the best — it''s having done it. Ending: already looking forward to the second time."
    },
    "10-11": {
      "steps": 5,
      "arc": ["identity_anticipation", "unexpected_challenge", "doubt", "redefining_success", "growth"],
      "arc_prompt": "The protagonist has built this first time up in their mind — it''s part of who they want to become. The reality is different: the challenge isn''t where they expected it. They prepared for the SKILL but not for the FEELING — the vulnerability of being a beginner, the exposure of not being good yet. Watching others who are further ahead. The doubt goes deep: ''Maybe I''m not the kind of person who...'' The shift: redefining what success means. Not being perfect at it, but being brave enough to be bad at it in public. The growth isn''t mastery — it''s the willingness to start. Ending: ''I''m a beginner. And that''s the most exciting thing to be.''"
    }
  }',
  'Child experiences something for the first time — the mix of excitement and fear, setback and triumph',
  'The mix of excitement and nervousness should be physical — butterflies, wiggly legs, can''t-sit-still energy. The setback should be small but feel huge. The triumph should be FELT, not just achieved.',
  'excited → nervous → setback → determination → triumph',
  'The hardest part isn''t what they expected — the thing they prepared for was easy, but something else was the real challenge.',
  'I did it! And I want to do it again.',
  ARRAY['real_life', 'adventure_action', 'surprise'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['self_confidence', 'perseverance'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 11. protecting_something_small (courage) ─────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'protecting_something_small',
  '{"de": "Etwas Kleines beschützen", "en": "Protecting Something Small"}',
  '{"de": "Kind entdeckt etwas Verletzliches und riskiert etwas, um es zu beschützen", "en": "Child discovers something vulnerable and takes risks to protect it"}',
  'courage', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["discovery", "danger", "brave_protection"],
      "arc_prompt": "The protagonist finds something small and vulnerable — a lost baby animal, a tiny plant, a scared creature, a fragile object. They immediately care about it. Then something threatens it — weather, a bigger animal, someone careless. The protagonist has to be BRAVE — stand in front of it, carry it somewhere safe, shout ''STOP!'' The bravery surprises even them. The small thing is safe. Maybe it nuzzles them, or blooms, or makes a happy sound. Warmth and pride. Keep it TENDER and SENSORY."
    },
    "8-9": {
      "steps": 4,
      "arc": ["finding_and_bonding", "growing_responsibility", "serious_threat", "sacrifice_and_reward"],
      "arc_prompt": "The protagonist discovers something that needs care — a wounded animal, a hidden garden, a secret that someone vulnerable shared. They take responsibility: checking on it, protecting it, keeping it secret. It becomes important to them. Then a REAL threat appears — not just inconvenient but dangerous. Protecting the thing will cost something: comfort, safety, a plan they had. The protagonist chooses to protect anyway. The action requires courage they didn''t know they had — not fighting courage but STANDING FIRM courage. In the resolution, the thing they protected gives something back unexpectedly. Ending: ''I didn''t know I could be this brave. It wasn''t for me — that''s why it was easy.''"
    },
    "10-11": {
      "steps": 5,
      "arc": ["reluctant_discovery", "growing_attachment", "moral_complexity", "costly_choice", "reciprocal_gift"],
      "arc_prompt": "The protagonist didn''t WANT this responsibility — they stumbled into it. A creature, a person, a secret that they can''t un-know. They try to pass it off to someone else: ''This isn''t my problem.'' But nobody else steps up, or nobody else knows. The attachment grows despite resistance. Then the threat becomes real and complicated — protecting this thing conflicts with something else the protagonist wants. It''s not villain vs hero — it''s two legitimate needs in conflict. The choice to protect costs something real and specific. The protagonist acts not out of heroism but out of ''I couldn''t live with myself if I didn''t.'' In the aftermath, the thing they protected gives back — not in an equal exchange, but in a way that changes how the protagonist sees the world. Ending: ''Sometimes being responsible for something small teaches you how big your heart actually is.''"
    }
  }',
  'Child discovers something vulnerable and becomes braver than they thought possible to protect it',
  'The tenderness of caring for something small should contrast with the danger. The protagonist becomes braver than they thought possible — not for themselves, but for the thing they''re protecting.',
  'tender → worried → dangerous → brave → warm',
  'The small thing they protected gives something back — saves them in return, reveals a gift, or simply being there was the real treasure.',
  'Being responsible for something small made me bigger.',
  ARRAY['magic_fantasy', 'adventure_action', 'real_life', 'surprise'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['responsibility', 'empathy'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 12. doing_the_right_thing (courage) ──────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'doing_the_right_thing',
  '{"de": "Das Richtige tun", "en": "Doing the Right Thing"}',
  '{"de": "Kind steht vor einer Versuchung und ringt mit dem Gewissen", "en": "Child faces temptation and wrestles with their conscience"}',
  'courage', 'medium',
  '{
    "8-9": {
      "steps": 4,
      "arc": ["temptation", "inner_argument", "hard_choice", "good_conscience"],
      "arc_prompt": "The protagonist has a chance to get something they REALLY want — but at someone else''s expense. Maybe they find something that isn''t theirs, or could take credit for someone else''s work, or could get away with a lie that benefits them. The temptation is real: nobody would know. The inner argument: ''It''s not a big deal...'' vs ''But what if...'' They imagine taking the easy path. Then imagine the other person finding out. The CHOICE: they do the right thing. It''s not easy — they lose the thing they wanted. Maybe nobody even thanks them. But walking home, they feel lighter. Their conscience is clean. Ending: a small private smile."
    },
    "10-11": {
      "steps": 5,
      "arc": ["opportunity", "rationalization", "escalation", "moral_clarity", "integrity"],
      "arc_prompt": "The protagonist discovers an opportunity that''s too good — but it''s not entirely honest. It starts small and easy to rationalize: ''Everyone does it,'' ''They won''t miss it,'' ''I deserve this.'' The protagonist takes the first step. Then a second, bigger step becomes possible. The rationalization gets harder. A moment of CLARITY: they see themselves from the outside and don''t like what they see. Maybe they witness the impact on the other person, or imagine someone they respect watching them. The decision to STOP and make it right costs something real — reputation, reward, convenience. The aftermath: not a parade, not a thank-you. Just the protagonist knowing who they are. Others might never know what they chose. But the protagonist knows. Ending: ''The right thing is rarely the easy thing. But I know which one helps me sleep.''"
    }
  }',
  'Child faces genuine temptation and wrestles with their conscience — doing the right thing costs something real',
  'The temptation must be genuinely tempting — not obviously wrong. The inner conflict should feel like two voices arguing. The right choice should cost something real.',
  'tempted → conflicted → rationalizing → decision → consequences → peace',
  'Doing the right thing doesn''t get immediate reward — maybe nobody even notices. But the protagonist notices the difference in themselves.',
  'A clean conscience. The quiet satisfaction of knowing who you are when nobody''s watching.',
  ARRAY['real_life', 'adventure_action', 'surprise'],
  ARRAY['8-9', '10-11'],
  ARRAY['honesty', 'responsibility', 'fairness'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 13. walking_in_their_shoes (empathy) ─────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'walking_in_their_shoes',
  '{"de": "In ihren Schuhen", "en": "Walking in Their Shoes"}',
  '{"de": "Kind lernt die Perspektive einer anderen Person zu verstehen", "en": "Child learns to understand another person''s perspective"}',
  'empathy', 'medium',
  '{
    "8-9": {
      "steps": 4,
      "arc": ["quick_judgment", "accidental_insight", "oh_moment", "changed_behavior"],
      "arc_prompt": "The protagonist judges someone based on what they see — the grumpy neighbor, the weird kid, the strict teacher, the strange behavior. They make up a story about why that person is ''like that.'' Then an accidental insight: they overhear something, get paired together, or end up in the person''s space. They discover the REASON behind the behavior — something they never would have guessed. The grumpy person is actually scared. The weird behavior is actually a solution to a problem nobody knows about. The ''OH'' moment: everything looks different now. The protagonist changes their behavior — not dramatically, but meaningfully. A small kindness that shows they understand. Ending: ''I almost missed knowing this person because I thought I already knew them.''"
    },
    "10-11": {
      "steps": 5,
      "arc": ["confident_opinion", "contradicting_evidence", "curiosity", "full_picture", "humility"],
      "arc_prompt": "The protagonist has a CONFIDENT opinion about someone — not cruel, just certain. Everyone seems to agree. Then small contradictions appear: the ''lazy'' kid working harder than anyone when nobody''s watching, the ''mean'' girl being incredibly gentle with animals. Curiosity replaces certainty. The protagonist starts noticing things they missed before. Then the FULL PICTURE: they learn the story behind the person. It doesn''t excuse everything, but it explains everything. The person is dealing with something the protagonist can barely imagine. The SHIFT: not from judgment to admiration, but from certainty to humility. The protagonist realizes their confident opinion was built on a tiny fraction of the truth. Ending: ''My opinion was three words long. Their story would fill a book. I''ll try to read more of it next time.''"
    }
  }',
  'Child learns that everyone has a story — judging based on appearances misses the full picture',
  'The initial judgment should be relatable — something the reader might also think. The perspective shift should feel like an ''OH'' moment, not a lecture.',
  'judgmental → curious → surprised → understanding → compassionate',
  'The person they judged has a reason that makes COMPLETE sense once you know it. The protagonist feels embarrassed about their earlier judgment.',
  'Everyone has a story I don''t know yet. I''ll ask before I judge.',
  ARRAY['real_life', 'magic_fantasy', 'surprise'],
  ARRAY['8-9', '10-11'],
  ARRAY['empathy', 'diversity_appreciation'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 14. the_invisible_helper (empathy) ───────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'the_invisible_helper',
  '{"de": "Der unsichtbare Helfer", "en": "The Invisible Helper"}',
  '{"de": "Jemand hilft im Verborgenen — und löst eine Kettenreaktion der Freundlichkeit aus", "en": "Someone helps secretly — triggering a chain reaction of kindness"}',
  'empathy', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["mysterious_help", "discovery", "helping_back"],
      "arc_prompt": "Something good keeps happening to the protagonist — their problem gets solved, their lost thing appears, a small gift shows up. WHO is doing this? The protagonist investigates (this is fun and detective-like). They discover it''s someone unexpected — the shy kid, the grumpy-looking cat, the neighbor they never talk to. Warm surprise. The protagonist decides to be an invisible helper for someone else. The kindness spreads. Keep it PLAYFUL and SWEET."
    },
    "8-9": {
      "steps": 4,
      "arc": ["noticing_kindness", "investigating", "discovering_the_helper", "chain_reaction"],
      "arc_prompt": "The protagonist notices small acts of kindness happening around them — anonymous ones. A fixed fence, a shared umbrella left behind, someone''s homework saved from the rain. Curiosity takes over: who is this invisible helper? The investigation reveals clues. The helper turns out to be someone SURPRISING — someone the protagonist had overlooked or judged. The warm discovery: this person has been quietly helping for a long time, without ever being thanked. The protagonist is moved. They start their own invisible helping — and someone else notices. The chain grows. Ending: ''Being kind when nobody''s watching is the best kind of kind.''"
    },
    "10-11": {
      "steps": 5,
      "arc": ["taking_help_for_granted", "crisis_of_absence", "investigation", "humbling_discovery", "paying_forward"],
      "arc_prompt": "The protagonist doesn''t notice the small things that make their life work — until they stop. Suddenly things go wrong: the thing that was always there isn''t. The person who always helped didn''t show up. The protagonist investigates — not out of kindness but out of need. The trail leads to someone invisible: the janitor, the early-morning baker, the classmate who always cleaned up without being asked. The discovery is HUMBLING: this person has been carrying weight that nobody acknowledged. The protagonist feels two things: gratitude and shame for not noticing sooner. They can''t repay it all, but they can START. A small, consistent act of helping — not for credit, but because they''ve seen what invisible help looks like. Ending: ''The world runs on people who do things nobody thanks them for. I want to be one of them.''"
    }
  }',
  'Someone helps secretly, triggering a chain reaction of kindness — invisible help is the most powerful kind',
  'The mystery of ''who is helping?'' should drive curiosity. The reveal should be warm, not dramatic. The chain reaction of kindness should feel natural, not preachy.',
  'puzzled → curious → investigating → warm reveal → expanding warmth',
  'The invisible helper is someone the protagonist underestimated or didn''t notice — the quiet person, the unlikely candidate.',
  'Kindness multiplies. One person''s quiet act can change everything.',
  ARRAY['real_life', 'magic_fantasy', 'surprise'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['kindness', 'teamwork'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 15. forgiving (empathy) ──────────────────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'forgiving',
  '{"de": "Vergeben", "en": "Forgiving"}',
  '{"de": "Kind wird verletzt, erlebt Wut, und findet einen Weg zu vergeben (nicht zu vergessen)", "en": "Child is hurt, experiences anger, and finds a way to forgive (not forget)"}',
  'empathy', 'deep',
  '{
    "8-9": {
      "steps": 4,
      "arc": ["being_hurt", "justified_anger", "understanding_why", "choosing_peace"],
      "arc_prompt": "Someone the protagonist cares about does something hurtful — breaks a promise, says something mean, chooses someone else. The hurt is REAL. The anger is JUSTIFIED. The protagonist replays the moment, wishes they could change it, maybe fantasizes about revenge or about never talking to that person again. Time passes. Then they learn WHY the person did it — not an excuse, but a reason. The person was scared, or confused, or dealing with their own problem. Understanding doesn''t make it okay. But it makes it SMALLER. The protagonist decides to forgive — not for the other person, but because carrying the anger was getting heavy. Ending: ''I remember what happened. But I''m not angry anymore. And that feels good.''"
    },
    "10-11": {
      "steps": 5,
      "arc": ["betrayal", "anger_and_rumination", "stuck_in_pain", "glimpse_of_context", "choosing_to_let_go"],
      "arc_prompt": "The protagonist is hurt by someone who mattered — a trusted friend, a family member, someone who should have known better. The hurt cuts deep because it was personal. The anger feels RIGHTEOUS — they SHOULD be angry. And they are. They replay the scene, construct arguments, imagine confrontations. But the anger starts to poison other things: they can''t enjoy something unrelated, they snap at innocent people, the weight is constant. STUCK. Then: a glimpse of the other person''s world. Not an excuse, but context. The person who hurt them is also struggling with something. This doesn''t make it okay — the protagonist explicitly thinks ''this doesn''t make it okay.'' But it makes the person human instead of a villain. The CHOICE: not to reconcile necessarily, but to put down the anger. Not because the other person deserves forgiveness, but because the protagonist deserves peace. Ending: ''Forgiving isn''t saying it was okay. It''s saying I''m done letting it control my days.''"
    }
  }',
  'Child is hurt, experiences justified anger, and discovers that forgiveness is freedom for yourself — not a gift to the other person',
  'The hurt must be legitimate — not trivial. The anger is justified. Forgiveness is NOT forgetting, NOT saying it was okay. It''s choosing to let go of the weight for YOUR own sake. This is a nuanced blueprint — handle with care.',
  'hurt → angry → stuck → understanding → release → peace',
  'Understanding WHY someone hurt you doesn''t excuse it — but it takes away its power. The person who hurt them is also hurting.',
  'Forgiveness isn''t a gift to them — it''s freedom for me. I remember, but I''m not carrying it anymore.',
  ARRAY['real_life', 'surprise'],
  ARRAY['8-9', '10-11'],
  ARRAY['emotional_regulation', 'conflict_resolution'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 16. chaos_cascade (humor) ────────────────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'chaos_cascade',
  '{"de": "Chaos-Kaskade", "en": "Chaos Cascade"}',
  '{"de": "Kleiner Fehler wird zur Lawine — totales Chaos mit befreiendem Lachen", "en": "Small mistake snowballs into total chaos with liberating laughter"}',
  'humor', 'light',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["tiny_mistake", "bigger_mess", "hilarious_result"],
      "arc_prompt": "Something small goes wrong — a spill, a tumble, a pulled thread. It causes something BIGGER to go wrong. Which causes something EVEN BIGGER. Use the DOMINO EFFECT — each disaster causes the next. Make it VISUAL and PHYSICAL: things falling, splashing, rolling, crashing. The mess gets more and more ridiculous. At the peak of chaos: everything stops. Beat. Then the protagonist looks around at the ridiculous scene and starts LAUGHING. Maybe the chaos accidentally created something wonderful — the biggest bubble ever, a surprise rainbow of paint, a tower of wobbling objects that somehow holds. Keep it FAST, LOUD, and JOYFUL."
    },
    "8-9": {
      "steps": 4,
      "arc": ["innocent_action", "escalating_disasters", "peak_absurdity", "silver_lining"],
      "arc_prompt": "The protagonist does something perfectly normal — opens a door, pulls a lever, says an innocent sentence. This triggers a CHAIN REACTION. Each attempt to fix the previous mistake makes things worse. The protagonist runs from problem to problem, leaving more chaos in their wake. ESCALATION: tiny puddle → small flood → the whole room is a swimming pool. Each stage should make the reader think ''it can''t get worse'' — and then it does. At PEAK ABSURDITY: everything converges at the same moment. The protagonist stands in the middle of total chaos, completely defeated. Beat. Then they notice: the chaos accidentally created something amazing. The flood watered the dying garden. The explosion mixed the perfect color. The disaster was actually the solution. Exhausted, incredulous laughter."
    },
    "10-11": {
      "steps": 4,
      "arc": ["confident_plan", "first_domino", "exponential_escalation", "accidental_masterpiece"],
      "arc_prompt": "The protagonist has a PLAN — carefully thought out, detailed, foolproof. Step one: executed perfectly. Step two: a tiny deviation. The protagonist tries to fix it (this makes it worse). Now they''re improvising, which triggers more problems. Each fix creates TWO new problems (exponential chaos). The HUMOR shifts: first it''s ''oh no,'' then it''s ''this is unbelievable,'' then it''s so absurd the protagonist starts laughing IN the chaos. Include the moment where they GIVE UP trying to control it and just ride the wave. The CLIMAX: everything crashes together in one spectacular moment. Silence. Then the reveal: the chaotic result is actually BRILLIANT — better than the original plan. The protagonist realizes that control was the problem. Ending: ''Next time I''ll just let it go wrong from the start — saves time.''"
    }
  }',
  'Small mistake snowballs into spectacular chaos — each fix makes it worse until the accidental result is better than the plan',
  'Each escalation should be BIGGER and MORE ABSURD than the last. The humor is in the inevitability — the reader can SEE the next disaster coming. Physical comedy, visual humor, sound effects welcome.',
  'oops → oh no → OH NO → CATASTROPHE → everything collapses → laughter',
  'The final result of all the chaos is accidentally BETTER than what was originally planned.',
  'Exhausted laughter. ''I can''t believe that just happened.''',
  ARRAY['real_life', 'magic_fantasy', 'adventure_action', 'surprise'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY[]::TEXT[],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 17. the_plan_that_backfires (humor) ──────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'the_plan_that_backfires',
  '{"de": "Der Plan, der schiefgeht", "en": "The Plan That Backfires"}',
  '{"de": "Genialer Plan hat unerwartete Nebenwirkungen — es klappt anders als gedacht", "en": "Genius plan has unexpected side effects — it works out differently than planned"}',
  'humor', 'light',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["great_idea", "opposite_result", "happy_surprise"],
      "arc_prompt": "The protagonist has a GREAT IDEA to solve a problem — a clever trick, a creative shortcut, a brilliant invention. They execute it with confidence. But the result is the OPPOSITE of what they wanted! The machine goes backwards. The trap catches the wrong thing. The surprise party surprises the wrong person. The TWIST: the accidental result turns out to be BETTER than the original plan. The wrong person needed the party more. The backwards machine actually works better. DELIGHT and laughter. Keep it SILLY and SURPRISING."
    },
    "8-9": {
      "steps": 4,
      "arc": ["elaborate_plan", "initial_success", "side_effects", "creative_improvisation"],
      "arc_prompt": "The protagonist and maybe a friend devise an ELABORATE plan — drawn on paper, with steps, with contingencies. They''re proud of it. Step one works perfectly. Step two works even better. Step three reveals an UNEXPECTED SIDE EFFECT: the plan does what it was supposed to AND something else entirely. The side effect gets worse as the plan progresses. Now they''re juggling the original goal AND the unintended chaos. They abandon the plan and IMPROVISE — making it up as they go, using the chaos itself as a tool. The improvised solution is messier, louder, and more fun than the original plan. Ending: ''The plan was a 2 out of 10. The improvisation was a 12.''"
    },
    "10-11": {
      "steps": 4,
      "arc": ["mastermind_plan", "elegant_execution", "ironic_backfire", "embracing_chaos"],
      "arc_prompt": "The protagonist considers themselves a STRATEGIST. The plan is detailed, clever, accounts for variables. They explain it to someone with a self-satisfied smile. Execution begins: flawless. Then: an ironic backfire. The plan works EXACTLY as designed — and that''s the problem. They didn''t account for what happens when their plan SUCCEEDS. Like wishing for rain and getting a flood. Or making the bully slip on a banana peel — right in front of the principal. The protagonist has to deal with the consequences of their own success. The improvisation requires a completely different skill set: not cleverness but adaptability. The solution comes from EMBRACING the unexpected results rather than fighting them. Ending: ''The best-laid plans are just the first draft. Reality is the editor.''"
    }
  }',
  'Genius plan backfires ironically — the plan works too well or exactly backwards, but improvisation saves the day',
  'The plan should sound GENIUS when explained. The backfire should be ironic — the plan works TOO well, or exactly backwards, or has a side effect nobody anticipated. The improvisation should be more fun than the original plan.',
  'scheming → confident → uh-oh → scrambling → unexpected success',
  'The ''failure'' of the plan actually solves a DIFFERENT problem nobody knew existed.',
  '''That was NOT the plan. But honestly? This is better.''',
  ARRAY['adventure_action', 'magic_fantasy', 'real_life', 'surprise'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['creative_thinking'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 18. role_reversal_comedy (humor) ─────────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'role_reversal_comedy',
  '{"de": "Rollentausch-Komödie", "en": "Role Reversal Comedy"}',
  '{"de": "Rollen werden getauscht — komische Situationen führen zu gegenseitigem Verständnis", "en": "Roles are swapped — funny situations lead to mutual understanding"}',
  'humor', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["swap", "funny_struggles", "new_appreciation"],
      "arc_prompt": "Two characters swap roles — kid becomes parent, cat becomes dog, teacher becomes student. Each is SURE the other''s job is easy. ''How hard can it be?'' VERY hard. The kid-as-parent can''t reach the stove. The cat-as-dog hates fetching. Everything the other person does easily becomes hilarious when someone new tries it. After a day of disasters, they swap back with HUGE relief. But now they understand: ''YOUR thing is actually really hard. I''m sorry I said it was easy.'' Keep it PHYSICAL, VISUAL, and full of funny fails."
    },
    "8-9": {
      "steps": 4,
      "arc": ["confident_swap", "escalating_incompetence", "mutual_humbling", "earned_respect"],
      "arc_prompt": "Two characters (kid/parent, student/teacher, siblings, friends) agree to swap roles for a day. Both are confident: ''I''ll show you how it''s done.'' Both start strong with the easy parts. Then each hits the HARD parts — the invisible skills, the patience required, the things that take practice. One comedic failure leads to another. They can see each other struggling and start to realize: this was harder than it looked. A moment where both simultaneously fail at something the other does effortlessly. Laughter. Then: mutual respect. They don''t just switch back — they switch back with understanding. Ending: ''I still think my way is better. But I get why yours works.''"
    },
    "10-11": {
      "steps": 4,
      "arc": ["disdainful_swap", "hidden_complexity", "parallel_failures", "genuine_appreciation"],
      "arc_prompt": "The swap happens because of a disagreement: ''You have it SO easy.'' ''Oh really? Let''s trade.'' Both are slightly angry, determined to PROVE their point. The early moments confirm their beliefs — the other role IS easy (the easy parts). Then each encounters the HIDDEN COMPLEXITY: the emotional labor, the boring-but-necessary parts, the thousand small decisions. The protagonist discovers that the ''lazy'' parent actually juggles fifteen invisible tasks. Or the ''strict'' teacher actually has thirty different needs to balance. Both fail at the SAME TIME in a comedic parallel — cut between both struggling with mirror-image problems. The humbling is genuine. The switch back isn''t defeat — it''s wisdom. Ending: ''I was wrong about your job. I was probably wrong about a lot of things. What else don''t I know about what other people carry?''"
    }
  }',
  'Roles are swapped — comedy reveals the hidden complexity in what others do, leading to genuine mutual respect',
  'Both sides should be equally funny in their new roles. The humor comes from competent people being hilariously bad at something they thought was easy. The understanding at the end is EARNED through experience, not told.',
  'confident → struggling → chaotic → humbled → understanding → warm',
  'The thing each person found hardest about the other''s role is the thing that requires the most hidden skill.',
  'Mutual respect. ''Your job is way harder than it looks. Let''s switch back.''',
  ARRAY['real_life', 'magic_fantasy', 'surprise'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['empathy', 'responsibility'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 19. discovering_a_hidden_world (wonder) ──────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'discovering_a_hidden_world',
  '{"de": "Eine verborgene Welt entdecken", "en": "Discovering a Hidden World"}',
  '{"de": "Kind entdeckt eine verborgene Welt und hütet das Geheimnis", "en": "Child discovers a hidden world and guards the secret"}',
  'wonder', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["boring_day", "discovery", "magical_wonder"],
      "arc_prompt": "A perfectly ordinary day. The protagonist is bored or looking for something else when they notice something SMALL: a door that wasn''t there before, a path behind a bush, a sound from inside a tree. They follow it. And find something AMAZING — a tiny world, a magical place, a hidden garden, creatures nobody has ever seen. Describe the wonder in DETAIL: colors, sounds, textures, smells. The protagonist''s eyes go wide. They spend time exploring — everything is surprising. They leave with a secret and a promise to come back. Ending: looking at the ordinary world differently — every tree might hide a door. Keep it SENSORY and DREAMY."
    },
    "8-9": {
      "steps": 4,
      "arc": ["clue", "investigation", "breakthrough_discovery", "keeping_the_secret"],
      "arc_prompt": "The protagonist notices something that doesn''t quite fit — a pattern, a sound that comes at the same time every day, a place where the air feels different. Others don''t notice or don''t care. The protagonist investigates: following clues, testing theories, getting closer. Then the BREAKTHROUGH: they find the hidden world. Take TIME with this moment — the wonder should FILL the scene. Describe what makes this world different from everything they know. There''s a rule or a logic to it that the protagonist begins to understand. Then a realization: this world is FRAGILE. If everyone knew, it might be ruined. The protagonist becomes its guardian. They return to their normal world changed — they know a secret that makes the ordinary world shimmer. Ending: ''Nobody else can see it. But I know it''s there. And that changes everything.''"
    },
    "10-11": {
      "steps": 5,
      "arc": ["pattern_recognition", "obsessive_investigation", "portal_moment", "understanding_the_rules", "chosen_guardian"],
      "arc_prompt": "The protagonist is observant — they notice patterns others miss. A recurring phenomenon: always at the same time, same place, same conditions. Nobody else cares. The investigation becomes an obsession — notes, theories, experiments. People think they''re weird. Then the BREAKTHROUGH: not a door but a shift in perception. The hidden world was always there — layered over the normal world. What they see: describe it with wonder and strangeness. It has its OWN ecosystem, rules, logic. The protagonist learns by observing, not by being told. The TENSION: someone else is getting close to the discovery, someone who wouldn''t protect it. The protagonist must make a choice: share the discovery for validation, or protect it alone. They choose protection. The hidden world responds: it opens more of itself to the protagonist. A relationship between worlds. Ending: ''The biggest discovery of my life, and I can''t tell anyone. Somehow, that makes it even more precious.''"
    }
  }',
  'Child discovers a hidden world layered over the ordinary — full of sensory wonder, becoming its guardian',
  'The discovery should feel MAGICAL — slow, detailed, full of sensory wonder. The hidden world should have its own rules, logic, and beauty. The protagonist''s awe should be palpable. Use ALL senses: what does it look like, sound like, smell like, feel like?',
  'ordinary → curious → amazed → protective → belonging',
  'The hidden world has been there all along — hidden in plain sight. Once you see it, you can''t unsee it.',
  'The world is so much bigger and more magical than I thought. And I get to know the secret.',
  ARRAY['magic_fantasy', 'surprise', 'adventure_action'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['curiosity', 'responsibility'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 20. the_impossible_made_possible (wonder) ────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'the_impossible_made_possible',
  '{"de": "Das Unmögliche möglich machen", "en": "The Impossible Made Possible"}',
  '{"de": "Kind stellt fest, dass das ''Unmögliche'' nur ''noch nicht versucht'' bedeutet", "en": "Child discovers that ''impossible'' just means ''not tried yet''"}',
  'wonder', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["told_impossible", "try_anyway", "it_works"],
      "arc_prompt": "Someone says ''that''s impossible'' — you can''t mix those colors to get THAT color, you can''t build a tower that high, you can''t make that animal and that animal be friends. The protagonist tilts their head. ''But... what if I try?'' They try. It doesn''t work the first time. They try DIFFERENTLY. And... it WORKS! Maybe not perfectly, maybe wobbling, but it WORKS. The protagonist''s face: pure wonder. ''It WASN''T impossible!'' They run to show everyone. Ending: looking at the world with new eyes — ''what else can I try?'' Keep it JOYFUL and WONDER-FILLED."
    },
    "8-9": {
      "steps": 4,
      "arc": ["declared_impossible", "secret_experimenting", "almost_giving_up", "breakthrough"],
      "arc_prompt": "Everyone KNOWS it''s impossible: the grown-ups, the books, the expert. ''It can''t be done.'' The protagonist isn''t so sure. They start experimenting SECRETLY — because if they fail, nobody needs to know. Attempt one: doesn''t work. Attempt two: closer. Attempt three: something unexpected happens that gives them a new idea. The almost-giving-up moment: ''Maybe they''re right. Maybe it IS impossible.'' But one last try — with the new idea from attempt three. And IT WORKS. Not the way anyone expected. The ''impossible'' thing was only impossible the way everyone tried it. The protagonist found a different way. The moment of success should be ELECTRIC — described in slow motion. Ending: ''Every \"impossible\" is just a \"not yet.\" What''s next?''"
    },
    "10-11": {
      "steps": 5,
      "arc": ["universal_certainty", "quiet_doubt", "systematic_experimentation", "reframing_the_problem", "paradigm_shift"],
      "arc_prompt": "Everyone agrees: it can''t be done. There are REASONS — it''s been tried before, the physics don''t work, the rules prevent it. The protagonist accepts this... mostly. But a quiet doubt lingers: ''What if they''re wrong?'' They start investigating — not just trying, but understanding WHY everyone thinks it''s impossible. They find the ASSUMPTION underneath the impossibility. What if that assumption is wrong? Experiments follow — systematic, recorded, each one learning from the last. Most fail. Some fail interestingly. One fails in a way that reveals something new. The REFRAME: the problem isn''t what everyone thinks it is. Approached from a completely different angle, the ''impossible'' dissolves. The breakthrough isn''t brute force — it''s a shift in perspective. The protagonist shows their discovery. Adults are stunned. The world just got bigger. Ending: ''Impossible is just a word people use when they''ve stopped being curious.''"
    }
  }',
  'Child discovers that ''impossible'' is just ''not tried yet'' — curiosity and fresh perspective overcome conventional wisdom',
  'The impossibility should be stated by EVERYONE — adults, friends, books. The protagonist''s curiosity should feel unstoppable. The moment of ''it works!'' should be electric.',
  'told impossible → curious → experimenting → failing → adjusting → IT WORKS',
  'The solution was simple all along — everyone was overcomplicating it. A child''s perspective sees what adults miss.',
  'If THIS was possible... what ELSE might be? Eyes wide, mind buzzing.',
  ARRAY['magic_fantasy', 'adventure_action', 'real_life', 'surprise'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['curiosity', 'creative_thinking', 'perseverance'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;

-- ─── 21. nature_speaks (wonder) ───────────────────────────────

INSERT INTO emotion_blueprints (
  blueprint_key, labels, descriptions, category, min_intensity,
  arc_by_age, arc_description_en,
  tone_guidance, tension_curve, surprise_moment, ending_feeling,
  compatible_themes, ideal_age_groups, compatible_learning_themes,
  weight, is_active
) VALUES (
  'nature_speaks',
  '{"de": "Die Natur spricht", "en": "Nature Speaks"}',
  '{"de": "Kind geht in die Natur, beobachtet etwas Erstaunliches, und sieht die Welt anders", "en": "Child goes into nature, observes something amazing, and sees the world differently"}',
  'wonder', 'medium',
  '{
    "6-7": {
      "steps": 3,
      "arc": ["bored_inside", "outside_discovery", "world_is_amazing"],
      "arc_prompt": "The protagonist is bored, stuck inside, restless. They go outside — reluctantly or by accident. At first, nothing special. Then they NOTICE something tiny: an ant carrying something huge, a spider web with dew drops, a bird building a nest, a seed sprouting through concrete. They stop and WATCH. The observation is DETAILED — what they see, hear, feel. The tiny thing leads to another observation, then another. The world opens up like a pop-up book. Everything is doing something amazing and they NEVER NOTICED before. They lie on their back and watch clouds. Ending: ''How did I ever think I was bored? The world is doing INCREDIBLE things!'' Keep it SENSORY and SLOW — let the wonder build."
    },
    "8-9": {
      "steps": 4,
      "arc": ["disconnected", "forced_outside", "patient_observation", "revelation"],
      "arc_prompt": "The protagonist is preoccupied — a problem, a screen, a worry. They end up in nature not by choice: a power outage, a broken device, a mandatory outdoor time. Reluctant. Annoyed. Nothing to do. Boredom forces them to actually LOOK. Slowly, they start noticing: the way light moves through leaves, the sound patterns of birds (they''re having CONVERSATIONS), the engineering of a beaver dam or a wasp nest. Patient observation rewards them with something EXTRAORDINARY: a natural event that most people never see. A caterpillar becoming a butterfly. A fox teaching cubs. A sunset that paints a cloud in impossible colors. The observation changes something inside them: their problem feels different now. Not solved, but... smaller. Perspective has shifted. Ending: ''Nature was doing all this while I was looking at my feet. I wonder what else I''ve missed.''"
    },
    "10-11": {
      "steps": 5,
      "arc": ["inner_turmoil", "escape_to_nature", "reluctant_stillness", "deep_observation", "mirror_of_self"],
      "arc_prompt": "The protagonist is dealing with something they can''t solve — a friendship problem, an identity question, a confusing emotion. Thinking about it in circles. They end up in nature — maybe running from the problem, maybe just needing to move. The natural world doesn''t care about their problem. This is annoying at first. Then: liberating. They stop thinking and start OBSERVING. Really observing. A natural process catches their attention: how a river finds its way around obstacles (it doesn''t push through — it flows AROUND). How trees grow toward light even when they start in shadow. How a forest recovers after a storm — not by going back to what it was, but by becoming something new. The observation becomes a MIRROR: the natural phenomenon reflects their own situation. Not as a metaphor told to them, but as a pattern they RECOGNIZE. ''Oh. That''s what I need to do.'' The answer was always there, in the way the world works. Ending: quieter, grounded, reconnected — to nature and to themselves."
    }
  }',
  'Child goes into nature, slows down, observes something extraordinary that mirrors their own situation',
  'SLOW DOWN. This blueprint is about NOTICING. Use all five senses. Describe nature not as background but as a character. The revelation should feel like the world is alive and has been trying to get the protagonist''s attention.',
  'restless → slowing down → noticing → amazed → connected',
  'The natural phenomenon the protagonist witnesses explains or mirrors their own life situation in a way that changes their perspective.',
  'The world is alive and paying attention. I just need to slow down enough to notice.',
  ARRAY['real_life', 'magic_fantasy'],
  ARRAY['6-7', '8-9', '10-11'],
  ARRAY['curiosity', 'environmental_awareness'],
  10, true
) ON CONFLICT (blueprint_key) DO NOTHING;
