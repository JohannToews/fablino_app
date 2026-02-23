# Emotion-Flow-Engine — Content Spec: Character Seeds

> **Zweck**: Seed-Daten für `character_seeds` Tabelle.  
> **Erstellt**: 2026-02-21

---

## Design-Prinzipien

- **Appearance**: Konkret genug für Image-Prompts, respektvoll, keine Stereotypen
- **Personality**: Stärke + Schwäche = dreidimensionaler Charakter
- **Diversity**: Breite Abdeckung von Hauttönen, Haartypen, kulturellen Hintergründen
- **Names**: Authentisch für den kulturellen Hintergrund, aussprechbar in mehreren Sprachen
- **Gender Balance**: ~50/50 + einige gender-neutral Seeds

---

## Protagonist Appearances (30 Seeds)

### Seed P01: `west_african_girl`
| Field | Value |
|-------|-------|
| **appearance_en** | "Dark brown skin, tightly coiled black hair in two puffs with colorful hair ties, wide bright eyes, gap-toothed smile, wears a bright yellow top with bold patterns" |
| **personality_trait_en** | "Curious and talkative — asks questions about EVERYTHING, especially 'but WHY?'" |
| **weakness_en** | "Talks when she should listen, sometimes misses important details because she's already asking the next question" |
| **strength_en** | "Her relentless questions lead to discoveries nobody else would make" |
| **cultural_background** | `west_african` |
| **gender** | `female` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"female": ["Amara", "Nia", "Adaeze", "Serwaa", "Yaa"]}` |

### Seed P02: `east_asian_boy`
| Field | Value |
|-------|-------|
| **appearance_en** | "Light golden-brown skin, straight black hair with a messy fringe that falls into his eyes, sharp observant eyes, slim build, wears a too-big hoodie with the sleeves pushed up" |
| **personality_trait_en** | "Quiet observer who notices everything — patterns, details, things that are out of place" |
| **weakness_en** | "Overthinks instead of acting, gets stuck in analysis paralysis" |
| **strength_en** | "When he finally speaks, his observations are so precise they change the entire plan" |
| **cultural_background** | `east_asian` |
| **gender** | `male` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"male": ["Hiro", "Jun", "Kai", "Sora", "Ren"]}` |

### Seed P03: `south_asian_girl`
| Field | Value |
|-------|-------|
| **appearance_en** | "Warm brown skin, long thick black hair in a single braid with a red ribbon, dark expressive eyes, bright smile, wears colorful clothes — always at least one thing in orange" |
| **personality_trait_en** | "Natural organizer — immediately starts making plans and assigning roles" |
| **weakness_en** | "Bossy when stressed, has trouble when things go off-plan" |
| **strength_en** | "Her organization saves the group when chaos strikes — she's the calm in the storm" |
| **cultural_background** | `south_asian` |
| **gender** | `female` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"female": ["Priya", "Ananya", "Devi", "Meera", "Zara"]}` |

### Seed P04: `nordic_boy`
| Field | Value |
|-------|-------|
| **appearance_en** | "Fair skin with rosy cheeks, messy sandy-blond hair, blue-grey eyes, freckles across the nose, sturdy build, wears rubber boots in every weather" |
| **personality_trait_en** | "Hands-on builder — solves problems by making things, always has pockets full of useful junk" |
| **weakness_en** | "Impatient with talking and planning — wants to START building before the plan is finished" |
| **strength_en** | "Can build or fix almost anything with whatever's available" |
| **cultural_background** | `nordic` |
| **gender** | `male` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"male": ["Finn", "Lars", "Erik", "Nils", "Sven"]}` |

### Seed P05: `middle_eastern_girl`
| Field | Value |
|-------|-------|
| **appearance_en** | "Olive skin, thick dark wavy hair often held back with a headband, large dark eyes with long lashes, determined expression, wears practical clothes with colorful sneakers" |
| **personality_trait_en** | "Fiercely fair — cannot stand injustice, will speak up even when it's risky" |
| **weakness_en** | "Her sense of justice can be rigid — sees things in black and white before learning nuance" |
| **strength_en** | "When she stands up for someone, others find their courage too" |
| **cultural_background** | `middle_eastern` |
| **gender** | `female` |
| **age_range** | `{8-9, 10-11}` |
| **name_pool** | `{"female": ["Layla", "Noor", "Yasmin", "Samira", "Dina"]}` |

### Seed P06: `latin_american_boy`
| Field | Value |
|-------|-------|
| **appearance_en** | "Warm tan skin, thick dark curly hair, bright brown eyes full of mischief, dimples when smiling (which is often), wears a favorite faded t-shirt with a cartoon character" |
| **personality_trait_en** | "Natural storyteller — exaggerates everything into an epic tale, makes boring things sound exciting" |
| **weakness_en** | "Sometimes his stories stretch the truth too far — the line between imagination and lying gets blurry" |
| **strength_en** | "His storytelling inspires others and turns ordinary situations into adventures" |
| **cultural_background** | `latin_american` |
| **gender** | `male` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"male": ["Mateo", "Santiago", "Diego", "Rafael", "Lucas"]}` |

### Seed P07: `eastern_european_girl`
| Field | Value |
|-------|-------|
| **appearance_en** | "Fair skin, straight light brown hair in a ponytail, grey-green eyes, serious expression that breaks into a surprising laugh, wears a denim jacket with patches she collected" |
| **personality_trait_en** | "Logical thinker — approaches every problem like a puzzle to be solved" |
| **weakness_en** | "Dismisses feelings as 'illogical,' struggles when emotions ARE the point" |
| **strength_en** | "When everyone else panics, she stays calm and thinks clearly" |
| **cultural_background** | `eastern_european` |
| **gender** | `female` |
| **age_range** | `{8-9, 10-11}` |
| **name_pool** | `{"female": ["Mila", "Kira", "Daria", "Lena", "Anja"]}` |

### Seed P08: `caribbean_boy`
| Field | Value |
|-------|-------|
| **appearance_en** | "Dark brown skin, short tight curls with a lightning-bolt pattern shaved on the side, warm brown eyes, athletic build, always wearing bright colors — especially green and gold" |
| **personality_trait_en** | "Energetic and physical — runs everywhere, climbs everything, communicates with his whole body" |
| **weakness_en** | "Can't sit still, finds it hard to be patient or wait for slow things to happen" |
| **strength_en** | "His physical courage and energy get the group through obstacles nobody else would attempt" |
| **cultural_background** | `caribbean` |
| **gender** | `male` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"male": ["Jaylen", "Marcus", "Kofi", "Andre", "Caleb"]}` |

### Seed P09: `southeast_asian_girl`
| Field | Value |
|-------|-------|
| **appearance_en** | "Golden-brown skin, straight dark hair cut in a practical bob, almond-shaped dark eyes, small but sturdy, wears a backpack that seems too big for her — it's full of supplies" |
| **personality_trait_en** | "Always prepared — has the right thing in her bag for every situation" |
| **weakness_en** | "Relies on preparation so much that she freezes when surprised by the truly unexpected" |
| **strength_en** | "Her preparation saves the day at least once — 'I KNEW we'd need this!'" |
| **cultural_background** | `southeast_asian` |
| **gender** | `female` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"female": ["Mai", "Linh", "Sari", "Lani", "Aya"]}` |

### Seed P10: `mixed_heritage_boy`
| Field | Value |
|-------|-------|
| **appearance_en** | "Medium brown skin, loose dark curls, hazel eyes that look different colors in different light, tall and lanky, wears mismatched socks on purpose" |
| **personality_trait_en** | "Bridge-builder — naturally connects different groups, speaks 'everyone's language'" |
| **weakness_en** | "Tries so hard to belong everywhere that sometimes he doesn't feel he belongs anywhere" |
| **strength_en** | "Sees connections between things/people that others miss, brings unlikely allies together" |
| **cultural_background** | `mixed` |
| **gender** | `male` |
| **age_range** | `{8-9, 10-11}` |
| **name_pool** | `{"male": ["Noah", "Leo", "Elias", "Malik", "Sam"]}` |

### Seed P11: `indigenous_australian_girl`
| Field | Value |
|-------|-------|
| **appearance_en** | "Deep brown skin, dark brown wavy hair worn loose, dark eyes that seem to see far distances, bare feet whenever possible, wears a woven bracelet she made herself" |
| **personality_trait_en** | "Deep listener — hears things others miss, from nature and from people" |
| **weakness_en** | "So tuned into others' feelings that she sometimes forgets her own needs" |
| **strength_en** | "Her deep listening reveals truths that change the whole group's understanding" |
| **cultural_background** | `oceanian` |
| **gender** | `female` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"female": ["Aria", "Tala", "Kaia", "Mia", "Jira"]}` |

### Seed P12: `central_european_boy`
| Field | Value |
|-------|-------|
| **appearance_en** | "Light skin, short dark brown hair neatly combed (but one bit always sticks up), brown eyes behind round glasses, thoughtful expression, wears button-up shirts with rolled sleeves" |
| **personality_trait_en** | "Bookworm and fact-collector — knows random information about everything" |
| **weakness_en** | "Hides behind facts when feelings get uncomfortable, can be a know-it-all" |
| **strength_en** | "His random knowledge is exactly what's needed in the strangest situations" |
| **cultural_background** | `central_european` |
| **gender** | `male` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"male": ["Jonas", "Felix", "Anton", "Theo", "Paul"]}` |

### Seed P13: `north_african_girl`
| Field | Value |
|-------|-------|
| **appearance_en** | "Warm olive-brown skin, thick dark curly hair often in a bun with loose strands, deep brown eyes, expressive hands that talk as much as her mouth, wears silver earrings" |
| **personality_trait_en** | "Creative improviser — turns anything into art or a game, sees beauty in unexpected places" |
| **weakness_en** | "Gets so lost in creative flow that she forgets practical things like time, food, or the actual task" |
| **strength_en** | "Her creative thinking solves problems that logical approaches can't crack" |
| **cultural_background** | `north_african` |
| **gender** | `female` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"female": ["Lina", "Amira", "Selma", "Hana", "Nadia"]}` |

### Seed P14: `west_european_boy`
| Field | Value |
|-------|-------|
| **appearance_en** | "Light skin, wavy reddish-brown hair, green eyes, freckles everywhere, medium build, wears a striped shirt and always has grass stains on his knees" |
| **personality_trait_en** | "Natural comedian — sees the funny side of everything, uses humor to lighten tense situations" |
| **weakness_en** | "Uses humor to avoid dealing with serious emotions — deflects with jokes when he should listen" |
| **strength_en** | "His humor breaks tension and helps others relax enough to think clearly" |
| **cultural_background** | `west_european` |
| **gender** | `male` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"male": ["Arthur", "Louis", "Hugo", "Oscar", "Jules"]}` |

### Seed P15: `east_african_girl`
| Field | Value |
|-------|-------|
| **appearance_en** | "Rich dark brown skin, black hair in neat cornrows with beads, bright alert eyes, quick smile, wiry and fast, wears a beaded necklace she treasures" |
| **personality_trait_en** | "Fastest runner and quickest thinker — acts on instinct, trusts her gut" |
| **weakness_en** | "Acts before thinking, sometimes has to fix problems her impulsiveness created" |
| **strength_en** | "In emergencies, her quick instincts save the day while others are still processing" |
| **cultural_background** | `east_african` |
| **gender** | `female` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"female": ["Amani", "Zuri", "Imani", "Neema", "Aisha"]}` |

### Seed P16: `south_european_boy`
| Field | Value |
|-------|-------|
| **appearance_en** | "Olive skin, thick dark wavy hair that's always a bit too long, dark eyes, expressive face that shows every emotion, wears a favorite scarf even in summer" |
| **personality_trait_en** | "Passionate about everything — loves deeply, argues fiercely, laughs loudly" |
| **weakness_en** | "His intensity can overwhelm quieter people, doesn't always read the room" |
| **strength_en** | "His passion is contagious — when he believes in something, everyone ends up believing too" |
| **cultural_background** | `south_european` |
| **gender** | `male` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"male": ["Marco", "Luca", "Pablo", "Nico", "Tiago"]}` |

### Seed P17: `south_american_girl`
| Field | Value |
|-------|-------|
| **appearance_en** | "Light brown skin, long straight dark hair with a flower tucked behind one ear, dark eyes with golden flecks, warm smile, wears hand-knit sweater in bright colors" |
| **personality_trait_en** | "Natural healer and peacemaker — brings calm to conflicts, tends to the hurt" |
| **weakness_en** | "Avoids conflict so strongly that she sometimes doesn't stand up for herself" |
| **strength_en** | "Her calming presence helps others think clearly and find solutions together" |
| **cultural_background** | `south_american` |
| **gender** | `female` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"female": ["Luna", "Sofia", "Camila", "Valentina", "Isabella"]}` |

### Seed P18: `central_asian_boy`
| Field | Value |
|-------|-------|
| **appearance_en** | "Tan skin, straight black hair cut short on the sides, dark almond-shaped eyes, compact and strong, wears a leather bracelet and practical outdoor clothes" |
| **personality_trait_en** | "Silent and reliable — doesn't say much, but when he acts, it matters" |
| **weakness_en** | "His quietness is sometimes mistaken for not caring, struggles to express feelings in words" |
| **strength_en** | "Shows care through actions — the person who quietly carries the heaviest bag, fixes the broken thing, stays longest" |
| **cultural_background** | `central_asian` |
| **gender** | `male` |
| **age_range** | `{8-9, 10-11}` |
| **name_pool** | `{"male": ["Timur", "Amir", "Dastan", "Emir", "Arman"]}` |

### Seed P19: `pacific_islander_girl`
| Field | Value |
|-------|-------|
| **appearance_en** | "Brown skin, long thick wavy dark hair with natural highlights, big warm brown eyes, broad shoulders, strong build, wears a flower crown she makes from whatever's blooming" |
| **personality_trait_en** | "Generous and community-minded — shares everything, thinks of the group first" |
| **weakness_en** | "Gives too much, sometimes neglects her own needs to help others" |
| **strength_en** | "Her generosity creates loyalty — people would do anything for her because she's done everything for them" |
| **cultural_background** | `oceanian` |
| **gender** | `female` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"female": ["Moana", "Leilani", "Sina", "Tia", "Mele"]}` |

### Seed P20: `northern_european_gender_neutral`
| Field | Value |
|-------|-------|
| **appearance_en** | "Light skin, short tousled blond hair, bright blue eyes, slim build, wears overalls with lots of pockets and colorful patches, paint under fingernails" |
| **personality_trait_en** | "Artistic dreamer — sees the world as shapes, colors, and possibilities" |
| **weakness_en** | "Gets lost in imagination and misses practical details right in front of them" |
| **strength_en** | "Their creative vision reveals solutions that look impossible until you see them drawn out" |
| **cultural_background** | `nordic` |
| **gender** | `neutral` |
| **age_range** | `{6-7, 8-9, 10-11}` |
| **name_pool** | `{"neutral": ["Robin", "Alex", "Kim", "Noa", "Sky"]}` |

### Seeds P21-P30 (Kurzformat)

| # | Key | Background | Gender | Personality Core | Weakness | Appearance Highlight |
|---|-----|-----------|--------|-----------------|----------|---------------------|
| P21 | `romani_boy` | `eastern_european` | male | Streetwise and resourceful | Distrusts authority even when help is genuine | Dark curly hair, olive skin, bright eyes, wears a well-worn leather vest |
| P22 | `korean_girl` | `east_asian` | female | Perfectionist and determined | Can't start until conditions are perfect — paralysis | Straight black hair with bangs, light golden skin, precise movements |
| P23 | `nigerian_boy` | `west_african` | male | Natural leader, confident voice | Assumes leadership without asking, sometimes steamrolls quiet voices | Dark brown skin, short hair, tall for his age, commanding presence |
| P24 | `turkish_girl` | `middle_eastern` | female | Warm diplomat, connects people | Puts harmony above truth sometimes | Olive skin, dark hair in a loose braid, kind eyes, colorful scarf |
| P25 | `mixed_asian_european_boy` | `mixed` | male | Tech-curious tinkerer | Gets frustrated when things can't be fixed with logic | Light brown skin, wavy dark hair, glasses, always taking things apart |
| P26 | `brazilian_girl` | `latin_american` | female | Rhythmic and expressive, moves to music | Attention-seeking when anxious | Warm brown skin, big dark curls, always dancing or tapping |
| P27 | `scandinavian_girl` | `nordic` | female | Quiet bravery, acts without announcing | So independent she refuses help even when she needs it | Fair skin, long blonde braid, calm grey eyes, outdoor clothes |
| P28 | `south_asian_boy` | `south_asian` | male | Gentle and empathetic, reads emotions | Absorbs others' sadness, forgets to protect his own feelings | Brown skin, dark hair, soft eyes, wears a hand-me-down watch he treasures |
| P29 | `mediterranean_gender_neutral` | `south_european` | neutral | Collector of stories and secrets | Knows everyone's secrets but struggles with their own | Olive skin, short dark hair, curious expression, carries a small notebook |
| P30 | `indigenous_american_boy` | `indigenous_american` | male | Connected to nature, patient observer | Uncomfortable in indoor/urban settings, can seem distant | Medium brown skin, straight dark hair, steady dark eyes, wears a carved pendant |

---

## Sidekick Archetypes (10 Seeds)

Diese beschreiben ROLLEN, nicht Aussehen. Aussehen wird vom Character Seed des Protagonisten oder zufällig gewählt.

### S01: `loyal_skeptic`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Always says 'this is a bad idea' but comes along anyway. Worries FOR the group." |
| **weakness_en** | "Worries so much they sometimes hold the group back" |
| **strength_en** | "Their caution saves the group when the plan goes wrong — 'I TOLD you so' (but helps anyway)" |

### S02: `comic_relief`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Makes everything funny. Falls over things, says the wrong thing at the wrong time, laughs at danger." |
| **weakness_en** | "Can't be serious even when the situation demands it" |
| **strength_en** | "Lightens the mood when fear or frustration peaks — their joke at the worst moment is exactly what's needed" |

### S03: `quiet_genius`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Barely speaks. When they do, it's the most important sentence of the day." |
| **weakness_en** | "Frustratingly uncommunicative — knows the answer but won't share until asked directly" |
| **strength_en** | "The ONE sentence they say changes the entire plan or reveals the hidden truth" |

### S04: `enthusiastic_rookie`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Everything is AMAZING and EXCITING and they've NEVER done this before! Boundless energy and zero experience." |
| **weakness_en** | "Dangerously naive — their excitement creates problems the experienced characters have to fix" |
| **strength_en** | "Their fresh perspective sees solutions the experienced characters are blind to" |

### S05: `reluctant_expert`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Knows everything about THIS topic but insists they don't want to be involved." |
| **weakness_en** | "Pretends not to care while clearly caring. Won't commit until the last possible moment." |
| **strength_en** | "When they FINALLY commit, their expertise is exactly what was missing" |

### S06: `fierce_protector`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Small but fierce. Protective of the group, especially the vulnerable members. Will fight anything." |
| **weakness_en** | "Overprotective — sometimes fights threats that aren't there, or prevents others from taking necessary risks" |
| **strength_en** | "Their fierce loyalty gives others courage they wouldn't have alone" |

### S07: `the_translator`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Understands what everyone means, even when they say it wrong. Bridges misunderstandings." |
| **weakness_en** | "So focused on making everyone understand each other that they forget to express their OWN needs" |
| **strength_en** | "Resolves conflicts by helping both sides hear what the other actually means" |

### S08: `chaos_agent`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Has wild ideas that SOUND terrible but sometimes work brilliantly. Lives to break the rules." |
| **weakness_en** | "Their wild ideas fail more often than they work — they leave messes for others to clean up" |
| **strength_en** | "The ONE time their crazy idea works, it's the only thing that could have worked" |

### S09: `the_documentarian`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Records everything — draws pictures, takes notes, remembers exact quotes. The group's memory." |
| **weakness_en** | "So busy documenting the adventure that they sometimes forget to PARTICIPATE in it" |
| **strength_en** | "Their records reveal patterns nobody noticed, or prove something crucial at the key moment" |

### S10: `animal_companion`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Not a person — a loyal animal with personality. Understands more than it should. Communicates through behavior." |
| **weakness_en** | "Can't explain what it knows — acts in ways that seem random until the pattern becomes clear" |
| **strength_en** | "Senses danger before anyone, finds hidden things, provides comfort without words" |

---

## Antagonist Archetypes (8 Seeds)

Nicht "böse" — sondern nachvollziehbar falsch handelnd. Jeder Antagonist hat einen GRUND.

### A01: `the_scared_bully`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Acts tough and mean, but underneath is scared — of being seen as weak, of losing control, of their own situation at home" |
| **motivation_en** | "Controls others because their own life feels out of control" |
| **redemption_hint_en** | "A moment where the mask slips and the fear shows through" |

### A02: `the_jealous_friend`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Used to be close to the protagonist, now acts cold or sabotaging. Jealousy eats at them." |
| **motivation_en** | "Feels replaced, left behind, or inferior. Their actions are a distorted cry for attention." |
| **redemption_hint_en** | "When confronted, they break down: 'I just missed you'" |

### A03: `the_well_meaning_controller`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "An adult or older kid who restricts the protagonist 'for their own good.' Genuinely cares, but smothers." |
| **motivation_en** | "Love expressed as control. Has experienced loss and is terrified of it happening again." |
| **redemption_hint_en** | "Realizes they're protecting themselves, not the protagonist" |

### A04: `the_rule_worshipper`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Follows every rule rigidly. Reports infractions. Can't understand why anyone would break a rule." |
| **motivation_en** | "Rules make the world safe and predictable. Without them, everything is chaos — and chaos is terrifying." |
| **redemption_hint_en** | "A situation where the rules clearly cause harm, forcing a choice between rules and kindness" |

### A05: `the_rival`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Competes with the protagonist for the same thing — a position, a prize, someone's attention. Talented and driven." |
| **motivation_en** | "Needs to win because winning is the only way they feel valued. Second place means invisible." |
| **redemption_hint_en** | "Mutual respect after genuine competition — 'You're actually good at this'" |

### A06: `the_trickster`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Manipulates through charm and cleverness. Gets others to do things by making it seem like THEIR idea." |
| **motivation_en** | "Learned that being direct doesn't work. Has been ignored or punished for honesty." |
| **redemption_hint_en** | "When someone sees through the trick AND still helps — being seen is what they actually needed" |

### A07: `the_pack_leader`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Leader of a group that excludes or pressures others. Sets the social rules." |
| **motivation_en** | "Terrified of being on the outside. Maintains control of the group because being alone is unbearable." |
| **redemption_hint_en** | "A moment alone reveals the loneliness underneath the social power" |

### A08: `the_careless_one`
| Field | Value |
|-------|-------|
| **personality_trait_en** | "Not intentionally mean — just thoughtless. Hurts others through inattention, selfishness, or obliviousness." |
| **motivation_en** | "Genuinely doesn't realize the impact of their behavior. Never learned to see from others' perspectives." |
| **redemption_hint_en** | "When shown the impact — genuine shock and remorse. 'I didn't know. I'm sorry.'" |

---

## Zusammenfassung

| Seed Type | Count | Coverage |
|-----------|-------|----------|
| Protagonist Appearances | 30 | 12 cultural backgrounds, 15F/13M/2N, all ages |
| Sidekick Archetypes | 10 | Role-based, gender-agnostic |
| Antagonist Archetypes | 8 | Motivation-driven, redeemable |
| **Total** | **48** | |

### Cultural Background Distribution (Protagonists)

| Background | Count |
|-----------|-------|
| west_african | 2 |
| east_african | 1 |
| east_asian | 2 |
| south_asian | 2 |
| southeast_asian | 1 |
| central_asian | 1 |
| middle_eastern | 2 |
| north_african | 1 |
| latin_american | 2 |
| south_american | 1 |
| caribbean | 1 |
| nordic | 3 |
| west_european | 1 |
| central_european | 1 |
| south_european | 2 |
| eastern_european | 2 |
| oceanian | 2 |
| indigenous_american | 1 |
| mixed | 2 |

---

*Dieses Dokument enthält die vollständigen Seed-Daten für die `character_seeds` Tabelle.*
