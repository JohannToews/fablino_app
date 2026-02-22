-- ============================================================
-- T-C1: DB-Übersetzungen — emotion_blueprints
-- Adds: tr, bg, ro, pl, lt, hu, ca, sl to labels + descriptions
-- Merge via JSONB || so existing languages stay.
-- ============================================================

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Kendini Beğenme ve Düşüş", "bg": "Самоувереност и падение", "ro": "Încăpățânare și cădere", "pl": "Pewność siebie i upadek", "lt": "Per didelė pasitikėjimas ir kritimas", "hu": "Önbizalom és bukás", "ca": "Excés de confiança i caiguda", "sl": "Samozavest in padec"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk kendini abartır, başarısız olur ve yardım kabul etmeyi öğrenir", "bg": "Детето се надценява, проваля се и се научава да приема помощ", "ro": "Copilul se supraestimează, eșuează și învață să accepte ajutor", "pl": "Dziecko przecenia siebie, ponosi porażkę i uczy się przyjmować pomoc", "lt": "Vaikas pervertina save, patiria nesėkmę ir išmoksta priimti pagalbą", "hu": "A gyerek túlbecsüli magát, kudarcot vall, és megtanul segítséget fogadni", "ca": "El nen es sobreestima, fracassa i aprèn a acceptar ajuda", "sl": "Otrok se preceni, ne uspe in se nauči sprejeti pomoč"}'::jsonb
WHERE blueprint_key = 'overconfidence_and_fall';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Korkudan Cesarete", "bg": "От страх към смелост", "ro": "De la frică la curaj", "pl": "Od strachu do odwagi", "lt": "Nuo baimės prie drąsos", "hu": "A félelemtől a bátorságig", "ca": "De la por al coratge", "sl": "Od strahu do poguma"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk somut bir korkuyu adım adım yeniyor", "bg": "Детето преодолява конкретен страх стъпка по стъпка", "ro": "Copilul își depășește o frică concretă pas cu pas", "pl": "Dziecko krok po kroku pokonuje konkretny lęk", "lt": "Vaikas žingsnis po žingsnio įveikia konkrečią baimę", "hu": "A gyerek lépésről lépésre legyőz egy konkrét félelmet", "ca": "El nen supera una por concreta pas a pas", "sl": "Otrok korak za korak premaga konkreten strah"}'::jsonb
WHERE blueprint_key = 'fear_to_courage';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Başarısızlık Öğrenmektir", "bg": "Провалът е учене", "ro": "Eșecul înseamnă învățare", "pl": "Porażka to nauka", "lt": "Nesėkmė yra mokymasis", "hu": "A kudarc tanulás", "ca": "Fracassar és aprendre", "sl": "Neuspeh je učenje"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk başarısız olur, hayal kırıklığına uğrar ve yeni bir yol bulur", "bg": "Детето се проваля, разочарова се и намира нов подход", "ro": "Copilul eșuează, se frustrează și găsește o nouă cale", "pl": "Dziecko ponosi porażkę, frustruje się i znajduje nowe podejście", "lt": "Vaikas patiria nesėkmę, susinervina ir randa naują būdą", "hu": "A gyerek kudarcot vall, frusztrálódik és új megközelítést talál", "ca": "El nen fracassa, es frustra i troba una nova manera", "sl": "Otrok ne uspe, se frustrira in najde nov pristop"}'::jsonb
WHERE blueprint_key = 'failure_is_learning';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Kendi Sesini Bulmak", "bg": "Да намериш своя глас", "ro": "Să-ți găsești vocea", "pl": "Znaleźć własny głos", "lt": "Rasti savo balsą", "hu": "Megtalálni a saját hangod", "ca": "Trobar la teva veu", "sl": "Najti svoj glas"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk utangaçlığını yeniyor ve kendini duyuruyor", "bg": "Детето преодолява срамежливостта и се налага да го чуят", "ro": "Copilul își depășește rușinea și se face auzit", "pl": "Dziecko przezwycięża nieśmiałość i daje się usłyszeć", "lt": "Vaikas įveikia drovumą ir būna išgirstas", "hu": "A gyerek legyőzi a szégyenlősséget és meghallja magát", "ca": "El nen supera la timidesa i es fa sentir", "sl": "Otrok premaga sramežljivost in se da slišati"}'::jsonb
WHERE blueprint_key = 'finding_your_voice';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Başkaları İçin Ayağa Kalkmak", "bg": "Да застанеш зад другите", "ro": "Să iei apărarea celorlalți", "pl": "Stawanie w obronie innych", "lt": "Užtarti kitiems", "hu": "Másokért kiállni", "ca": "Defensar els altres", "sl": "Zavzeti se za druge"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk haksızlığa tanık olur ve müdahale etme cesareti bulur", "bg": "Детето свидетелства несправедливост и намира смелостта да се намеси", "ro": "Copilul vede o nedreptate și găsește curajul să intervină", "pl": "Dziecko jest świadkiem niesprawiedliwości i znajduje odwagę, by zareagować", "lt": "Vaikas mato neteisybę ir randa drąsos įsikišti", "hu": "A gyerek igazságtalanságot lát és megvan a bátorsága beavatkozni", "ca": "El nen veu una injustícia i troba el coratge d''intervenir", "sl": "Otrok opazi krivico in najde pogum, da poseže"}'::jsonb
WHERE blueprint_key = 'standing_up_for_others';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Dışlanan", "bg": "Чуждестранният", "ro": "Străinul", "pl": "Osobny", "lt": "Pašalintasis", "hu": "A kívülálló", "ca": "L''foraster", "sl": "Tujec"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk farklıdır, uyum sağlamaya çalışır, sonunda farklılığı takdir görür", "bg": "Детето е различно, опитва се да се впише и в крайна сметка е ценено заради различността", "ro": "Copilul e diferit, încearcă să se integreze și e apreciat pentru diferență", "pl": "Dziecko jest inne, stara się dopasować i w końcu jest doceniane za inność", "lt": "Vaikas kitoks, bando prisitaikyti ir galiausiai vertinamas už savitumą", "hu": "A gyerek más, igyekszik beilleszkedni, végül értékelik a másságáért", "ca": "El nen és diferent, intenta encaixar i al final és valorat per ser-ho", "sl": "Otrok je drugačen, poskuša se vključiti in na koncu je cenjen zaradi drugačnosti"}'::jsonb
WHERE blueprint_key = 'the_outsider';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Büyük Yanlış Anlama", "bg": "Голямото недоразумение", "ro": "Marea neînțelegere", "pl": "Wielkie nieporozumienie", "lt": "Didelė nesusipratimas", "hu": "A nagy félreértés", "ca": "El gran malentes", "sl": "Velika nesporazum"}'::jsonb,
  descriptions = descriptions || '{"tr": "Arkadaşlık bir yanlış anlama yüzünden sınanır", "bg": "Приятелството е изпитано от недоразумение", "ro": "Prietenia pusă la încercare de o neînțelegere", "pl": "Przyjaźń wystawiona na próbę przez nieporozumienie", "lt": "Draugystė išmesta į išbandymą dėl nesusipratimo", "hu": "A barátság félreértés teszi próbára", "ca": "L''amistat posada a prova per un malentes", "sl": "Prijateljstvo na preizkušnji zaradi nesporazuma"}'::jsonb
WHERE blueprint_key = 'misunderstanding_resolved';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Beklenmedik Arkadaşlık", "bg": "Неочаквано приятелство", "ro": "Prietenie neașteptată", "pl": "Niespodziana przyjaźń", "lt": "Netikėta draugystė", "hu": "Váratlan barátság", "ca": "Amistat inesperada", "sl": "Nepričakovano prijateljstvo"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çok farklı iki çocuk şaşırtıcı bir bağ keşfeder", "bg": "Две много различни деца откриват изненадваща връзка", "ro": "Doi copii foarte diferiți descoperă o legătură surprinzătoare", "pl": "Dwoje bardzo różnych dzieci odkrywa zaskakującą więź", "lt": "Du labai skirtingi vaikai atranda stebinančią sąsają", "hu": "Két nagyon különböző gyerek meglepő kapcsolatot fedez fel", "ca": "Dos nens molt diferents descobreixen una connexió sorprenent", "sl": "Dva zelo različna otroka odkrijeta presenetljivo povezavo"}'::jsonb
WHERE blueprint_key = 'unexpected_friendship';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Bırakmak", "bg": "Да пуснеш", "ro": "A lăsa să fie", "pl": "Puszczenie", "lt": "Paleisti", "hu": "Elengedni", "ca": "Deixar anar", "sl": "Spustiti"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk bir şeyi veya birini bırakmak zorunda kalır ve yeni bir şey bulur", "bg": "Детето трябва да пусне нещо или някого и намира нещо ново", "ro": "Copilul trebuie să renunțe la ceva/cineva și găsește ceva nou", "pl": "Dziecko musi puścić coś lub kogoś i znajduje coś nowego", "lt": "Vaikas turi atleisti nuo ko nors ar ko nors ir randa ką nors naujo", "hu": "A gyerek el kell engedjen valamit vagy valakit, és talál valami újat", "ca": "El nen ha de deixar anar alguna cosa o algú i troba alguna cosa nova", "sl": "Otrok mor spustiti nekaj ali nekoga in najde nekaj novega"}'::jsonb
WHERE blueprint_key = 'letting_go';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "İlk Kez", "bg": "Първи път", "ro": "Prima dată", "pl": "Pierwszy raz", "lt": "Pirmas kartas", "hu": "Első alkalom", "ca": "La primera vegada", "sl": "Prvič"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk bir şeyi ilk kez yaşar — heyecan, korku ve zafer", "bg": "Детето преживява нещо за първи път — вълнение, страх и триумф", "ro": "Copilul trăiește ceva pentru prima dată — emoție, frică și triumf", "pl": "Dziecko po raz pierwszy czegoś doświadcza — emocje, strach i triumf", "lt": "Vaikas ką nors patiria pirmą kartą — susijaudinimas, baimė ir triumfas", "hu": "A gyerek először tapasztal meg valamit — izgalom, félelem és diadal", "ca": "El nen experimenta alguna cosa per primera vegada — emoció, por i triomf", "sl": "Otrok nekaj prvič doživi — navdušenje, strah in zmaga"}'::jsonb
WHERE blueprint_key = 'first_time';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Küçük Bir Şeyi Korumak", "bg": "Да защитиш нещо малко", "ro": "Să protejezi ceva mic", "pl": "Chronić coś małego", "lt": "Ginti ką nors mažą", "hu": "Valami kicsit megvédeni", "ca": "Protegir alguna cosa petita", "sl": "Zaščititi nekaj majhnega"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk kırılgan bir şey keşfeder ve onu korumak için risk alır", "bg": "Детето открива нещо уязвимо и поема рискове да го защити", "ro": "Copilul descoperă ceva vulnerabil și își asumă riscuri să-l protejeze", "pl": "Dziecko odkrywa coś wrażliwego i ryzykuje, by to chronić", "lt": "Vaikas atranda pažeidžiamą dalyką ir rizikuoja jį ginti", "hu": "A gyerek talál valami sérülékenyet és kockáztat a védelme érdekében", "ca": "El nen descobreix alguna cosa vulnerable i s''arrisca per protegir-la", "sl": "Otrok odkrije ranljivo in tvega, da ga zaščiti"}'::jsonb
WHERE blueprint_key = 'protecting_something_small';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Doğru Olanı Yapmak", "bg": "Да направиш правилното", "ro": "Să faci ce e bine", "pl": "Zrobić to, co słuszne", "lt": "Daryti teisingai", "hu": "A helyeset tenni", "ca": "Fer el correcte", "sl": "Storiti pravo stvar"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk ayartılmakla yüzleşir ve vicdanıyla boğuşur", "bg": "Детето се сблъсква с изкушение и се бори със съвестта си", "ro": "Copilul se confruntă cu ispita și se luptă cu conștiința", "pl": "Dziecko mierzy się z pokusą i zmaga się sumieniem", "lt": "Vaikas susiduria su pagunda ir kovoja su savo sąžine", "hu": "A gyerek kísértéssel szembesül és küzd a lelkiismeretével", "ca": "El nen s''enfronta a la temptació i lluita amb la consciència", "sl": "Otrok se sooči z izkušnjavo in se bori s vestjo"}'::jsonb
WHERE blueprint_key = 'doing_the_right_thing';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Onun Yerinde Olmak", "bg": "В техните обувки", "ro": "În locul lor", "pl": "W ich butach", "lt": "Jų vietoje", "hu": "A másik helyében", "ca": "Al seu lloc", "sl": "V njihovih čevljih"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk başka birinin bakış açısını anlamayı öğrenir", "bg": "Детето се научава да разбира гледната точка на друг човек", "ro": "Copilul învață să înțeleagă perspectiva altcuiva", "pl": "Dziecko uczy się rozumieć perspektywę drugiej osoby", "lt": "Vaikas mokosi suprasti kito žmogaus požiūrį", "hu": "A gyerek megtanulja megérteni más nézőpontját", "ca": "El nen aprèn a entendre la perspectiva d''una altra persona", "sl": "Otrok se nauči razumeti perspektivo druge osebe"}'::jsonb
WHERE blueprint_key = 'walking_in_their_shoes';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Görünmez Yardımcı", "bg": "Невидимият помощник", "ro": "Ajutorul invizibil", "pl": "Niewidzialny pomocnik", "lt": "Nematomas padėjėjas", "hu": "A láthatatlan segítő", "ca": "L''ajudant invisible", "sl": "Nevidni pomočnik"}'::jsonb,
  descriptions = descriptions || '{"tr": "Biri gizlice yardım eder — iyilik zincirleme tepkisi başlatır", "bg": "Някой помага тайно — предизвиквайки верижна реакция на доброта", "ro": "Cineva ajută în secret — declanșând o reacție în lanț de bunătate", "pl": "Ktoś pomaga w ukryciu — wywołując lawinę życzliwości", "lt": "Kažkas slapta padeda — sukeldamas geraširdiškumo grandininę reakciją", "hu": "Valaki titokban segít — jóság láncreakcióját kiváltva", "ca": "Algú ajuda en secret i desencadena una reacció en cadena de bondat", "sl": "Nekdo na skrivaj pomaga in sproži verižno reakcijo prijaznosti"}'::jsonb
WHERE blueprint_key = 'the_invisible_helper';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Bağışlamak", "bg": "Прощаване", "ro": "A ierta", "pl": "Wybaczenie", "lt": "Atleisti", "hu": "Megbocsátani", "ca": "Perdonar", "sl": "Odpustiti"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk incinir, öfke yaşar ve bağışlamanın (unutmadan) bir yolunu bulur", "bg": "Детето е наранено, изпитва гняв и намира начин да прости (без да забравя)", "ro": "Copilul e rănit, simte mânia și găsește calea de a ierta (nu de a uita)", "pl": "Dziecko jest zranione, odczuwa złość i znajduje sposób na wybaczenie (nie zapomnienie)", "lt": "Vaikas sužeidžiamas, jaučia pyktį ir randa kelią atleisti (ne pamiršti)", "hu": "A gyerek megsérül, dühöt érez és megtalálja a megbocsátás (nem elfelejtés) útját", "ca": "El nen és ferit, sent ràbia i troba una manera de perdonar (no oblidar)", "sl": "Otrok je ranjen, čuti jezo in najde način za odpuščanje (ne pozabiti)"}'::jsonb
WHERE blueprint_key = 'forgiving';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Kaos Zinciri", "bg": "Каскада от хаос", "ro": "Cascadă de haos", "pl": "Kaskada chaosu", "lt": "Chaoso kaskada", "hu": "A káosz lavina", "ca": "Cascada de caos", "sl": "Kaosna kaskada"}'::jsonb,
  descriptions = descriptions || '{"tr": "Küçük bir hata toplam kaosa dönüşür — özgürleştiren kahkaha", "bg": "Малка грешка се превръща в тотален хаос с освобождаващ смях", "ro": "O greșeală mică devine haos total cu râs eliberator", "pl": "Mały błąd zamienia się w totalny chaos i wyzwalający śmiech", "lt": "Maža klaida virsta visiška chaosu su atlaisvinančiu juoku", "hu": "Egy kis hiba lavinává válik — teljes káosz felszabadító nevetéssel", "ca": "Un petit error es converteix en caos total amb riure alliberador", "sl": "Majhna napaka se spremeni v popoln kaos s osvobajajočim smehom"}'::jsonb
WHERE blueprint_key = 'chaos_cascade';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Ters Tepen Plan", "bg": "Планът с обратен ефект", "ro": "Planul care dă greș", "pl": "Plan, który się odwraca", "lt": "Planas, kuris priešinasi", "hu": "A visszafelé sül el a terv", "ca": "El pla que surt malament", "sl": "Načrt, ki se obrne"}'::jsonb,
  descriptions = descriptions || '{"tr": "Dahice plan beklenmedik yan etkiler yaratır — düşünülenden farklı sonuçlanır", "bg": "Гениалният план има неочаквани странични ефекти — работи различно от планираното", "ro": "Planul genial are efecte secundare neașteptate — iese altfel decât plănuit", "pl": "Genialny plan ma nieoczekiwane skutki — wychodzi inaczej niż planowano", "lt": "Štukalingas planas turi netikėtų šalutinių poveikių — pasiteisina kitaip nei planuota", "hu": "A zseniális tervnek váratlan mellékhatásai vannak — másképp sül el a tervezettnél", "ca": "Un pla genial té efectes secundaris inesperats — resulta diferent del previst", "sl": "Genialen načrt ima nepričakovane stranske učinke — izide drugače kot načrtovano"}'::jsonb
WHERE blueprint_key = 'the_plan_that_backfires';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Rol Değişimi Komedisi", "bg": "Комедия на разменените роли", "ro": "Comedie cu roluri inversate", "pl": "Komedia zamiany ról", "lt": "Vaidmenų apkeitimo komedija", "hu": "Szerepcsere komédia", "ca": "Comèdia d''intercanvi de rols", "sl": "Komedija zamenjave vlog"}'::jsonb,
  descriptions = descriptions || '{"tr": "Roller değişir — komik durumlar karşılıklı anlayışa götürür", "bg": "Ролите се разменят — забавни ситуации водят до взаимно разбиране", "ro": "Rolurile se schimbă — situații amuzante duc la înțelegere reciprocă", "pl": "Role się zamieniają — zabawne sytuacje prowadzą do wzajemnego zrozumienia", "lt": "Vaidmenys keičiasi — juokingos situacijos veda prie tarpusavio supratimo", "hu": "A szerepek felcserélődnek — vicces helyzetek kölcsönös megértéshez vezetnek", "ca": "Els rols s''intercanvien — situacions còmiques porten a comprensió mútua", "sl": "Vloge se zamenjajo — smešne situacije vodijo do medsebojnega razumevanja"}'::jsonb
WHERE blueprint_key = 'role_reversal_comedy';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Gizli Bir Dünya Keşfetmek", "bg": "Да откриеш скрит свят", "ro": "Să descoperi o lume ascunsă", "pl": "Odkrywanie ukrytego świata", "lt": "Atrasti paslėptą pasaulį", "hu": "Rejtett világ felfedezése", "ca": "Descobrir un món amagat", "sl": "Odkriti skriti svet"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk gizli bir dünya keşfeder ve sırrı korur", "bg": "Детето открива скрит свят и пази тайната", "ro": "Copilul descoperă o lume ascunsă și păzește secretul", "pl": "Dziecko odkrywa ukryty świat i strzeże sekretu", "lt": "Vaikas atranda paslėptą pasaulį ir saugo paslaptį", "hu": "A gyerek felfedez egy rejtett világot és őrzi a titkot", "ca": "El nen descobreix un món amagat i guarda el secret", "sl": "Otrok odkrije skriti svet in varuje skrivnost"}'::jsonb
WHERE blueprint_key = 'discovering_a_hidden_world';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "İmkansızı Mümkün Kılmak", "bg": "Невъзможното става възможно", "ro": "Imposibilul făcut posibil", "pl": "Niemożliwe staje się możliwe", "lt": "Neįmanoma tampa įmanoma", "hu": "A lehetetlen lehetővé válik", "ca": "Fer possible l''impossible", "sl": "Nemožno postane mogoče"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk ''imkansız''ın sadece ''henüz denenmemiş'' demek olduğunu keşfeder", "bg": "Детето открива, че ''невъзможно'' означава само ''още не е опитано''", "ro": "Copilul descoperă că ''imposibil'' înseamnă doar ''încă neîncercat''", "pl": "Dziecko odkrywa, że „niemożliwe” to tylko „jeszcze nie wypróbowane”", "lt": "Vaikas atranda, kad „neįmanoma“ reiškia tik „dar nebandyta“", "hu": "A gyerek rájön, hogy a „lehetetlen” csak „még nem kipróbált”-at jelent", "ca": "El nen descobreix que ''impossible'' només vol dir ''encara no provat''", "sl": "Otrok odkrije, da ''nemogoče'' pomeni le ''še ne poskušano''"}'::jsonb
WHERE blueprint_key = 'the_impossible_made_possible';

UPDATE emotion_blueprints SET
  labels = labels || '{"tr": "Doğa Konuşuyor", "bg": "Природата говори", "ro": "Natura vorbește", "pl": "Natura przemawia", "lt": "Gamta kalba", "hu": "A természet szól", "ca": "La natura parla", "sl": "Narava govori"}'::jsonb,
  descriptions = descriptions || '{"tr": "Çocuk doğaya gider, şaşırtıcı bir şey gözlemler ve dünyayı farklı görür", "bg": "Детето отива в природата, наблюдава нещо невероятно и вижда света по-различно", "ro": "Copilul merge în natură, observă ceva uimitor și vede lumea altfel", "pl": "Dziecko idzie w przyrodę, obserwuje coś niezwykłego i widzi świat inaczej", "lt": "Vaikas eina į gamtą, stebi ką nors nuostabaus ir mato pasaulį kitaip", "hu": "A gyerek kimegy a természetbe, megfigyel valami csodálatosat és másképp látja a világot", "ca": "El nen va a la natura, observa alguna cosa sorprenent i veu el món d''una altra manera", "sl": "Otrok gre v naravo, opazuje nekaj neverjetnega in vidi svet drugače"}'::jsonb
WHERE blueprint_key = 'nature_speaks';
