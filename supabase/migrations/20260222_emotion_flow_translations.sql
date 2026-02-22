-- ============================================================
-- Emotion-Flow-Engine: Translations for emotion_blueprints (Task 3.4)
-- Adds: fr, es, nl, it, bs to labels and descriptions JSONB
-- ============================================================

UPDATE emotion_blueprints SET
  labels = '{"de": "Übermut und Fall", "en": "Overconfidence and Fall", "fr": "L''excès de confiance", "es": "Exceso de confianza", "nl": "Overmoed en val", "it": "Troppa sicurezza", "bs": "Pretjerana samouvjerenost"}',
  descriptions = '{"de": "Kind überschätzt sich, scheitert, lernt Hilfe anzunehmen", "en": "Child overestimates themselves, fails, learns to accept help", "fr": "L''enfant se surestime, échoue et apprend à accepter de l''aide", "es": "El niño se sobreestima, fracasa y aprende a aceptar ayuda", "nl": "Kind overschat zichzelf, faalt en leert hulp te accepteren", "it": "Il bambino si sopravvaluta, fallisce e impara ad accettare aiuto", "bs": "Dijete precijeni sebe, ne uspije i nauči prihvatiti pomoć"}'
WHERE blueprint_key = 'overconfidence_and_fall';

UPDATE emotion_blueprints SET
  labels = '{"de": "Von Angst zu Mut", "en": "Fear to Courage", "fr": "De la peur au courage", "es": "Del miedo al coraje", "nl": "Van angst naar moed", "it": "Dalla paura al coraggio", "bs": "Od straha do hrabrosti"}',
  descriptions = '{"de": "Kind überwindet eine konkrete Angst Schritt für Schritt", "en": "Child overcomes a specific fear step by step", "fr": "L''enfant surmonte une peur concrète pas à pas", "es": "El niño supera un miedo concreto paso a paso", "nl": "Kind overwint een specifieke angst stap voor stap", "it": "Il bambino supera una paura concreta passo dopo passo", "bs": "Dijete korak po korak prevazilazi konkretan strah"}'
WHERE blueprint_key = 'fear_to_courage';

UPDATE emotion_blueprints SET
  labels = '{"de": "Scheitern ist Lernen", "en": "Failure is Learning", "fr": "Échouer, c''est apprendre", "es": "Fracasar es aprender", "nl": "Falen is leren", "it": "Fallire è imparare", "bs": "Neuspjeh je učenje"}',
  descriptions = '{"de": "Kind scheitert, wird frustriert, findet einen neuen Weg", "en": "Child fails, gets frustrated, finds a new approach", "fr": "L''enfant échoue, se frustre et trouve une nouvelle approche", "es": "El niño fracasa, se frustra y encuentra un nuevo camino", "nl": "Kind faalt, raakt gefrustreerd en vindt een nieuwe aanpak", "it": "Il bambino fallisce, si frustra e trova un nuovo approccio", "bs": "Dijete ne uspije, frustrira se i pronađe novi put"}'
WHERE blueprint_key = 'failure_is_learning';

UPDATE emotion_blueprints SET
  labels = '{"de": "Die eigene Stimme finden", "en": "Finding Your Voice", "fr": "Trouver sa voix", "es": "Encontrar tu voz", "nl": "Je eigen stem vinden", "it": "Trovare la propria voce", "bs": "Pronalaženje vlastitog glasa"}',
  descriptions = '{"de": "Kind überwindet Schüchternheit und verschafft sich Gehör", "en": "Child overcomes shyness and makes themselves heard", "fr": "L''enfant surmonte sa timidité et se fait entendre", "es": "El niño supera la timidez y se hace escuchar", "nl": "Kind overwint verlegenheid en laat zich horen", "it": "Il bambino supera la timidezza e si fa sentire", "bs": "Dijete prevazilazi stidljivost i čini da ga čuju"}'
WHERE blueprint_key = 'finding_your_voice';

UPDATE emotion_blueprints SET
  labels = '{"de": "Für andere einstehen", "en": "Standing Up for Others", "fr": "Défendre les autres", "es": "Defender a los demás", "nl": "Opkomen voor anderen", "it": "Difendere gli altri", "bs": "Zauzimanje za druge"}',
  descriptions = '{"de": "Kind beobachtet Ungerechtigkeit und findet Mut einzugreifen", "en": "Child witnesses injustice and finds courage to intervene", "fr": "L''enfant observe une injustice et trouve le courage d''intervenir", "es": "El niño observa una injusticia y encuentra el coraje para intervenir", "nl": "Kind ziet onrecht en vindt de moed om in te grijpen", "it": "Il bambino osserva un''ingiustizia e trova il coraggio di intervenire", "bs": "Dijete primijeti nepravdu i nađe hrabrost da reaguje"}'
WHERE blueprint_key = 'standing_up_for_others';

UPDATE emotion_blueprints SET
  labels = '{"de": "Der Außenseiter", "en": "The Outsider", "fr": "L''outsider", "es": "El forastero", "nl": "De buitenstaander", "it": "L''outsider", "bs": "Autsajder"}',
  descriptions = '{"de": "Kind ist anders, versucht sich anzupassen, wird am Ende für sein Anderssein geschätzt", "en": "Child is different, tries to fit in, is eventually valued for being different", "fr": "L''enfant est différent, essaie de s''intégrer et finit par être apprécié pour sa différence", "es": "El niño es diferente, intenta encajar y al final es valorado por ser diferente", "nl": "Kind is anders, probeert erbij te horen en wordt uiteindelijk gewaardeerd om het anders-zijn", "it": "Il bambino è diverso, cerca di adattarsi e alla fine viene apprezzato per la sua diversità", "bs": "Dijete je drugačije, pokušava se uklopiti i na kraju bude cijenjeno zbog svoje različitosti"}'
WHERE blueprint_key = 'the_outsider';

UPDATE emotion_blueprints SET
  labels = '{"de": "Das große Missverständnis", "en": "Misunderstanding Resolved", "fr": "Le grand malentendu", "es": "El gran malentendido", "nl": "Het grote misverstand", "it": "Il grande malinteso", "bs": "Veliki nesporazum"}',
  descriptions = '{"de": "Freundschaft wird durch ein Missverständnis auf die Probe gestellt", "en": "Friendship tested by a misunderstanding", "fr": "Une amitié mise à l''épreuve par un malentendu", "es": "Una amistad puesta a prueba por un malentendido", "nl": "Vriendschap op de proef gesteld door een misverstand", "it": "Un''amicizia messa alla prova da un malinteso", "bs": "Prijateljstvo na kušnji zbog nesporazuma"}'
WHERE blueprint_key = 'misunderstanding_resolved';

UPDATE emotion_blueprints SET
  labels = '{"de": "Unerwartete Freundschaft", "en": "Unexpected Friendship", "fr": "Amitié inattendue", "es": "Amistad inesperada", "nl": "Onverwachte vriendschap", "it": "Amicizia inaspettata", "bs": "Neočekivano prijateljstvo"}',
  descriptions = '{"de": "Zwei sehr verschiedene Kinder entdecken eine überraschende Verbindung", "en": "Two very different children discover a surprising connection", "fr": "Deux enfants très différents découvrent un lien surprenant", "es": "Dos niños muy diferentes descubren una conexión sorprendente", "nl": "Twee heel verschillende kinderen ontdekken een verrassende band", "it": "Due bambini molto diversi scoprono un legame sorprendente", "bs": "Dvoje veoma različite djece otkrivaju iznenađujuću povezanost"}'
WHERE blueprint_key = 'unexpected_friendship';

UPDATE emotion_blueprints SET
  labels = '{"de": "Loslassen", "en": "Letting Go", "fr": "Lâcher prise", "es": "Dejar ir", "nl": "Loslaten", "it": "Lasciar andare", "bs": "Puštanje"}',
  descriptions = '{"de": "Kind muss etwas/jemanden loslassen und findet Neues", "en": "Child has to let go of something/someone and finds something new", "fr": "L''enfant doit lâcher prise et découvre quelque chose de nouveau", "es": "El niño debe soltar algo o a alguien y encuentra algo nuevo", "nl": "Kind moet iets of iemand loslaten en vindt iets nieuws", "it": "Il bambino deve lasciar andare qualcosa e trova qualcosa di nuovo", "bs": "Dijete mora pustiti nešto ili nekoga i pronalazi nešto novo"}'
WHERE blueprint_key = 'letting_go';

UPDATE emotion_blueprints SET
  labels = '{"de": "Das erste Mal", "en": "First Time", "fr": "La première fois", "es": "La primera vez", "nl": "De eerste keer", "it": "La prima volta", "bs": "Prvi put"}',
  descriptions = '{"de": "Kind erlebt etwas zum ersten Mal — Aufregung, Angst und Triumph", "en": "Child experiences something for the first time — excitement, fear, and triumph", "fr": "L''enfant vit quelque chose pour la première fois — excitation, peur et triomphe", "es": "El niño experimenta algo por primera vez — emoción, miedo y triunfo", "nl": "Kind beleeft iets voor het eerst — opwinding, angst en triomf", "it": "Il bambino vive qualcosa per la prima volta — emozione, paura e trionfo", "bs": "Dijete doživljava nešto prvi put — uzbuđenje, strah i trijumf"}'
WHERE blueprint_key = 'first_time';

UPDATE emotion_blueprints SET
  labels = '{"de": "Etwas Kleines beschützen", "en": "Protecting Something Small", "fr": "Protéger quelque chose de petit", "es": "Proteger algo pequeño", "nl": "Iets kleins beschermen", "it": "Proteggere qualcosa di piccolo", "bs": "Zaštititi nešto malo"}',
  descriptions = '{"de": "Kind entdeckt etwas Verletzliches und riskiert etwas, um es zu beschützen", "en": "Child discovers something vulnerable and takes risks to protect it", "fr": "L''enfant découvre quelque chose de fragile et prend des risques pour le protéger", "es": "El niño descubre algo vulnerable y se arriesga para protegerlo", "nl": "Kind ontdekt iets kwetsbaars en neemt risico''s om het te beschermen", "it": "Il bambino scopre qualcosa di vulnerabile e rischia per proteggerlo", "bs": "Dijete otkriva nešto ranjivo i riskira da bi to zaštitilo"}'
WHERE blueprint_key = 'protecting_something_small';

UPDATE emotion_blueprints SET
  labels = '{"de": "Das Richtige tun", "en": "Doing the Right Thing", "fr": "Faire ce qui est juste", "es": "Hacer lo correcto", "nl": "Het juiste doen", "it": "Fare la cosa giusta", "bs": "Uraditi pravu stvar"}',
  descriptions = '{"de": "Kind steht vor einer Versuchung und ringt mit dem Gewissen", "en": "Child faces temptation and wrestles with their conscience", "fr": "L''enfant fait face à la tentation et lutte avec sa conscience", "es": "El niño enfrenta la tentación y lucha con su conciencia", "nl": "Kind staat voor een verleiding en worstelt met het geweten", "it": "Il bambino affronta la tentazione e lotta con la coscienza", "bs": "Dijete se suočava s iskušenjem i bori se sa savješću"}'
WHERE blueprint_key = 'doing_the_right_thing';

UPDATE emotion_blueprints SET
  labels = '{"de": "In ihren Schuhen", "en": "Walking in Their Shoes", "fr": "Dans leurs chaussures", "es": "En sus zapatos", "nl": "In hun schoenen", "it": "Nei loro panni", "bs": "U njihovim cipelama"}',
  descriptions = '{"de": "Kind lernt die Perspektive einer anderen Person zu verstehen", "en": "Child learns to understand another person''s perspective", "fr": "L''enfant apprend à comprendre le point de vue d''une autre personne", "es": "El niño aprende a entender la perspectiva de otra persona", "nl": "Kind leert het perspectief van een ander te begrijpen", "it": "Il bambino impara a comprendere il punto di vista di un''altra persona", "bs": "Dijete uči razumjeti perspektivu druge osobe"}'
WHERE blueprint_key = 'walking_in_their_shoes';

UPDATE emotion_blueprints SET
  labels = '{"de": "Der unsichtbare Helfer", "en": "The Invisible Helper", "fr": "L''aide invisible", "es": "El ayudante invisible", "nl": "De onzichtbare helper", "it": "L''aiutante invisibile", "bs": "Nevidljivi pomagač"}',
  descriptions = '{"de": "Jemand hilft im Verborgenen — und löst eine Kettenreaktion der Freundlichkeit aus", "en": "Someone helps secretly — triggering a chain reaction of kindness", "fr": "Quelqu''un aide en secret — déclenchant une réaction en chaîne de gentillesse", "es": "Alguien ayuda en secreto — desencadenando una reacción en cadena de amabilidad", "nl": "Iemand helpt in het geheim — en zet een kettingreactie van vriendelijkheid in gang", "it": "Qualcuno aiuta in segreto — innescando una reazione a catena di gentilezza", "bs": "Neko pomaže u tajnosti — pokrećući lančanu reakciju dobrote"}'
WHERE blueprint_key = 'the_invisible_helper';

UPDATE emotion_blueprints SET
  labels = '{"de": "Vergeben", "en": "Forgiving", "fr": "Pardonner", "es": "Perdonar", "nl": "Vergeven", "it": "Perdonare", "bs": "Opraštanje"}',
  descriptions = '{"de": "Kind wird verletzt, erlebt Wut, und findet einen Weg zu vergeben (nicht zu vergessen)", "en": "Child is hurt, experiences anger, and finds a way to forgive (not forget)", "fr": "L''enfant est blessé, ressent de la colère et trouve un moyen de pardonner (pas d''oublier)", "es": "El niño es herido, siente rabia y encuentra un camino para perdonar (no olvidar)", "nl": "Kind wordt gekwetst, ervaart woede en vindt een weg om te vergeven (niet te vergeten)", "it": "Il bambino viene ferito, prova rabbia e trova un modo per perdonare (non dimenticare)", "bs": "Dijete bude povrijeđeno, osjeća ljutnju i pronalazi način da oprosti (ne zaboravi)"}'
WHERE blueprint_key = 'forgiving';

UPDATE emotion_blueprints SET
  labels = '{"de": "Chaos-Kaskade", "en": "Chaos Cascade", "fr": "Cascade de chaos", "es": "Cascada de caos", "nl": "Chaos-cascade", "it": "Cascata di caos", "bs": "Kaskada haosa"}',
  descriptions = '{"de": "Kleiner Fehler wird zur Lawine — totales Chaos mit befreiendem Lachen", "en": "Small mistake snowballs into total chaos with liberating laughter", "fr": "Une petite erreur devient une avalanche — chaos total avec un rire libérateur", "es": "Un pequeño error se convierte en una avalancha — caos total con risa liberadora", "nl": "Een klein foutje wordt een lawine — totale chaos met bevrijdend lachen", "it": "Un piccolo errore diventa una valanga — caos totale con risata liberatoria", "bs": "Mala greška preraste u lavinu — totalni haos s oslobađajućim smijehom"}'
WHERE blueprint_key = 'chaos_cascade';

UPDATE emotion_blueprints SET
  labels = '{"de": "Der Plan, der schiefgeht", "en": "The Plan That Backfires", "fr": "Le plan qui tourne mal", "es": "El plan que sale mal", "nl": "Het plan dat mislukt", "it": "Il piano che va storto", "bs": "Plan koji krene naopako"}',
  descriptions = '{"de": "Genialer Plan hat unerwartete Nebenwirkungen — es klappt anders als gedacht", "en": "Genius plan has unexpected side effects — it works out differently than planned", "fr": "Un plan génial a des effets secondaires inattendus — ça marche autrement que prévu", "es": "Un plan genial tiene efectos secundarios inesperados — funciona de manera diferente a lo planeado", "nl": "Geniaal plan heeft onverwachte bijeffecten — het loopt anders dan gepland", "it": "Un piano geniale ha effetti collaterali inattesi — funziona diversamente dal previsto", "bs": "Genijalan plan ima neočekivane nuspojave — ispada drugačije nego što je planirano"}'
WHERE blueprint_key = 'the_plan_that_backfires';

UPDATE emotion_blueprints SET
  labels = '{"de": "Rollentausch-Komödie", "en": "Role Reversal Comedy", "fr": "Comédie d''échange de rôles", "es": "Comedia de intercambio de roles", "nl": "Rollenwissel-komedie", "it": "Commedia dello scambio di ruoli", "bs": "Komedija zamjene uloga"}',
  descriptions = '{"de": "Rollen werden getauscht — komische Situationen führen zu gegenseitigem Verständnis", "en": "Roles are swapped — funny situations lead to mutual understanding", "fr": "Les rôles sont échangés — des situations comiques mènent à la compréhension mutuelle", "es": "Los roles se intercambian — situaciones cómicas llevan a la comprensión mutua", "nl": "Rollen worden omgewisseld — grappige situaties leiden tot wederzijds begrip", "it": "I ruoli vengono scambiati — situazioni comiche portano alla comprensione reciproca", "bs": "Uloge se zamijene — smiješne situacije vode do međusobnog razumijevanja"}'
WHERE blueprint_key = 'role_reversal_comedy';

UPDATE emotion_blueprints SET
  labels = '{"de": "Eine verborgene Welt entdecken", "en": "Discovering a Hidden World", "fr": "Découvrir un monde caché", "es": "Descubrir un mundo oculto", "nl": "Een verborgen wereld ontdekken", "it": "Scoprire un mondo nascosto", "bs": "Otkriti skriveni svijet"}',
  descriptions = '{"de": "Kind entdeckt eine verborgene Welt und hütet das Geheimnis", "en": "Child discovers a hidden world and guards the secret", "fr": "L''enfant découvre un monde caché et garde le secret", "es": "El niño descubre un mundo oculto y guarda el secreto", "nl": "Kind ontdekt een verborgen wereld en bewaakt het geheim", "it": "Il bambino scopre un mondo nascosto e custodisce il segreto", "bs": "Dijete otkriva skriveni svijet i čuva tajnu"}'
WHERE blueprint_key = 'discovering_a_hidden_world';

UPDATE emotion_blueprints SET
  labels = '{"de": "Das Unmögliche möglich machen", "en": "The Impossible Made Possible", "fr": "Rendre l''impossible possible", "es": "Hacer posible lo imposible", "nl": "Het onmogelijke mogelijk maken", "it": "Rendere possibile l''impossibile", "bs": "Učiniti nemoguće mogućim"}',
  descriptions = '{"de": "Kind stellt fest, dass das ''Unmögliche'' nur ''noch nicht versucht'' bedeutet", "en": "Child discovers that ''impossible'' just means ''not tried yet''", "fr": "L''enfant découvre que ''impossible'' signifie juste ''pas encore essayé''", "es": "El niño descubre que ''imposible'' solo significa ''aún no intentado''", "nl": "Kind ontdekt dat ''onmogelijk'' gewoon ''nog niet geprobeerd'' betekent", "it": "Il bambino scopre che ''impossibile'' significa solo ''non ancora provato''", "bs": "Dijete otkriva da ''nemoguće'' znači samo ''još nije pokušano''"}'
WHERE blueprint_key = 'the_impossible_made_possible';

UPDATE emotion_blueprints SET
  labels = '{"de": "Die Natur spricht", "en": "Nature Speaks", "fr": "La nature parle", "es": "La naturaleza habla", "nl": "De natuur spreekt", "it": "La natura parla", "bs": "Priroda govori"}',
  descriptions = '{"de": "Kind geht in die Natur, beobachtet etwas Erstaunliches, und sieht die Welt anders", "en": "Child goes into nature, observes something amazing, and sees the world differently", "fr": "L''enfant va dans la nature, observe quelque chose d''extraordinaire et voit le monde autrement", "es": "El niño va a la naturaleza, observa algo asombroso y ve el mundo de otra manera", "nl": "Kind gaat de natuur in, observeert iets verbazingwekkends en ziet de wereld anders", "it": "Il bambino va nella natura, osserva qualcosa di straordinario e vede il mondo in modo diverso", "bs": "Dijete ide u prirodu, posmatra nešto nevjerovatno i vidi svijet drugačije"}'
WHERE blueprint_key = 'nature_speaks';
