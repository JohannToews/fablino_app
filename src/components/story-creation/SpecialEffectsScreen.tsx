import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { SpecialAttribute, StoryLength, StoryDifficulty, LANGUAGE_FLAGS, LANGUAGE_LABELS } from "./types";
import { cn } from "@/lib/utils";
import { useKidProfile } from "@/hooks/useKidProfile";
import { FEATURES } from "@/config/features";
import { useStoryLengthOptions } from "@/hooks/useStoryLengthOptions";
import FablinoPageHeader from "@/components/FablinoPageHeader";
import VoiceRecordButton from "./VoiceRecordButton";

interface SpecialEffectsTranslations {
  header: string;
  effectsHeader: string;
  effectsHint: string;
  superpowers: string;
  magic: string;
  heroesVillains: string;
  transformations: string;
  talents: string;
  normal: string;
  descriptionHeader: string;
  descriptionPlaceholder: string;
  continue: string;
  continueEpisode1: string;
  seriesHint: string;
  back: string;
  specialEffectsToggle: string;
  noEffects: string;
}

const translations: Record<string, SpecialEffectsTranslations> = {
  de: {
    header: "Spezialeffekte & Details",
    effectsHeader: "Besondere Eigenschaften?",
    effectsHint: "Wähle beliebig viele aus",
    superpowers: "Superkräfte",
    magic: "Magische Kräfte",
    heroesVillains: "Helden & Bösewichte",
    transformations: "Verwandlungen",
    talents: "Besondere Talente",
    normal: "Nein, ganz normal",
    descriptionHeader: "Optional: Wünsche zur Geschichte?",
    descriptionPlaceholder: "z.B. \"Eine Geschichte über Piraten auf dem Mond\"",
    continue: "Geschichte erstellen",
    continueEpisode1: "Episode 1 erstellen",
    seriesHint: "Du startest eine Serie mit 5 Episoden.",
    back: "Zurück",
    specialEffectsToggle: "Spezialeffekte",
    noEffects: "Keine Spezialeffekte",
  },
  fr: {
    header: "Effets spéciaux & Détails",
    effectsHeader: "Capacités spéciales ?",
    effectsHint: "Choisis autant que tu veux",
    superpowers: "Super-pouvoirs",
    magic: "Pouvoirs magiques",
    heroesVillains: "Héros & Méchants",
    transformations: "Transformations",
    talents: "Talents spéciaux",
    normal: "Non, tout à fait normal",
    descriptionHeader: "Optionnel : Tu veux ajouter quelque chose ?",
    descriptionPlaceholder: "p.ex. \"Une histoire de pirates sur la lune\"",
    continue: "Créer l'histoire",
    continueEpisode1: "Créer l'épisode 1",
    seriesHint: "Tu commences une série de 5 épisodes.",
    back: "Retour",
    specialEffectsToggle: "Effets spéciaux",
    noEffects: "Pas d'effets spéciaux",
  },
  en: {
    header: "Special Effects & Details",
    effectsHeader: "Special abilities?",
    effectsHint: "Choose as many as you like",
    superpowers: "Superpowers",
    magic: "Magical powers",
    heroesVillains: "Heroes & Villains",
    transformations: "Transformations",
    talents: "Special talents",
    normal: "No, completely normal",
    descriptionHeader: "Optional: Any wishes for the story?",
    descriptionPlaceholder: "e.g. \"A story about pirates on the moon\"",
    continue: "Create story",
    continueEpisode1: "Create Episode 1",
    seriesHint: "You're starting a series with 5 episodes.",
    back: "Back",
    specialEffectsToggle: "Special effects",
    noEffects: "No special effects",
  },
  es: {
    header: "Efectos especiales y detalles",
    effectsHeader: "¿Habilidades especiales?",
    effectsHint: "Elige tantos como quieras",
    superpowers: "Superpoderes",
    magic: "Poderes mágicos",
    heroesVillains: "Héroes y villanos",
    transformations: "Transformaciones",
    talents: "Talentos especiales",
    normal: "No, completamente normal",
    descriptionHeader: "Opcional: ¿Deseos para la historia?",
    descriptionPlaceholder: "p.ej. \"Una historia de piratas en la luna\"",
    continue: "Crear historia",
    continueEpisode1: "Crear episodio 1",
    seriesHint: "Comienzas una serie de 5 episodios.",
    back: "Atrás",
    specialEffectsToggle: "Efectos especiales",
    noEffects: "Sin efectos especiales",
  },
  nl: {
    header: "Speciale effecten & Details",
    effectsHeader: "Speciale eigenschappen?",
    effectsHint: "Kies er zoveel als je wilt",
    superpowers: "Superkrachten",
    magic: "Magische krachten",
    heroesVillains: "Helden & Schurken",
    transformations: "Transformaties",
    talents: "Speciale talenten",
    normal: "Nee, helemaal normaal",
    descriptionHeader: "Optioneel: Wensen voor het verhaal?",
    descriptionPlaceholder: "bijv. \"Een verhaal over piraten op de maan\"",
    continue: "Verhaal maken",
    continueEpisode1: "Maak aflevering 1",
    seriesHint: "Je start een serie van 5 afleveringen.",
    back: "Terug",
    specialEffectsToggle: "Speciale effecten",
    noEffects: "Geen speciale effecten",
  },
  it: {
    header: "Effetti speciali e dettagli",
    effectsHeader: "Abilità speciali?",
    effectsHint: "Scegli quanti ne vuoi",
    superpowers: "Superpoteri",
    magic: "Poteri magici",
    heroesVillains: "Eroi e cattivi",
    transformations: "Trasformazioni",
    talents: "Talenti speciali",
    normal: "No, del tutto normale",
    descriptionHeader: "Opzionale: Desideri per la storia?",
    descriptionPlaceholder: "es. \"Una storia di pirati sulla luna\"",
    continue: "Crea storia",
    continueEpisode1: "Crea episodio 1",
    seriesHint: "Inizi una serie di 5 episodi.",
    back: "Indietro",
    specialEffectsToggle: "Effetti speciali",
    noEffects: "Nessun effetto speciale",
  },
  bs: {
    header: "Specijalni efekti i detalji",
    effectsHeader: "Posebne sposobnosti?",
    effectsHint: "Odaberi koliko želiš",
    superpowers: "Supermoći",
    magic: "Magične moći",
    heroesVillains: "Heroji i zlikovci",
    transformations: "Transformacije",
    talents: "Posebni talenti",
    normal: "Ne, sasvim normalno",
    descriptionHeader: "Opcionalno: Želje za priču?",
    descriptionPlaceholder: "npr. \"Priča o piratima na mjesecu\"",
    continue: "Kreiraj priču",
    continueEpisode1: "Kreiraj epizodu 1",
    seriesHint: "Pokrećeš seriju od 5 epizoda.",
    back: "Nazad",
    specialEffectsToggle: "Specijalni efekti",
    noEffects: "Bez specijalnih efekata",
  },
  tr: {
    header: "Özel Efektler ve Detaylar",
    effectsHeader: "Özel yetenekler?",
    effectsHint: "İstediğin kadar seç",
    superpowers: "Süper güçler",
    magic: "Sihirli güçler",
    heroesVillains: "Kahramanlar ve kötüler",
    transformations: "Dönüşümler",
    talents: "Özel yetenekler",
    normal: "Hayır, tamamen normal",
    descriptionHeader: "İsteğe bağlı: Hikaye için dilekler?",
    descriptionPlaceholder: "örn. \"Ayda korsanlar hakkında bir hikaye\"",
    continue: "Hikaye oluştur",
    continueEpisode1: "Bölüm 1 oluştur",
    seriesHint: "5 bölümlük bir seri başlatıyorsun.",
    back: "Geri",
    specialEffectsToggle: "Özel efektler",
    noEffects: "Özel efekt yok",
  },
  bg: {
    header: "Специални ефекти и детайли",
    effectsHeader: "Специални способности?",
    effectsHint: "Избери колкото искаш",
    superpowers: "Суперсили",
    magic: "Магически сили",
    heroesVillains: "Герои и злодеи",
    transformations: "Превръщания",
    talents: "Специални таланти",
    normal: "Не, съвсем нормално",
    descriptionHeader: "По избор: Желания за историята?",
    descriptionPlaceholder: "напр. \"История за пирати на Луната\"",
    continue: "Създай история",
    continueEpisode1: "Създай епизод 1",
    seriesHint: "Започваш серия от 5 епизода.",
    back: "Назад",
    specialEffectsToggle: "Специални ефекти",
    noEffects: "Без специални ефекти",
  },
  ro: {
    header: "Efecte speciale și detalii",
    effectsHeader: "Abilități speciale?",
    effectsHint: "Alege câte vrei",
    superpowers: "Superputeri",
    magic: "Puteri magice",
    heroesVillains: "Eroi și răufăcători",
    transformations: "Transformări",
    talents: "Talente speciale",
    normal: "Nu, complet normal",
    descriptionHeader: "Opțional: Dorințe pentru poveste?",
    descriptionPlaceholder: "ex. \"O poveste despre pirați pe Lună\"",
    continue: "Creează povestea",
    continueEpisode1: "Creează episodul 1",
    seriesHint: "Începi o serie de 5 episoade.",
    back: "Înapoi",
    specialEffectsToggle: "Efecte speciale",
    noEffects: "Fără efecte speciale",
  },
  pl: {
    header: "Efekty specjalne i detale",
    effectsHeader: "Specjalne zdolności?",
    effectsHint: "Wybierz ile chcesz",
    superpowers: "Supermoce",
    magic: "Magiczne moce",
    heroesVillains: "Bohaterowie i złoczyńcy",
    transformations: "Przemiany",
    talents: "Specjalne talenty",
    normal: "Nie, zupełnie normalnie",
    descriptionHeader: "Opcjonalnie: Życzenia do historii?",
    descriptionPlaceholder: "np. \"Historia o piratach na Księżycu\"",
    continue: "Utwórz historię",
    continueEpisode1: "Utwórz odcinek 1",
    seriesHint: "Zaczynasz serię 5 odcinków.",
    back: "Wstecz",
    specialEffectsToggle: "Efekty specjalne",
    noEffects: "Bez efektów specjalnych",
  },
  lt: {
    header: "Specialieji efektai ir detalės",
    effectsHeader: "Ypatingi gebėjimai?",
    effectsHint: "Pasirink kiek nori",
    superpowers: "Supergalios",
    magic: "Magiškos galios",
    heroesVillains: "Herojai ir piktadariai",
    transformations: "Pasivertimai",
    talents: "Ypatingi talentai",
    normal: "Ne, visiškai normaliai",
    descriptionHeader: "Neprivaloma: Pageidavimai istorijai?",
    descriptionPlaceholder: "pvz. \"Istorija apie piratus Mėnulyje\"",
    continue: "Sukurti istoriją",
    continueEpisode1: "Sukurti 1 epizodą",
    seriesHint: "Pradedi 5 epizodų seriją.",
    back: "Atgal",
    specialEffectsToggle: "Specialieji efektai",
    noEffects: "Be specialiųjų efektų",
  },
  hu: {
    header: "Speciális effektusok és részletek",
    effectsHeader: "Különleges képességek?",
    effectsHint: "Válassz amennyit szeretnél",
    superpowers: "Szupererők",
    magic: "Varázserők",
    heroesVillains: "Hősök és gonoszok",
    transformations: "Átváltozások",
    talents: "Különleges tehetségek",
    normal: "Nem, teljesen normál",
    descriptionHeader: "Opcionális: Kívánságok a történethez?",
    descriptionPlaceholder: "pl. \"Történet kalózokról a Holdon\"",
    continue: "Történet létrehozása",
    continueEpisode1: "1. epizód létrehozása",
    seriesHint: "Egy 5 epizódos sorozatot indítasz.",
    back: "Vissza",
    specialEffectsToggle: "Speciális effektusok",
    noEffects: "Nincs speciális effektus",
  },
  ca: {
    header: "Efectes especials i detalls",
    effectsHeader: "Habilitats especials?",
    effectsHint: "Tria tants com vulguis",
    superpowers: "Superpoders",
    magic: "Poders màgics",
    heroesVillains: "Herois i malvats",
    transformations: "Transformacions",
    talents: "Talents especials",
    normal: "No, del tot normal",
    descriptionHeader: "Opcional: Desitjos per a la història?",
    descriptionPlaceholder: "p.ex. \"Una història de pirates a la Lluna\"",
    continue: "Crea la història",
    continueEpisode1: "Crea l'episodi 1",
    seriesHint: "Comences una sèrie de 5 episodis.",
    back: "Enrere",
    specialEffectsToggle: "Efectes especials",
    noEffects: "Sense efectes especials",
  },
  sl: {
    header: "Posebni učinki in podrobnosti",
    effectsHeader: "Posebne sposobnosti?",
    effectsHint: "Izberi kolikor želiš",
    superpowers: "Supermoči",
    magic: "Čarobne moči",
    heroesVillains: "Junaki in zlikovci",
    transformations: "Preobrazbe",
    talents: "Posebni talenti",
    normal: "Ne, povsem normalno",
    descriptionHeader: "Neobvezno: Želje za zgodbo?",
    descriptionPlaceholder: "npr. \"Zgodba o piratih na Luni\"",
    continue: "Ustvari zgodbo",
    continueEpisode1: "Ustvari epizodo 1",
    seriesHint: "Začenjaš serijo s 5 epizodami.",
    back: "Nazaj",
    specialEffectsToggle: "Posebni učinki",
    noEffects: "Brez posebnih učinkov",
  },
  uk: {
    header: "Спецефекти та деталі",
    effectsHeader: "Особливі здібності?",
    effectsHint: "Обери скільки хочеш",
    superpowers: "Суперсили",
    magic: "Чарівні сили",
    heroesVillains: "Герої та лиходії",
    transformations: "Перетворення",
    talents: "Особливі таланти",
    normal: "Ні, зовсім нормально",
    descriptionHeader: "За бажанням: Побажання до історії?",
    descriptionPlaceholder: "напр. «Історія про піратів на Місяці»",
    continue: "Створити історію",
    continueEpisode1: "Створити епізод 1",
    seriesHint: "Ти починаєш серію з 5 епізодів.",
    back: "Назад",
    specialEffectsToggle: "Спецефекти",
    noEffects: "Без спецефектів",
  },
  ru: {
    header: "Спецэффекты и детали",
    effectsHeader: "Особые способности?",
    effectsHint: "Выбери сколько хочешь",
    superpowers: "Суперсилы",
    magic: "Волшебные силы",
    heroesVillains: "Герои и злодеи",
    transformations: "Превращения",
    talents: "Особые таланты",
    normal: "Нет, совсем обычный",
    descriptionHeader: "По желанию: Пожелания к истории?",
    descriptionPlaceholder: "напр. «История про пиратов на Луне»",
    continue: "Создать историю",
    continueEpisode1: "Создать эпизод 1",
    seriesHint: "Ты начинаешь серию из 5 эпизодов.",
    back: "Назад",
    specialEffectsToggle: "Спецэффекты",
    noEffects: "Без спецэффектов",
  },
};

interface AttributeOption {
  id: SpecialAttribute;
  emoji: string;
  labelKey: keyof SpecialEffectsTranslations;
}

const attributeOptions: AttributeOption[] = [
  { id: "superpowers", emoji: "🦸", labelKey: "superpowers" },
  { id: "magic", emoji: "✨", labelKey: "magic" },
  { id: "heroes_villains", emoji: "🎭", labelKey: "heroesVillains" },
  { id: "transformations", emoji: "🔮", labelKey: "transformations" },
  { id: "talents", emoji: "🎯", labelKey: "talents" },
  { id: "normal", emoji: "❌", labelKey: "normal" },
];

const settingsTranslations: Record<string, Record<string, string>> = {
  de: { lengthLabel: 'Länge', short: 'Kurz', medium: 'Mittel', long: 'Lang', extra_long: 'Extra-Lang', difficultyLabel: 'Schwierigkeit', easy: 'Leicht', hard: 'Schwer', seriesLabel: 'Kapitel-Abenteuer', seriesNo: 'Nein', seriesYes: 'Ja', languageLabel: 'Sprache', seriesModeNormal: 'Normales Kapitel-Abenteuer', seriesModeNormalDesc: 'Die Geschichte fließt von Episode zu Episode', seriesModeInteractive: 'Du entscheidest!', seriesModeInteractiveDesc: 'Dein Kind entscheidet am Ende jeder Episode wie es weitergeht' },
  fr: { lengthLabel: 'Longueur', short: 'Court', medium: 'Moyen', long: 'Long', extra_long: 'Très long', difficultyLabel: 'Difficulté', easy: 'Facile', hard: 'Difficile', seriesLabel: 'Aventure à chapitres', seriesNo: 'Non', seriesYes: 'Oui', languageLabel: 'Langue', seriesModeNormal: 'Aventure à chapitres normale', seriesModeNormalDesc: "L'histoire suit son cours d'épisode en épisode", seriesModeInteractive: "C'est toi qui décides !", seriesModeInteractiveDesc: "Ton enfant décide comment l'histoire continue" },
  en: { lengthLabel: 'Length', short: 'Short', medium: 'Medium', long: 'Long', extra_long: 'Extra Long', difficultyLabel: 'Difficulty', easy: 'Easy', hard: 'Hard', seriesLabel: 'Chapter Adventure', seriesNo: 'No', seriesYes: 'Yes', languageLabel: 'Language', seriesModeNormal: 'Normal Chapter Adventure', seriesModeNormalDesc: 'The story flows from episode to episode', seriesModeInteractive: 'You decide!', seriesModeInteractiveDesc: 'Your child decides how the story continues' },
  es: { lengthLabel: 'Longitud', short: 'Corto', medium: 'Medio', long: 'Largo', extra_long: 'Extra largo', difficultyLabel: 'Dificultad', easy: 'Fácil', hard: 'Difícil', seriesLabel: 'Aventura por capítulos', seriesNo: 'No', seriesYes: 'Sí', languageLabel: 'Idioma', seriesModeNormal: 'Aventura por capítulos normal', seriesModeNormalDesc: 'La historia fluye de episodio en episodio', seriesModeInteractive: '¡Tú decides!', seriesModeInteractiveDesc: 'Tu hijo decide cómo continúa la historia' },
  nl: { lengthLabel: 'Lengte', short: 'Kort', medium: 'Gemiddeld', long: 'Lang', extra_long: 'Extra lang', difficultyLabel: 'Moeilijkheid', easy: 'Makkelijk', hard: 'Moeilijk', seriesLabel: 'Hoofdstuk-avontuur', seriesNo: 'Nee', seriesYes: 'Ja', languageLabel: 'Taal', seriesModeNormal: 'Normaal hoofdstuk-avontuur', seriesModeNormalDesc: 'Het verhaal vloeit van aflevering naar aflevering', seriesModeInteractive: 'Jij beslist!', seriesModeInteractiveDesc: 'Je kind beslist hoe het verder gaat' },
  it: { lengthLabel: 'Lunghezza', short: 'Breve', medium: 'Medio', long: 'Lungo', extra_long: 'Extra lungo', difficultyLabel: 'Difficoltà', easy: 'Facile', hard: 'Difficile', seriesLabel: 'Avventura a capitoli', seriesNo: 'No', seriesYes: 'Sì', languageLabel: 'Lingua', seriesModeNormal: 'Avventura a capitoli normale', seriesModeNormalDesc: 'La storia scorre da episodio a episodio', seriesModeInteractive: 'Decidi tu!', seriesModeInteractiveDesc: 'Il tuo bambino decide come continua la storia' },
  bs: { lengthLabel: 'Dužina', short: 'Kratko', medium: 'Srednje', long: 'Dugo', extra_long: 'Ekstra dugo', difficultyLabel: 'Težina', easy: 'Lagano', hard: 'Teško', seriesLabel: 'Avantura s poglavljima', seriesNo: 'Ne', seriesYes: 'Da', languageLabel: 'Jezik', seriesModeNormal: 'Normalna avantura s poglavljima', seriesModeNormalDesc: 'Priča teče od epizode do epizode', seriesModeInteractive: 'Ti odlučuješ!', seriesModeInteractiveDesc: 'Tvoje dijete odlučuje kako priča nastavlja' },
  tr: { lengthLabel: 'Uzunluk', short: 'Kısa', medium: 'Orta', long: 'Uzun', extra_long: 'Çok uzun', difficultyLabel: 'Zorluk', easy: 'Kolay', hard: 'Zor', seriesLabel: 'Bölüm Macerası', seriesNo: 'Hayır', seriesYes: 'Evet', languageLabel: 'Dil', seriesModeNormal: 'Normal bölüm macerası', seriesModeNormalDesc: 'Hikaye bölümden bölüme akar', seriesModeInteractive: 'Sen karar ver!', seriesModeInteractiveDesc: 'Çocuğunuz hikayenin nasıl devam edeceğine karar verir' },
  bg: { lengthLabel: 'Дължина', short: 'Кратко', medium: 'Средно', long: 'Дълго', extra_long: 'Много дълго', difficultyLabel: 'Трудност', easy: 'Лесно', hard: 'Трудно', seriesLabel: 'Приключение с глави', seriesNo: 'Не', seriesYes: 'Да', languageLabel: 'Език', seriesModeNormal: 'Нормално приключение с глави', seriesModeNormalDesc: 'Историята тече от епизод на епизод', seriesModeInteractive: 'Ти решаваш!', seriesModeInteractiveDesc: 'Детето решава как продължава историята' },
  ro: { lengthLabel: 'Lungime', short: 'Scurt', medium: 'Mediu', long: 'Lung', extra_long: 'Extra lung', difficultyLabel: 'Dificultate', easy: 'Ușor', hard: 'Dificil', seriesLabel: 'Aventură pe capitole', seriesNo: 'Nu', seriesYes: 'Da', languageLabel: 'Limbă', seriesModeNormal: 'Aventură pe capitole normală', seriesModeNormalDesc: 'Povestea curge din episod în episod', seriesModeInteractive: 'Tu decizi!', seriesModeInteractiveDesc: 'Copilul decide cum continuă povestea' },
  pl: { lengthLabel: 'Długość', short: 'Krótka', medium: 'Średnia', long: 'Długa', extra_long: 'Bardzo długa', difficultyLabel: 'Trudność', easy: 'Łatwy', hard: 'Trudny', seriesLabel: 'Przygoda z rozdziałami', seriesNo: 'Nie', seriesYes: 'Tak', languageLabel: 'Język', seriesModeNormal: 'Normalna przygoda z rozdziałami', seriesModeNormalDesc: 'Historia płynie od odcinka do odcinka', seriesModeInteractive: 'Ty decydujesz!', seriesModeInteractiveDesc: 'Dziecko decyduje jak historia się potoczy' },
  lt: { lengthLabel: 'Ilgis', short: 'Trumpa', medium: 'Vidutinė', long: 'Ilga', extra_long: 'Labai ilga', difficultyLabel: 'Sunkumas', easy: 'Lengvas', hard: 'Sunkus', seriesLabel: 'Nuotykis su skyriais', seriesNo: 'Ne', seriesYes: 'Taip', languageLabel: 'Kalba', seriesModeNormal: 'Normalus nuotykis su skyriais', seriesModeNormalDesc: 'Istorija teka nuo epizodo prie epizodo', seriesModeInteractive: 'Tu sprendi!', seriesModeInteractiveDesc: 'Vaikas sprendžia kaip istorija tęsis' },
  hu: { lengthLabel: 'Hossz', short: 'Rövid', medium: 'Közepes', long: 'Hosszú', extra_long: 'Extra hosszú', difficultyLabel: 'Nehézség', easy: 'Könnyű', hard: 'Nehéz', seriesLabel: 'Fejezet-kaland', seriesNo: 'Nem', seriesYes: 'Igen', languageLabel: 'Nyelv', seriesModeNormal: 'Normál fejezet-kaland', seriesModeNormalDesc: 'A történet epizódról epizódra halad', seriesModeInteractive: 'Te döntesz!', seriesModeInteractiveDesc: 'A gyermeked eldönti hogyan folytatódik a történet' },
  ca: { lengthLabel: 'Llargada', short: 'Curta', medium: 'Mitjana', long: 'Llarga', extra_long: 'Extra llarga', difficultyLabel: 'Dificultat', easy: 'Fàcil', hard: 'Difícil', seriesLabel: 'Aventura per capítols', seriesNo: 'No', seriesYes: 'Sí', languageLabel: 'Idioma', seriesModeNormal: 'Aventura per capítols normal', seriesModeNormalDesc: "La història flueix d'episodi en episodi", seriesModeInteractive: 'Tu decideixes!', seriesModeInteractiveDesc: 'El teu fill decideix com continua la història' },
  sl: { lengthLabel: 'Dolžina', short: 'Kratka', medium: 'Srednja', long: 'Dolga', extra_long: 'Zelo dolga', difficultyLabel: 'Težavnost', easy: 'Enostavno', hard: 'Težko', seriesLabel: 'Pustolovščina po poglavjih', seriesNo: 'Ne', seriesYes: 'Da', languageLabel: 'Jezik', seriesModeNormal: 'Normalna pustolovščina po poglavjih', seriesModeNormalDesc: 'Zgodba teče od epizode do epizode', seriesModeInteractive: 'Ti odločaš!', seriesModeInteractiveDesc: 'Otrok odloči kako se zgodba nadaljuje' },
  uk: { lengthLabel: 'Довжина', short: 'Коротка', medium: 'Середня', long: 'Довга', extra_long: 'Дуже довга', difficultyLabel: 'Складність', easy: 'Легко', hard: 'Важко', seriesLabel: 'Пригода з розділами', seriesNo: 'Ні', seriesYes: 'Так', languageLabel: 'Мова', seriesModeNormal: 'Звичайна пригода з розділами', seriesModeNormalDesc: 'Історія йде від епізоду до епізоду', seriesModeInteractive: 'Ти вирішуєш!', seriesModeInteractiveDesc: 'Дитина вирішує, як продовжиться історія' },
  ru: { lengthLabel: 'Длина', short: 'Короткая', medium: 'Средняя', long: 'Длинная', extra_long: 'Очень длинная', difficultyLabel: 'Сложность', easy: 'Легко', hard: 'Сложно', seriesLabel: 'Приключение по главам', seriesNo: 'Нет', seriesYes: 'Да', languageLabel: 'Язык', seriesModeNormal: 'Обычное приключение по главам', seriesModeNormalDesc: 'История течёт от эпизода к эпизоду', seriesModeInteractive: 'Ты решаешь!', seriesModeInteractiveDesc: 'Ребёнок решает, как продолжится история' },
};

export interface StorySettingsFromEffects {
  length: StoryLength;
  difficulty: StoryDifficulty;
  isSeries: boolean;
  seriesMode?: 'normal' | 'interactive';
  storyLanguage: string;
}

interface SpecialEffectsScreenProps {
  onComplete: (attributes: SpecialAttribute[], additionalDescription: string, settings?: StorySettingsFromEffects) => void;
  onBack: () => void;
  showSettings?: boolean;
  isAdmin?: boolean;
  availableLanguages?: string[];
  defaultLanguage?: string;
  fablinoMessage?: string;
}

const LENGTH_EMOJIS: Record<string, string> = {
  short: "📖",
  medium: "📚",
  long: "📚📚",
  extra_long: "📚📚📚",
};

const SpecialEffectsScreen = ({
  onComplete,
  onBack,
  showSettings = false,
  isAdmin = false,
  availableLanguages = [],
  defaultLanguage = 'fr',
  fablinoMessage,
}: SpecialEffectsScreenProps) => {
  const { kidAppLanguage, kidReadingLanguage, selectedProfile } = useKidProfile();
  const [storyLanguage, setStoryLanguage] = useState<string>(defaultLanguage);

  const { options: lengthOptions, defaultLength, loading: lengthLoading } = useStoryLengthOptions(selectedProfile?.age);

  const [selectedAttributes, setSelectedAttributes] = useState<SpecialAttribute[]>([]);
  const [additionalDescription, setAdditionalDescription] = useState("");
  const [effectsExpanded, setEffectsExpanded] = useState(false);
  const [langDropdownOpen, setLangDropdownOpen] = useState(false);

  const [storyLength, setStoryLength] = useState<StoryLength>("medium");
  const [storyDifficulty, setStoryDifficulty] = useState<StoryDifficulty>("medium");

  const [defaultApplied, setDefaultApplied] = useState(false);
  if (!defaultApplied && !lengthLoading && defaultLength) {
    setStoryLength(defaultLength as StoryLength);
    setDefaultApplied(true);
  }
  const [isSeries, setIsSeries] = useState(false);
  const [seriesMode, setSeriesMode] = useState<'normal' | 'interactive'>('normal');

  // Prefer kid's profile language (uk/ru) so we never show German when school language is Russian/Ukrainian; else use story dropdown language
  const uiLang =
    kidAppLanguage === 'uk' || kidAppLanguage === 'ru'
      ? kidAppLanguage
      : storyLanguage && translations[storyLanguage] && settingsTranslations[storyLanguage]
        ? storyLanguage
        : kidAppLanguage;
  const t = translations[uiLang] || translations.de;
  const st = settingsTranslations[uiLang] || settingsTranslations.de;

  // Compatibility matrix: which options can coexist
  const compatibilityMap: Record<string, SpecialAttribute[]> = {
    superpowers: ["heroes_villains", "talents"],
    magic: ["transformations", "heroes_villains"],
    transformations: ["magic", "heroes_villains"],
    heroes_villains: ["superpowers", "magic", "transformations", "talents"], // compatible with any ONE other
    talents: ["heroes_villains"],
    normal: [], // exclusive
  };

  const getIncompatibleReason = (attr: SpecialAttribute): string | null => {
    if (selectedAttributes.length === 0) return null;
    if (selectedAttributes.includes(attr)) return null; // already selected, can deselect

    // If "normal" is selected, everything else is incompatible
    if (selectedAttributes.includes("normal")) {
      const normalLabel = t.normal;
      return `${incompatiblePrefix} ${normalLabel}`;
    }

    // If trying to select "normal" while others are selected
    if (attr === "normal" && selectedAttributes.length > 0) {
      return `${incompatiblePrefix} ${selectedAttributes.map(a => {
        const opt = attributeOptions.find(o => o.id === a);
        return opt ? t[opt.labelKey] : a;
      }).join(", ")}`;
    }

    // Max 2 selections
    if (selectedAttributes.length >= 2) {
      return incompatiblePrefix + " (max 2)";
    }

    // Check compatibility with each selected attribute
    for (const selected of selectedAttributes) {
      const compatList = compatibilityMap[selected] || [];
      if (!compatList.includes(attr)) {
        const opt = attributeOptions.find(o => o.id === selected);
        const selectedLabel = opt ? t[opt.labelKey] : selected;
        return `${incompatiblePrefix} ${selectedLabel}`;
      }
      // heroes_villains can only combine with ONE other
      if (attr === "heroes_villains" || selected === "heroes_villains") {
        // already checked above via max 2
      }
    }

    // Check reverse: is the attr compatible with all selected?
    const attrCompatList = compatibilityMap[attr] || [];
    for (const selected of selectedAttributes) {
      if (!attrCompatList.includes(selected)) {
        const opt = attributeOptions.find(o => o.id === selected);
        const selectedLabel = opt ? t[opt.labelKey] : selected;
        return `${incompatiblePrefix} ${selectedLabel}`;
      }
    }

    return null;
  };

  // Localized "Doesn't go with" prefix
  const incompatiblePrefixes: Record<string, string> = {
    de: "Passt nicht zu",
    en: "Incompatible with",
    fr: "Incompatible avec",
    es: "Incompatible con",
    nl: "Past niet bij",
    it: "Incompatibile con",
    bs: "Ne ide uz",
    tr: "Uyumsuz:",
    bg: "Несъвместимо с",
    ro: "Incompatibil cu",
    pl: "Nie pasuje do",
    lt: "Nesuderinama su",
    hu: "Nem illik:",
    ca: "Incompatible amb",
    sl: "Ni združljivo z",
    uk: "Не поєднується з",
    ru: "Не сочетается с",
    pt: "Incompatível com",
    sk: "Nekompatibilné s",
  };
  const incompatiblePrefix = incompatiblePrefixes[uiLang] || incompatiblePrefixes.de;

  const toggleAttribute = (attr: SpecialAttribute) => {
    // Allow deselection always
    if (selectedAttributes.includes(attr)) {
      setSelectedAttributes((prev) => prev.filter((a) => a !== attr));
      return;
    }

    // Block if incompatible
    if (getIncompatibleReason(attr) !== null) return;

    if (attr === "normal") {
      setSelectedAttributes(["normal"]);
    } else {
      setSelectedAttributes((prev) => {
        const filtered = prev.filter((a) => a !== "normal");
        return [...filtered, attr];
      });
    }
  };

  const handleContinue = () => {
    onComplete(selectedAttributes, additionalDescription.trim(), {
      length: storyLength,
      difficulty: storyDifficulty,
      isSeries,
      seriesMode: isSeries ? seriesMode : undefined,
      storyLanguage,
    });
  };

  const selectedEffectLabels = selectedAttributes
    .filter(a => a !== "normal")
    .map(a => {
      const opt = attributeOptions.find(o => o.id === a);
      return opt ? `${opt.emoji} ${t[opt.labelKey]}` : a;
    });

  const effectsSummary = selectedAttributes.includes("normal")
    ? `❌ ${t.normal}`
    : selectedEffectLabels.length > 0
      ? selectedEffectLabels.join(", ")
      : t.noEffects;

  const lengthItems = lengthOptions.length > 0
    ? lengthOptions.map((opt) => ({
        key: opt.story_length as StoryLength,
        label: (opt.length_labels as Record<string, string>)?.[uiLang]
          || (opt.length_labels as Record<string, string>)?.de
          || opt.story_length,
      }))
    : (["short", "medium", "long", "extra_long"] as StoryLength[]).map((len) => ({
        key: len,
        label: len === "short" ? st.short : len === "medium" ? st.medium : len === "long" ? st.long : st.extra_long,
      }));

  return (
    <div className="min-h-[100dvh] flex flex-col bg-[#FFF8F0]">
        <div className="flex-1 flex flex-col items-stretch px-4 max-w-[600px] mx-auto w-full gap-2 pb-24 relative z-0">
        {/* Fablino Header with inline back button — saves ~50px */}
        <FablinoPageHeader
          mascotImage="/mascot/5_new_story.png"
          message={fablinoMessage || t.descriptionHeader}
          mascotSize="sm"
          showBackButton
          onBack={onBack}
        />

        {/* Text input with inline microphone (WhatsApp-style) */}
        <div className="w-full relative z-10">
          <Textarea
            value={additionalDescription}
            onChange={(e) => setAdditionalDescription(e.target.value)}
            placeholder={t.descriptionPlaceholder}
            maxLength={500}
            className="min-h-[48px] max-h-[120px] text-base resize-none rounded-xl border-2 border-orange-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-200/50 pr-14 bg-white"
            style={{ fontSize: '16px' }}
          />
          {additionalDescription.length >= 400 && (
            <p className="text-xs text-gray-400 text-right mt-0.5">{additionalDescription.length}/500</p>
          )}
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <VoiceRecordButton
              language={storyLanguage || kidReadingLanguage || 'de'}
              onTranscript={(text) => {
                setAdditionalDescription((prev) => {
                  const next = prev ? `${prev} ${text}` : text;
                  return next.slice(0, 500);
                });
              }}
              className="!gap-1"
            />
          </div>
        </div>

        {/* Settings panel — larger touch targets, tighter vertical spacing */}
        <div className="w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-100 shadow-sm px-3 py-2.5 space-y-2 relative z-10">
          {/* Length — chips with min 44px height */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#92400E] w-18 sm:w-20 shrink-0">{st.lengthLabel}</span>
            <div className="flex-1 grid grid-cols-2 sm:flex sm:flex-wrap gap-1 bg-orange-50/60 rounded-xl p-1">
              {lengthItems.map((item) => (
                <button
                  key={item.key}
                  onClick={() => setStoryLength(item.key)}
                  className={cn(
                    "min-h-[44px] sm:flex-1 sm:min-w-[60px] px-2 py-2 text-[15px] sm:text-sm rounded-lg transition-all duration-150 font-medium text-center whitespace-nowrap",
                    storyLength === item.key
                      ? "bg-[#E8863A] text-white shadow-sm"
                      : "text-[#2D1810]/60 hover:text-[#2D1810] hover:bg-white/60"
                  )}
                >
                  {LENGTH_EMOJIS[item.key] ? `${LENGTH_EMOJIS[item.key]} ` : ''}{item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty — 44px chips */}
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#92400E] w-18 sm:w-20 shrink-0">{st.difficultyLabel}</span>
            <div className="flex-1 flex gap-1 bg-orange-50/60 rounded-xl p-1">
              {(["easy", "medium", "hard"] as StoryDifficulty[]).map((diff) => (
                <button
                  key={diff}
                  onClick={() => setStoryDifficulty(diff)}
                  className={cn(
                    "flex-1 min-h-[44px] py-2 text-[15px] sm:text-sm rounded-lg transition-all duration-150 font-medium text-center",
                    storyDifficulty === diff
                      ? "bg-[#E8863A] text-white shadow-sm"
                      : "text-[#2D1810]/60 hover:text-[#2D1810] hover:bg-white/60"
                  )}
                >
                  {diff === "easy" ? st.easy : diff === "medium" ? st.medium : st.hard}
                </button>
              ))}
            </div>
          </div>

          {/* Language — 48px dropdown */}
          {availableLanguages.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#92400E] w-18 sm:w-20 shrink-0">{st.languageLabel}</span>
              <div className="flex-1 relative z-20">
                <button
                  onClick={() => setLangDropdownOpen(!langDropdownOpen)}
                  className="w-full flex items-center justify-between min-h-[48px] py-2 px-3 text-base font-medium rounded-xl bg-orange-50/60 hover:bg-white/60 transition-colors"
                >
                  <span>
                    {LANGUAGE_FLAGS[storyLanguage] || ''} {LANGUAGE_LABELS[storyLanguage]?.[uiLang] || storyLanguage.toUpperCase()}
                  </span>
                  <ChevronDown className={cn("h-4 w-4 text-[#92400E] transition-transform", langDropdownOpen && "rotate-180")} />
                </button>
                {langDropdownOpen && (
                  <div className="absolute z-50 top-full mt-1 left-0 right-0 bg-white rounded-xl shadow-lg border border-orange-100 py-1 max-h-48 overflow-y-auto">
                    {availableLanguages.map((lang) => (
                      <button
                        key={lang}
                        onClick={() => { setStoryLanguage(lang); setLangDropdownOpen(false); }}
                        className={cn(
                          "w-full text-left px-3 py-2.5 text-sm font-medium hover:bg-orange-50 transition-colors min-h-[44px]",
                          storyLanguage === lang ? "bg-orange-50 text-[#E8863A]" : "text-[#2D1810]"
                        )}
                      >
                        {LANGUAGE_FLAGS[lang] || ''} {LANGUAGE_LABELS[lang]?.[uiLang] || lang.toUpperCase()}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Series toggle — 44px chips */}
          {FEATURES.SERIES_UI_ENABLED && showSettings && (
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#92400E] w-18 sm:w-20 shrink-0">{st.seriesLabel}</span>
              <div className="flex-1 flex gap-1 bg-orange-50/60 rounded-xl p-1">
                {[false, true].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => setIsSeries(val)}
                    className={cn(
                      "flex-1 min-h-[44px] py-2 text-[15px] rounded-lg transition-all duration-150 font-medium text-center",
                      isSeries === val
                        ? "bg-[#E8863A] text-white shadow-sm"
                        : "text-[#2D1810]/60 hover:text-[#2D1810] hover:bg-white/60"
                    )}
                  >
                    {val ? st.seriesYes : st.seriesNo}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Admin series toggle (standalone, for Weg B where showSettings is false) */}
        {FEATURES.SERIES_UI_ENABLED && !showSettings && isAdmin && (
          <div className="w-full bg-white/70 backdrop-blur-sm rounded-2xl border border-orange-100 shadow-sm px-3 py-2.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-[#92400E] w-18 sm:w-20 shrink-0">{st.seriesLabel}</span>
              <div className="flex-1 flex gap-1 bg-orange-50/60 rounded-xl p-1">
                {[false, true].map((val) => (
                  <button
                    key={String(val)}
                    onClick={() => setIsSeries(val)}
                    className={cn(
                      "flex-1 min-h-[44px] py-2 text-[15px] rounded-lg transition-all duration-150 font-medium text-center",
                      isSeries === val
                        ? "bg-[#E8863A] text-white shadow-sm"
                        : "text-[#2D1810]/60 hover:text-[#2D1810] hover:bg-white/60"
                    )}
                  >
                    {val ? st.seriesYes : st.seriesNo}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Series mode toggle (normal vs interactive) */}
        {FEATURES.SERIES_UI_ENABLED && isAdmin && isSeries && (
          <div className="w-full flex gap-2 animate-fade-in">
            <button
              onClick={() => setSeriesMode('normal')}
              className={cn(
                "flex-1 text-left p-3 rounded-xl border-2 transition-all duration-200 min-h-[56px]",
                seriesMode === 'normal'
                  ? "border-[#E8863A] bg-white shadow-md"
                  : "border-orange-100 bg-white/70 hover:border-orange-200"
              )}
            >
              <p className="text-sm font-semibold text-[#2D1810]">📖 {st.seriesModeNormal}</p>
              <p className="text-[13px] text-[#2D1810]/50 mt-0.5">{st.seriesModeNormalDesc}</p>
            </button>
            <button
              onClick={() => setSeriesMode('interactive')}
              className={cn(
                "flex-1 text-left p-3 rounded-xl border-2 transition-all duration-200 min-h-[56px]",
                seriesMode === 'interactive'
                  ? "border-[#E8863A] bg-white shadow-md"
                  : "border-orange-100 bg-white/70 hover:border-orange-200 animate-[pulse-soft_4s_ease-in-out_infinite]"
              )}
            >
              <p className="text-sm font-semibold text-[#2D1810]">
                ✨ {st.seriesModeInteractive}
                <span className="ml-1 text-[9px] font-bold px-1 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-400 text-white">Premium</span>
              </p>
              <p className="text-[13px] text-[#2D1810]/50 mt-0.5">{st.seriesModeInteractiveDesc}</p>
            </button>
          </div>
        )}

        {/* Special Effects — collapsible, bigger tiles */}
        <div className="w-full">
          <button
            onClick={() => setEffectsExpanded(!effectsExpanded)}
            className="w-full flex items-center justify-between min-h-[44px] py-2.5 px-3 rounded-xl bg-white/70 border border-orange-100 shadow-sm hover:bg-white/90 transition-colors"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm font-semibold text-[#92400E]">{t.specialEffectsToggle}</span>
              <span className="text-xs text-[#2D1810]/50 truncate">{effectsSummary}</span>
            </div>
            <ChevronDown className={cn("h-5 w-5 text-[#92400E] shrink-0 transition-transform", effectsExpanded && "rotate-180")} />
          </button>

          {effectsExpanded && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-2 animate-fade-in">
              {attributeOptions.map((option) => {
                const isSelected = selectedAttributes.includes(option.id);
                const incompatibleReason = getIncompatibleReason(option.id);
                const isDisabled = incompatibleReason !== null;
                return (
                  <button
                    key={option.id}
                    onClick={() => toggleAttribute(option.id)}
                    title={isDisabled ? incompatibleReason! : undefined}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 w-full min-h-[56px] py-3 rounded-xl",
                      "transition-all duration-150",
                      isDisabled
                        ? "opacity-40 cursor-not-allowed border border-gray-200 bg-white"
                        : "cursor-pointer active:scale-95",
                      isSelected
                        ? "border-2 border-[#E8863A] bg-[#FFF8F0] shadow-sm"
                        : !isDisabled && "border border-gray-200 bg-white hover:border-gray-300"
                    )}
                  >
                    <span className="text-xl leading-none">{option.emoji}</span>
                    <span className="text-sm font-medium text-center leading-tight text-[#2D1810]">
                      {t[option.labelKey]}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Series hint */}
        {FEATURES.SERIES_UI_ENABLED && isSeries && (
          <p className="text-xs text-center text-[#92400E]/70 bg-orange-50/80 rounded-lg px-2 py-1.5 border border-orange-100/60">
            {t.seriesHint}
          </p>
        )}
      </div>

      {/* Create Story Button — fixed at bottom, always visible */}
      <div className="fixed bottom-0 left-0 right-0 z-30 pb-safe">
        <div className="max-w-[600px] mx-auto px-4 pt-3 pb-3 bg-gradient-to-t from-[#FFF8F0] via-[#FFF8F0]/95 to-transparent">
          <button
            onClick={handleContinue}
            data-premium-button="primary"
            className="w-full min-h-[56px] rounded-2xl text-lg font-semibold bg-[#E8863A] hover:bg-[#D4752E] text-white transition-colors shadow-lg active:scale-[0.98]"
          >
            {FEATURES.SERIES_UI_ENABLED && isSeries ? t.continueEpisode1 : t.continue} ✨
          </button>
        </div>
      </div>
    </div>
  );
};

export default SpecialEffectsScreen;
