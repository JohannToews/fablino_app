-- ============================================================
-- T-C1: DB-Übersetzungen — image_styles
-- Adds: tr, bg, ro, pl, lt, hu, ca, sl to labels + description
-- ============================================================

UPDATE image_styles SET
  labels = labels || '{"tr": "Resimli Kitap (Yumuşak)", "bg": "Илюстрована книга (Мека)", "ro": "Carte ilustrată (Blând)", "pl": "Książka obrazkowa (Miękka)", "lt": "Paveikslėlių knyga (Švelni)", "hu": "Képregény (Lágy)", "ca": "Àlbum il·lustrat (Suau)", "sl": "Slikanica (Mehka)"}'::jsonb,
  description = description || '{"tr": "Klasik resimli kitap gibi yumuşak, sıcak renkler. Yuvarlak formlar, yumuşak geçişler.", "bg": "Меки, топли цветове като в класическа илюстрована книга. Закръглени форми, нежни преходи.", "ro": "Culori calde și moi ca într-o carte ilustrată clasică. Forme rotunjite, tranziții blande.", "pl": "Miękkie, ciepłe kolory jak w klasycznej książce obrazkowej. Zaokrąglone kształty, łagodne przejścia.", "lt": "Švelnios, šiltos spalvos kaip klasikinėje paveikslėlių knygoje. Apvalios formos, švelnūs perėjimai.", "hu": "Puha, meleg színek, mint egy klasszikus képeskönyvben. Kerekded formák, gyengéd átmenetek.", "ca": "Colors suaus i càlids com un àlbum clàssic. Formes arrodonides, transicions suaus.", "sl": "Mehke, tople barve kot v klasični slikanici. Zaobljene oblike, nežni prehodi."}'::jsonb
WHERE style_key = 'storybook_soft';

UPDATE image_styles SET
  labels = labels || '{"tr": "Resimli Kitap (Canlı)", "bg": "Илюстрована книга (Ярка)", "ro": "Carte ilustrată (Vibrant)", "pl": "Książka obrazkowa (Żywa)", "lt": "Paveikslėlių knyga (Ryški)", "hu": "Képregény (Élénk)", "ca": "Àlbum il·lustrat (Viu)", "sl": "Slikanica (Živa)"}'::jsonb,
  description = description || '{"tr": "Canlı, sıcak renkler. Net çizgiler, ifadeli karakterler, enerji dolu sahneler.", "bg": "Ярки, топли цветове. Ясни линии, изразителни герои, енергични сцени.", "ro": "Culori vibrante și calde. Linii clare, personaje expresive, scene pline de viață.", "pl": "Żywe, ciepłe kolory. Wyraźne linie, wyraziste postacie, energiczne sceny.", "lt": "Ryškios, šiltos spalvos. Aiškios linijos, ekspresyvūs personažai, energingos scenos.", "hu": "Élénk, meleg színek. Tiszta vonalak, kifejező karakterek, energikus jelenetek.", "ca": "Colors vius i càlids. Línies clares, personatges expressius, escenes enèrgiques.", "sl": "Žive, tople barve. Jasne črte, izraziti liki, energični prizori."}'::jsonb
WHERE style_key = 'storybook_vibrant';

UPDATE image_styles SET
  labels = labels || '{"tr": "Manga / Anime", "bg": "Манга / Аниме", "ro": "Manga / Anime", "pl": "Manga / Anime", "lt": "Manga / Anime", "hu": "Manga / Anime", "ca": "Manga / Anime", "sl": "Manga / Anime"}'::jsonb,
  description = description || '{"tr": "Anime tarzı büyük gözler, dinamik ifadeler ve canlı renkler. Çocuk dostu ve eğlenceli.", "bg": "Стил аниме с големи очи, динамични изрази и ярки цветове. Подходящ за деца.", "ro": "Stil anime cu ochi mari, expresii dinamice și culori vii. Prietenos și distractiv.", "pl": "Styl anime z dużymi oczami, dynamicznymi wyrazami i żywymi kolorami. Przyjazny dzieciom.", "lt": "Anime stilius su didelėmis akimis, dinamiška išraška ir ryškiomis spalvomis. Draugiškas vaikams.", "hu": "Anime stílus nagy szemekkel, dinamikus kifejezésekkel és élénk színekkel. Gyerekbarát.", "ca": "Estil anime amb ulls grans, expressions dinàmiques i colors vius. Amigable per a nens.", "sl": "Anime slog z velikimi očmi, dinamičnimi izrazi in živimi barvami. Prijazen do otrok."}'::jsonb
WHERE style_key = 'manga_anime';

UPDATE image_styles SET
  labels = labels || '{"tr": "Macera Çizgi Filmi", "bg": "Приключенски анимационен стил", "ro": "Desen animat de aventură", "pl": "Kreskówka przygodowa", "lt": "Nuotykių animacijos stilius", "hu": "Kalandos rajzfilm", "ca": "Dibuix animat d''aventures", "sl": "Pustolovski risankni slog"}'::jsonb,
  description = description || '{"tr": "Eğlenceli, hareketli çizgi film stili. Cesur karakterler ve renkli dünyalar.", "bg": "Забавен, динамичен анимационен стил. Смели герои и цветни светове.", "ro": "Stil de desen animat vesel și dinamic. Personaje curajoase și lumi colorate.", "pl": "Wesoły, dynamiczny styl kreskówki. Odważne postacie i kolorowe światy.", "lt": "Linksmas, dinamiškas animacijos stilius. Drąsūs personažai ir spalvingi pasauliai.", "hu": "Vidám, dinamikus rajzfilmstílus. Bátor karakterek és színes világok.", "ca": "Estil de dibuix animat divertit i dinàmic. Personatges valents i mons colorits.", "sl": "Vesel, dinamičen risankni slog. Pogumni liki in pisan svet."}'::jsonb
WHERE style_key = 'adventure_cartoon';

UPDATE image_styles SET
  labels = labels || '{"tr": "Çizgi Roman", "bg": "Графичен роман", "ro": "Roman grafic", "pl": "Powieść graficzna", "lt": "Grafikų romanų stilius", "hu": "Képregényes regény", "ca": "Novel·la gràfica", "sl": "Grafični roman"}'::jsonb,
  description = description || '{"tr": "Sinematik çizgi roman stili, dramatik ışık ve karmaşık duygular.", "bg": "Кинематографичен стил на графичен роман с драматично осветление.", "ro": "Stil roman grafic cinematografic cu lumină dramatică și emoții complexe.", "pl": "Filmowy styl powieści graficznej z dramatycznym światłem i złożonymi emocjami.", "lt": "Kinematinis grafikų romanų stilius su dramatiška apšvieta ir sudėtingomis emocijomis.", "hu": "Filmias grafikus regény stílus drámai fényvezetéssel és összetett érzelmekkel.", "ca": "Estil de novel·la gràfica cinematogràfica amb il·luminació dramàtica.", "sl": "Filmski slog grafičnega romana z dramatično osvetlitvijo in zapletenimi čustvi."}'::jsonb
WHERE style_key = 'graphic_novel';

UPDATE image_styles SET
  labels = labels || '{"tr": "Yarı Gerçekçi", "bg": "Полуреалистичен", "ro": "Semi-realist", "pl": "Półrealistyczny", "lt": "Pusiau realistinis", "hu": "Félrealista", "ca": "Semi-realista", "sl": "Polrealističen"}'::jsonb,
  description = description || '{"tr": "Sanatsal dokunuşlu neredeyse gerçekçi illüstrasyon. Detaylı ve atmosferik.", "bg": "Почти реалистична илюстрация с художествен нюанс. Детайлна и атмосферна.", "ro": "Ilustrație aproape realistă cu accente artistice. Detaliată și atmosferică.", "pl": "Prawie realistyczna ilustracja z artystycznym sznytem. Szczegółowa i nastrojowa.", "lt": "Beveik realistinė ilustracija su meniniu prieskoniu. Detali ir atmosferiška.", "hu": "Majdnem realisztikus illusztráció művészi touch-sal. Részletes és hangulatos.", "ca": "Il·lustració gairebé realista amb toc artístic. Detallada i atmosfèrica.", "sl": "Skoraj realistična ilustracija z umetniškim pridihom. Podrobna in atmosferska."}'::jsonb
WHERE style_key = 'semi_realistic';
