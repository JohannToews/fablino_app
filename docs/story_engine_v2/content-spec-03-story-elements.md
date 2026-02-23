# Emotion-Flow-Engine — Content Spec: Story Elements

> **Zweck**: Seed-Daten für `story_elements` Tabelle.  
> **Erstellt**: 2026-02-21  
> **Format**: ~15 Elemente pro Typ, 7 Typen = ~105 Elemente total

---

## Typ 1: `opening_style` (15 Elemente)

Wie die Geschichte beginnt. Wird als Prompt-Snippet an den Anfang des Story-Prompts gehängt.

### O01: `sound_first`
```
Start with a SOUND — a crash, a whisper, a strange melody, a crack. 
The protagonist reacts BEFORE the reader knows what caused it. 
First sentence = the sound. Second sentence = the reaction.
```
**age_groups**: `{6-7, 8-9, 10-11}` · **compatible_themes**: all

### O02: `question_hook`
```
Start with a QUESTION the protagonist asks — out loud or in their head. 
A question that makes the reader curious too. Not "What should I do?" 
but "Why does the old tree hum at exactly 3 PM?"
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: all

### O03: `in_medias_res`
```
Start IN THE MIDDLE of the action. The protagonist is already running, 
hiding, climbing, or falling. NO explanation yet. The reader catches up 
through context. The "how we got here" comes later (or never).
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: `{adventure_action, magic_fantasy}`

### O04: `ordinary_moment`
```
Start with the most ORDINARY moment possible — eating breakfast, 
walking to school, staring out a window. Make it SPECIFIC and sensory. 
This normalcy will make the extraordinary moment that follows hit harder.
```
**age_groups**: `{6-7, 8-9, 10-11}` · **compatible_themes**: all

### O05: `dialogue_cold_open`
```
Start with a line of DIALOGUE — no attribution, no setup. 
Just the words. "You can't be serious." or "Don't open that." or 
"I found something." The reader is immediately in a conversation.
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: all

### O06: `weather_sets_mood`
```
Start with WEATHER that mirrors the story's mood — heavy rain for tension, 
impossible sunshine for irony, fog for mystery, the first warm day for hope. 
The weather isn't background — it's a character.
```
**age_groups**: `{6-7, 8-9, 10-11}` · **compatible_themes**: all

### O07: `countdown`
```
Start with a DEADLINE or countdown — "In exactly three hours, everything 
would change" or "They had until sunset." Create urgency from the first sentence.
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: `{adventure_action, magic_fantasy, surprise}`

### O08: `wrong_assumption`
```
Start with the protagonist being CERTAIN about something — and they're wrong. 
"This was going to be the most boring day ever." (It won't be.) 
The reader knows the assumption will break.
```
**age_groups**: `{6-7, 8-9, 10-11}` · **compatible_themes**: all

### O09: `tiny_detail`
```
Start with a TINY DETAIL that seems unimportant — a crack in the wall, 
a missing button, a bird that sits on the same branch every morning. 
This detail will matter later. Plant it casually.
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: all

### O10: `smell_or_taste`
```
Start with a SMELL or TASTE — something that triggers a memory or 
signals something unusual. "The hallway smelled like cinnamon, which 
was strange because nobody in the building baked." Unusual senses grab attention.
```
**age_groups**: `{6-7, 8-9, 10-11}` · **compatible_themes**: all

### O11: `animal_pov_tease`
```
Start from an ANIMAL'S perspective for 2-3 sentences — the cat watching 
from the windowsill, the bird above the schoolyard, the dog hearing 
something nobody else hears. Then shift to the protagonist.
```
**age_groups**: `{6-7, 8-9}` · **compatible_themes**: all

### O12: `list_of_three`
```
Start with THREE things — "Three things happened that morning: the alarm 
didn't ring, the milk was green, and there was a fox in the kitchen." 
The list creates intrigue and structure.
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: all

### O13: `whispered_warning`
```
Start with a WARNING from someone — whispered, written in a note, 
or said in passing. "Whatever you do, don't go to the old bridge 
after dark." Of course, the protagonist will.
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: `{adventure_action, magic_fantasy, surprise}`

### O14: `wake_up_wrong`
```
Start with waking up and something is WRONG — not catastrophically, 
but noticeably. The room looks different. The sounds are off. 
Something has shifted overnight. The protagonist feels it before they see it.
```
**age_groups**: `{6-7, 8-9, 10-11}` · **compatible_themes**: `{magic_fantasy, surprise}`

### O15: `the_dare`
```
Start with a DARE or CHALLENGE — from a friend, a rival, or 
the protagonist to themselves. "I bet you can't..." or 
"What if I just..." The story is set in motion by a choice.
```
**age_groups**: `{6-7, 8-9, 10-11}` · **compatible_themes**: `{adventure_action, real_life, surprise}`

---

## Typ 2: `narrative_perspective` (10 Elemente)

Erzählperspektive. Bestimmt die "Stimme" der Geschichte.

### N01: `first_person`
```
Tell the story in FIRST PERSON. The protagonist narrates directly: 
"I knew it was a terrible idea, but my feet were already running." 
The reader is INSIDE the protagonist's head — thoughts, doubts, all of it.
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: all

### N02: `third_person_close`
```
Tell the story in CLOSE THIRD PERSON — "she felt her stomach drop" 
not "one could see she was nervous." Stay close to the protagonist's 
feelings and perceptions. The reader sees ONLY what the protagonist sees.
```
**age_groups**: `{6-7, 8-9, 10-11}` · **compatible_themes**: all

### N03: `storyteller_narrator`
```
Tell the story with a WARM STORYTELLER voice — like a grandparent 
by a fireplace. The narrator can address the reader directly: 
"Now, what happened next, you won't believe..." Cozy and engaging.
```
**age_groups**: `{6-7, 8-9}` · **compatible_themes**: all

### N04: `diary_format`
```
Tell the story as DIARY ENTRIES. "Monday: Something weird happened today..." 
Each entry moves the story forward. The protagonist writes to themselves — 
honest, messy, real. Date each entry.
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: `{real_life, surprise}`

### N05: `letter_format`
```
Tell the story as a LETTER from the protagonist to someone — a friend, 
a future self, an imaginary pen pal. "Dear Oma, you won't believe 
what happened..." The letter format creates intimacy and voice.
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: `{real_life, surprise}`

### N06: `dual_perspective`
```
Alternate between TWO characters' perspectives — label each section 
with the character's name. Same events, different interpretations. 
The reader sees the FULL picture that neither character has.
```
**age_groups**: `{10-11}` · **compatible_themes**: all

### N07: `dialogue_heavy`
```
Tell at least 60% of the story through DIALOGUE. Minimal narration. 
The characters reveal themselves through how they speak — their words, 
pauses, interruptions. "Show, don't tell" through conversation.
```
**age_groups**: `{6-7, 8-9, 10-11}` · **compatible_themes**: all

### N08: `nature_narrator`
```
The SETTING narrates — the forest watches, the river remembers, 
the old house knows. Nature provides context and commentary while 
the protagonist acts within it. Magical realism tone.
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: `{magic_fantasy, surprise}`

### N09: `present_tense_cinematic`
```
Tell the story in PRESENT TENSE — "She opens the door. The room is dark. 
Something moves." Creates a cinematic, immediate feeling. The reader 
experiences everything AS it happens, with no hindsight.
```
**age_groups**: `{8-9, 10-11}` · **compatible_themes**: `{adventure_action, magic_fantasy}`

### N10: `unreliable_child`
```
The child narrator gets things SLIGHTLY wrong — misunderstands adult 
conversations, draws wrong conclusions from right observations, sees 
magic where there is science (or the other way around). Charming and funny.
```
**age_groups**: `{6-7, 8-9}` · **compatible_themes**: all

---

## Typ 3: `macguffin` (15 Elemente)

Objekte/Ziele die die Handlung antreiben.

### M01: `changing_map`
```
A MAP that changes — paths appear and disappear, X marks move, 
new areas reveal themselves as the protagonist grows braver.
```

### M02: `last_piece`
```
The protagonist needs the LAST PIECE of something — the final ingredient, 
the missing puzzle piece, the one key that completes the set. 
Everyone else has given up looking for it.
```

### M03: `message_in_wrong_hands`
```
A MESSAGE (letter, note, recording) that was meant for someone else 
ends up with the protagonist. What do they do with it?
```

### M04: `broken_thing`
```
Something important is BROKEN — a promise, an object, a machine, a tradition. 
The protagonist tries to fix it and discovers the breaking 
was necessary for something new to emerge.
```

### M05: `borrowed_time`
```
Something borrowed that MUST be returned — but returning it means 
giving up the power/comfort/advantage it provides.
```

### M06: `growing_seed`
```
A SEED (literal or metaphorical) that grows unpredictably — 
faster than expected, in the wrong direction, producing something 
nobody planted. Caring for it teaches patience and acceptance.
```

### M07: `talking_object`
```
An object that seems to COMMUNICATE — not literally talking, 
but responding to the protagonist. A compass that points to what 
you NEED (not what you want). A book that opens to relevant pages.
```

### M08: `color_that_fades`
```
A COLOR that's disappearing from the world — slowly everything 
turns grey/dull. The protagonist must find the source and restore it. 
The color represents something emotional (joy, courage, love).
```

### M09: `sound_nobody_hears`
```
A SOUND only the protagonist can hear — a melody, a rhythm, a hum. 
Following it leads somewhere important. Others think they're imagining things.
```

### M10: `gift_with_conditions`
```
A GIFT that comes with conditions — "Use it only when..." or 
"It works three times, then it's gone." The protagonist must 
choose wisely when to use their limited resource.
```

### M11: `photograph_mystery`
```
An old PHOTOGRAPH showing something impossible — the protagonist 
in a place they've never been, a person they know in the wrong era, 
a building that doesn't exist (yet).
```

### M12: `recipe_or_formula`
```
A RECIPE or FORMULA with one ingredient missing or unclear. 
Following it leads to adventure. The missing ingredient is 
metaphorical — "a genuine laugh" or "the sound of rain on Tuesday."
```

### M13: `shadow_with_own_mind`
```
The protagonist's SHADOW starts behaving independently — pointing 
at things, pulling toward something, refusing to follow. 
What does the shadow know that the protagonist doesn't?
```

### M14: `key_without_lock`
```
A KEY that doesn't fit any visible lock. The protagonist carries it, 
waiting and searching. When they find the lock, what's behind the door 
changes their understanding of something.
```

### M15: `countdown_clock`
```
A CLOCK or TIMER counting down to something — but nobody knows WHAT. 
The urgency is real even though the stakes are unknown. 
The reveal of what the countdown means is the twist.
```

All macguffins: **age_groups** `{6-7, 8-9, 10-11}` · **compatible_themes**: all (except where noted)

---

## Typ 4: `setting_detail` (15 Elemente)

Konkrete Setting-Anreicherungen die Atmosphäre schaffen.

### SD01: `first_snow`
```
The story takes place during the FIRST SNOW of the year. 
Everything is muffled, magical, and slightly unreal. 
Use the silence of snow as atmosphere.
```

### SD02: `golden_hour`
```
The key scenes happen during GOLDEN HOUR — that warm light before sunset 
that makes everything glow. Time feels stretched. Shadows are long.
```

### SD03: `market_day`
```
The story centers around a busy MARKET — smells, colors, voices, 
languages mixing. The protagonist navigates through the crowd. 
Use the market as a sensory feast.
```

### SD04: `abandoned_place`
```
The story includes an ABANDONED PLACE — an empty house, a closed shop, 
a forgotten playground. What was here before? The emptiness 
tells a story. The protagonist fills it with imagination.
```

### SD05: `night_adventure`
```
Key scenes happen at NIGHT — but not scary. The night is a different 
world: different sounds, different rules, different courage required. 
Moonlight and shadows. The familiar becomes mysterious.
```

### SD06: `rainy_day_trapped`
```
It's RAINING and everyone is trapped inside. The enforced closeness 
creates the story — conversations that wouldn't happen otherwise, 
discoveries in attics or basements, staring out windows.
```

### SD07: `tree_as_character`
```
There is a SIGNIFICANT TREE — old, enormous, central to the story. 
A climbing tree, a meeting place, a thinking spot, a hiding spot. 
The tree is almost a character. Describe it with love.
```

### SD08: `underground_world`
```
Part of the story happens UNDERGROUND — a cave, a tunnel, a basement, 
a burrow. Darkness, echoes, the feel of earth. The protagonist 
must navigate by touch and sound. Claustrophobia or wonder.
```

### SD09: `water_is_present`
```
WATER plays a role — a river to cross, a lake to explore, rain that 
changes plans, a flooded path. Water as obstacle, as mirror, 
as metaphor for change (you can't step in the same river twice).
```

### SD10: `high_place`
```
A key moment happens in a HIGH PLACE — a tower, a rooftop, a treehouse, 
a hilltop. The world looks different from above. The height 
requires courage. The view provides perspective.
```

### SD11: `kitchen_warmth`
```
The story involves a KITCHEN — cooking, smells, warmth, shared work. 
The kitchen is where honest conversations happen. Flour on noses, 
boiling pots, the rhythm of chopping and stirring.
```

### SD12: `border_between_worlds`
```
The story takes place at a BORDER — where the town meets the forest, 
where the familiar ends and the unknown begins, where two 
neighborhoods touch. The threshold is where courage is needed.
```

### SD13: `seasonal_change`
```
The story spans a SEASONAL CHANGE — the last day of summer, 
autumn leaves falling, the first warm day after winter. The changing 
season mirrors the protagonist's inner change.
```

### SD14: `island_isolation`
```
The story happens on or involves an ISLAND — physical or metaphorical. 
Separation from the familiar. Limited resources. The protagonist 
must be self-reliant. The sea both traps and liberates.
```

### SD15: `festival_or_celebration`
```
The story happens during a FESTIVAL or CELEBRATION — decorations, 
music, crowds, expectations. The festivity creates opportunities 
for things to go right AND wrong. Heightened emotions.
```

All setting details: **age_groups** `{6-7, 8-9, 10-11}` · **compatible_themes**: all

---

## Typ 5: `humor_technique` (15 Elemente)

Konkrete Humor-Techniken die dem LLM sagen WIE es lustig sein soll.

### H01: `exaggeration`
```
Use EXAGGERATION — if something goes wrong, it goes SPECTACULARLY wrong. 
The small spill becomes a flood. The tiny mistake becomes a disaster. 
The "slightly late" becomes running in at the last possible second.
```
**age_groups**: `{6-7, 8-9, 10-11}`

### H02: `running_gag`
```
Include a RUNNING GAG — something that happens exactly three times. 
First time: surprising. Second time: "oh no, not again." 
Third time: the reader expects it AND it happens differently.
```
**age_groups**: `{6-7, 8-9, 10-11}`

### H03: `misunderstanding_comedy`
```
Use a COMEDIC MISUNDERSTANDING — two characters talking about 
different things but thinking they're discussing the same thing. 
The reader sees both sides. The reveal is hilarious.
```
**age_groups**: `{8-9, 10-11}`

### H04: `physical_comedy`
```
Use PHYSICAL COMEDY — slipping, tripping, things falling on heads, 
domino effects. Keep it cartoon-style: nobody gets HURT, 
just embarrassed. Sound effects help: SPLAT, CRASH, WOBBLE.
```
**age_groups**: `{6-7, 8-9}`

### H05: `dramatic_irony`
```
The READER knows something the character doesn't — we can see the 
banana peel, the surprise party, the hidden person. The humor 
comes from watching the character walk into it.
```
**age_groups**: `{8-9, 10-11}`

### H06: `unexpected_expert`
```
Someone who seems incompetent turns out to be an EXPERT at exactly 
the wrong thing — "I can't tie my shoes but I CAN defuse this!" 
Absurd contrast between weakness and hidden skill.
```
**age_groups**: `{6-7, 8-9, 10-11}`

### H07: `literal_interpretation`
```
A character takes something LITERALLY — "break a leg!" → actually 
tries to break furniture. "Keep your eyes peeled" → alarmed face. 
Works especially well with younger characters or magical beings.
```
**age_groups**: `{6-7, 8-9}`

### H08: `escalating_excuses`
```
The protagonist invents ESCALATING EXCUSES — each one more ridiculous 
than the last. "My dog ate it" → "A bird stole it" → "A time 
traveler needed it" → until the truth would actually be simpler.
```
**age_groups**: `{8-9, 10-11}`

### H09: `wrong_genre`
```
A character BEHAVES as if they're in the wrong genre — treating 
a normal school day like a spy thriller, narrating a trip to the 
store like an epic quest, being dramatically poetic about lunch.
```
**age_groups**: `{8-9, 10-11}`

### H10: `animal_reaction`
```
An ANIMAL reacts to the chaos — the cat's unimpressed stare, 
the dog's enthusiastic making-it-worse, the bird's judgmental 
head-tilt. Animals as deadpan comedy sidekicks.
```
**age_groups**: `{6-7, 8-9, 10-11}`

### H11: `sound_effects`
```
Include written SOUND EFFECTS for comedic moments — SPLORCH, 
THWACK, KABOING, SQUEEEAK. Let the sounds tell the story 
of what went wrong. Kids love reading sounds out loud.
```
**age_groups**: `{6-7, 8-9}`

### H12: `the_snack_priority`
```
In the middle of crisis, someone is focused on FOOD — "Yes, the 
bridge is collapsing, but did anyone bring the sandwiches?" 
Absurd priorities during urgent moments.
```
**age_groups**: `{6-7, 8-9, 10-11}`

### H13: `understatement`
```
Use UNDERSTATEMENT for comedy — massive explosion: "Well, that was louder 
than expected." Dragon appears: "I think we should maybe leave." 
The calm reaction to extreme situations.
```
**age_groups**: `{8-9, 10-11}`

### H14: `failed_cool_moment`
```
The protagonist tries to have a COOL MOMENT — a dramatic entrance, 
a one-liner, a heroic pose — and it goes hilariously wrong. 
Trips, voice cracks, the door doesn't open dramatically.
```
**age_groups**: `{8-9, 10-11}`

### H15: `the_honest_kid`
```
A young child says something BRUTALLY HONEST that everyone else 
was thinking but too polite to say. "Why is your hair like that?" 
"This food tastes weird." Uncomfortable truth as comedy.
```
**age_groups**: `{6-7, 8-9, 10-11}`

---

## Typ 6: `tension_technique` (10 Elemente)

### T01: `ticking_clock`
```
Create a TICKING CLOCK — the protagonist must finish before sunset, 
before the tide comes in, before someone arrives, before the last 
leaf falls. The deadline creates urgency in every scene.
```

### T02: `hidden_watcher`
```
Someone or something is WATCHING — the protagonist feels it but 
can't see it. Subtle signs: a twig snapping, a shadow moving, 
the feeling of eyes on the back of their neck.
```

### T03: `dwindling_resources`
```
Resources are RUNNING OUT — the flashlight is dimming, the food 
is gone, they're down to their last match/wish/chance. 
Each use must be weighed carefully.
```

### T04: `forbidden_place`
```
There is a place the protagonist has been told NOT TO GO. 
The story pulls them closer and closer to it. The reader knows 
they'll end up there. The protagonist knows it too.
```

### T05: `the_secret`
```
The protagonist knows a SECRET that grows heavier with each scene. 
Keeping it costs something. Telling it costs something else. 
The tension is in the choice, not the secret itself.
```

### T06: `approaching_storm`
```
A STORM is coming — literal or metaphorical. The signs build: 
darkening sky, restless animals, dropping temperature. The protagonist 
must finish their task before it arrives. Nature as pressure.
```

### T07: `the_wrong_ally`
```
Someone who's "helping" seems OFF — too eager, too knowledgeable, 
asking strange questions. The protagonist needs their help 
but doesn't fully trust them. Tension in every interaction.
```

### T08: `point_of_no_return`
```
A clear POINT OF NO RETURN — crossing this line means they can't go back. 
The door that locks behind them, the bridge that breaks, 
the word that can't be unsaid. Build to the crossing.
```

### T09: `parallel_danger`
```
Two threats happening SIMULTANEOUSLY — the protagonist must handle 
both but can only be in one place. The tension of choosing 
which problem to solve first.
```

### T10: `the_silence`
```
Use SILENCE as tension — everything goes quiet. Too quiet. 
The absence of sound is louder than noise. What stopped making sound? 
And why? The protagonist holds their breath.
```

All tension techniques: **age_groups** `{8-9, 10-11}` · **compatible_themes**: `{adventure_action, magic_fantasy, surprise}`

---

## Typ 7: `closing_style` (10 Elemente)

### C01: `echo_opening`
```
End with an ECHO of the opening — the same sound, image, or phrase 
from the first paragraph, but now it means something different. 
The repetition shows how far the protagonist has come.
```

### C02: `looking_forward`
```
End by looking FORWARD — not wrapping everything up, but opening 
a new possibility. The protagonist sees something new on the horizon. 
The story ends, but the life continues.
```

### C03: `quiet_moment`
```
End with a QUIET MOMENT — sitting on a step, watching the sunset, 
lying in bed replaying the day. After all the action, the stillness 
is the most powerful scene. Let the reader breathe.
```

### C04: `shared_laugh`
```
End with SHARED LAUGHTER — the protagonist and someone else, 
laughing about what happened. The laughter is relief, connection, 
and the signal that everything is okay.
```

### C05: `small_ritual`
```
End with a SMALL RITUAL — a handshake, a shared meal, 
a new tradition, putting something in a special place. 
The ritual marks the change and makes it real.
```

### C06: `the_return`
```
End with RETURNING to a familiar place — home, school, 
the protagonist's room. But they see it differently now. 
The place hasn't changed. They have.
```

### C07: `one_last_surprise`
```
End with ONE LAST SURPRISE — a tiny twist after the resolution. 
Not a cliffhanger, but a wink. The map has a new mark. 
The creature left something behind. A note appears.
```

### C08: `passing_it_on`
```
End with the protagonist PASSING SOMETHING ON — the knowledge, 
the gift, the courage, the secret — to someone else who needs it. 
The cycle continues. They received, now they give.
```

### C09: `falling_asleep`
```
End with the protagonist FALLING ASLEEP — exhausted, satisfied, 
smiling. Maybe they're already dreaming about tomorrow. 
The cosiest possible ending. Perfect for bedtime stories.
```

### C10: `unanswered_question`
```
End with a QUESTION that isn't answered — not frustrating, but 
intriguing. "And sometimes, late at night, they still wonder..." 
The reader gets to imagine the answer. Open-ended wonder.
```

All closing styles: **age_groups** `{6-7, 8-9, 10-11}` · **compatible_themes**: all

---

## Zusammenfassung

| Element Type | Count | Notes |
|-------------|-------|-------|
| opening_style | 15 | Verschiedene Story-Eröffnungen |
| narrative_perspective | 10 | Erzählstimmen und -formate |
| macguffin | 15 | Plot-treibende Objekte/Ziele |
| setting_detail | 15 | Atmosphärische Setting-Anreicherungen |
| humor_technique | 15 | Konkrete Humor-Anleitungen |
| tension_technique | 10 | Spannungs-Werkzeuge |
| closing_style | 10 | Story-Abschlüsse |
| **Total** | **90** | |

### Alters-Verteilung

| Element Type | 6-7 verfügbar | 8-9 verfügbar | 10-11 verfügbar |
|-------------|--------------|--------------|----------------|
| opening_style | 9 | 15 | 14 |
| narrative_perspective | 5 | 9 | 10 |
| macguffin | 15 | 15 | 15 |
| setting_detail | 15 | 15 | 15 |
| humor_technique | 10 | 14 | 13 |
| tension_technique | 0 | 10 | 10 |
| closing_style | 10 | 10 | 10 |

> Tension techniques sind absichtlich erst ab 8-9 — jüngere Kinder brauchen weniger aktive Spannungserzeugung.

---

*Dieses Dokument enthält die vollständigen Seed-Daten für die `story_elements` Tabelle. Zusammen mit den Emotion Blueprints und Character Seeds bildet es den kompletten Content für Phase 2.*
