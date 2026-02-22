-- ============================================================
-- T-C1: DB-Übersetzungen — difficulty_rules
-- Adds: tr, bg, ro, pl, lt, hu, ca, sl to label + description
-- Key: difficulty_level, language (9 rows: 1,2,3 × de, en, fr)
-- ============================================================

UPDATE difficulty_rules SET
  label = label || '{"tr": "Kolay", "bg": "Лесно", "ro": "Ușor", "pl": "Łatwy", "lt": "Lengvas", "hu": "Könnyű", "ca": "Fàcil", "sl": "Lahko"}'::jsonb,
  description = description || '{"tr": "Basit kelimeler, az yeni sözcük. Çocuk dostu ve rahat okuma.", "bg": "Прост речник, малко нови думи. Подходящ за деца и лесно четене.", "ro": "Vocabular simplu, puține cuvinte noi. Prietenos și ușor de citit.", "pl": "Proste słownictwo, mało nowych słów. Przyjazne i łatwe do czytania.", "lt": "Paprastas žodynas, mažai naujų žodžių. Draugiška ir lengva skaityti.", "hu": "Egyszerű szókincs, kevés új szó. Gyerekbarát és könnyen olvasható.", "ca": "Vocabulari simple, pocs mots nous. Amigable i fàcil de llegir.", "sl": "Preprost besedišče, malo novih besed. Prijazno in enostavno za branje."}'::jsonb
WHERE difficulty_level = 1 AND language = 'de';

UPDATE difficulty_rules SET
  label = label || '{"tr": "Kolay", "bg": "Лесно", "ro": "Ușor", "pl": "Łatwy", "lt": "Lengvas", "hu": "Könnyű", "ca": "Fàcil", "sl": "Lahko"}'::jsonb,
  description = description || '{"tr": "Basit kelimeler, az yeni sözcük. Çocuk dostu ve rahat okuma.", "bg": "Прост речник, малко нови думи. Подходящ за деца и лесно четене.", "ro": "Vocabular simplu, puține cuvinte noi. Prietenos și ușor de citit.", "pl": "Proste słownictwo, mało nowych słów. Przyjazne i łatwe do czytania.", "lt": "Paprastas žodynas, mažai naujų žodžių. Draugiška ir lengva skaityti.", "hu": "Egyszerű szókincs, kevés új szó. Gyerekbarát és könnyen olvasható.", "ca": "Vocabulari simple, pocs mots nous. Amigable i fàcil de llegir.", "sl": "Preprost besedišče, malo novih besed. Prijazno in enostavno za branje."}'::jsonb
WHERE difficulty_level = 1 AND language = 'en';

UPDATE difficulty_rules SET
  label = label || '{"tr": "Kolay", "bg": "Лесно", "ro": "Ușor", "pl": "Łatwy", "lt": "Lengvas", "hu": "Könnyű", "ca": "Fàcil", "sl": "Lahko"}'::jsonb,
  description = description || '{"tr": "Basit kelimeler, az yeni sözcük. Çocuk dostu ve rahat okuma.", "bg": "Прост речник, малко нови думи. Подходящ за деца и лесно четене.", "ro": "Vocabular simplu, puține cuvinte noi. Prietenos și ușor de citit.", "pl": "Proste słownictwo, mało nowych słów. Przyjazne i łatwe do czytania.", "lt": "Paprastas žodynas, mažai naujų žodžių. Draugiška ir lengva skaityti.", "hu": "Egyszerű szókincs, kevés új szó. Gyerekbarát és könnyen olvasható.", "ca": "Vocabulari simple, pocs mots nous. Amigable i fàcil de llegir.", "sl": "Preprost besedišče, malo novih besed. Prijazno in enostavno za branje."}'::jsonb
WHERE difficulty_level = 1 AND language = 'fr';

UPDATE difficulty_rules SET
  label = label || '{"tr": "Orta", "bg": "Средно", "ro": "Mediu", "pl": "Średni", "lt": "Vidutinis", "hu": "Közepes", "ca": "Mitjà", "sl": "Srednji"}'::jsonb,
  description = description || '{"tr": "Orta düzey kelime, biraz yeni sözcük. Dengeli ve anlaşılır.", "bg": "Средна сложност на речника, умерено нови думи. Балансирано и разбираемо.", "ro": "Vocabular de dificultate medie, câteva cuvinte noi. Echilibrat și clar.", "pl": "Średni poziom słownictwa, trochę nowych słów. Zbalansowany i zrozumiały.", "lt": "Vidutinio sudėtingumo žodynas, šiek tiek naujų žodžių. Subalansuota ir aiški.", "hu": "Közepes szókincs, néhány új szó. Kiegyensúlyozott és érthető.", "ca": "Vocabulari mitjà, alguns mots nous. Equilibrat i comprensible.", "sl": "Srednja zahtevnost besedišča, nekaj novih besed. Uravnoteženo in razumljivo."}'::jsonb
WHERE difficulty_level = 2 AND language = 'de';

UPDATE difficulty_rules SET
  label = label || '{"tr": "Orta", "bg": "Средно", "ro": "Mediu", "pl": "Średni", "lt": "Vidutinis", "hu": "Közepes", "ca": "Mitjà", "sl": "Srednji"}'::jsonb,
  description = description || '{"tr": "Orta düzey kelime, biraz yeni sözcük. Dengeli ve anlaşılır.", "bg": "Средна сложност на речника, умерено нови думи. Балансирано и разбираемо.", "ro": "Vocabular de dificultate medie, câteva cuvinte noi. Echilibrat și clar.", "pl": "Średni poziom słownictwa, trochę nowych słów. Zbalansowany i zrozumiały.", "lt": "Vidutinio sudėtingumo žodynas, šiek tiek naujų žodžių. Subalansuota ir aiški.", "hu": "Közepes szókincs, néhány új szó. Kiegyensúlyozott és érthető.", "ca": "Vocabulari mitjà, alguns mots nous. Equilibrat i comprensible.", "sl": "Srednja zahtevnost besedišča, nekaj novih besed. Uravnoteženo in razumljivo."}'::jsonb
WHERE difficulty_level = 2 AND language = 'en';

UPDATE difficulty_rules SET
  label = label || '{"tr": "Orta", "bg": "Средно", "ro": "Mediu", "pl": "Średni", "lt": "Vidutinis", "hu": "Közepes", "ca": "Mitjà", "sl": "Srednji"}'::jsonb,
  description = description || '{"tr": "Orta düzey kelime, biraz yeni sözcük. Dengeli ve anlaşılır.", "bg": "Средна сложност на речника, умерено нови думи. Балансирано и разбираемо.", "ro": "Vocabular de dificultate medie, câteva cuvinte noi. Echilibrat și clar.", "pl": "Średni poziom słownictwa, trochę nowych słów. Zbalansowany i zrozumiały.", "lt": "Vidutinio sudėtingumo žodynas, šiek tiek naujų žodžių. Subalansuota ir aiški.", "hu": "Közepes szókincs, néhány új szó. Kiegyensúlyozott és érthető.", "ca": "Vocabulari mitjà, alguns mots nous. Equilibrat i comprensible.", "sl": "Srednja zahtevnost besedišča, nekaj novih besed. Uravnoteženo in razumljivo."}'::jsonb
WHERE difficulty_level = 2 AND language = 'fr';

UPDATE difficulty_rules SET
  label = label || '{"tr": "Zor", "bg": "Трудно", "ro": "Dificil", "pl": "Trudny", "lt": "Sunkus", "hu": "Nehéz", "ca": "Difícil", "sl": "Težko"}'::jsonb,
  description = description || '{"tr": "Daha zengin kelime, daha fazla yeni sözcük. Meydan okuyucu ve geliştirici.", "bg": "По-богат речник, повече нови думи. Предизвикателно и развиващо.", "ro": "Vocabular mai bogat, mai multe cuvinte noi. Provocator și formator.", "pl": "Bogatsze słownictwo, więcej nowych słów. Wymagające i rozwijające.", "lt": "Turtingesnis žodynas, daugiau naujų žodžių. Iššūkių kupinas ir lavinantis.", "hu": "Gazdagabb szókincs, több új szó. Kihívás és fejlesztő.", "ca": "Vocabulari més ric, més mots nous. Desafiador i enriquidor.", "sl": "Bogatejše besedišče, več novih besed. Zahtevno in spodbudno."}'::jsonb
WHERE difficulty_level = 3 AND language = 'de';

UPDATE difficulty_rules SET
  label = label || '{"tr": "Zor", "bg": "Трудно", "ro": "Dificil", "pl": "Trudny", "lt": "Sunkus", "hu": "Nehéz", "ca": "Difícil", "sl": "Težko"}'::jsonb,
  description = description || '{"tr": "Daha zengin kelime, daha fazla yeni sözcük. Meydan okuyucu ve geliştirici.", "bg": "По-богат речник, повече нови думи. Предизвикателно и развиващо.", "ro": "Vocabular mai bogat, mai multe cuvinte noi. Provocator și formator.", "pl": "Bogatsze słownictwo, więcej nowych słów. Wymagające i rozwijające.", "lt": "Turtingesnis žodynas, daugiau naujų žodžių. Iššūkių kupinas ir lavinantis.", "hu": "Gazdagabb szókincs, több új szó. Kihívás és fejlesztő.", "ca": "Vocabulari més ric, més mots nous. Desafiador i enriquidor.", "sl": "Bogatejše besedišče, več novih besed. Zahtevno in spodbudno."}'::jsonb
WHERE difficulty_level = 3 AND language = 'en';

UPDATE difficulty_rules SET
  label = label || '{"tr": "Zor", "bg": "Трудно", "ro": "Dificil", "pl": "Trudny", "lt": "Sunkus", "hu": "Nehéz", "ca": "Difícil", "sl": "Težko"}'::jsonb,
  description = description || '{"tr": "Daha zengin kelime, daha fazla yeni sözcük. Meydan okuyucu ve geliştirici.", "bg": "По-богат речник, повече нови думи. Предизвикателно и развиващо.", "ro": "Vocabular mai bogat, mai multe cuvinte noi. Provocator și formator.", "pl": "Bogatsze słownictwo, więcej nowych słów. Wymagające i rozwijające.", "lt": "Turtingesnis žodynas, daugiau naujų žodžių. Iššūkių kupinas ir lavinantis.", "hu": "Gazdagabb szókincs, több új szó. Kihívás és fejlesztő.", "ca": "Vocabulari més ric, més mots nous. Desafiador i enriquidor.", "sl": "Bogatejše besedišče, več novih besed. Zahtevno in spodbudno."}'::jsonb
WHERE difficulty_level = 3 AND language = 'fr';
