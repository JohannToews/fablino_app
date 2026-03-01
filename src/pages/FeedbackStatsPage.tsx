import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { invokeEdgeFunction } from "@/lib/edgeFunctionHelper";
import { useAuth } from "@/hooks/useAuth";
import PageHeader from "@/components/PageHeader";
import ConsistencyCheckStats from "@/components/ConsistencyCheckStats";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Calendar } from "@/components/ui/calendar";
import { Star, Loader2, TrendingDown, BookOpen, CheckCircle, XCircle, Trash2, Filter, MessageSquare, BookMarked, Eye, ShieldCheck, BarChart3, ArrowUpDown, ArrowUp, ArrowDown, Timer, Columns3, CalendarIcon, Users, Globe } from "lucide-react";
import { format, startOfDay, getDay } from "date-fns";
import { de } from "date-fns/locale";
import { Language } from "@/lib/translations";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import StoryImage from "@/components/StoryImage";
interface StoryRating {
  id: string;
  story_id: string | null;
  story_title: string;
  story_prompt: string | null;
  kid_name: string | null;
  kid_school_class: string | null;
  kid_school_system: string | null;
  user_id: string | null;
  quality_rating: number;
  weakest_part: string | null;
  weakness_reason: string | null;
  created_at: string;
  username?: string;
  text_language?: string;
}

interface StoryClassification {
  id: string;
  title: string;
  created_at: string;
  username?: string;
  quality_rating: number | null;
  structure_beginning: number | null;
  structure_middle: number | null;
  structure_ending: number | null;
  emotional_coloring: string | null;
}

interface PerformanceEntry {
  id: string;
  title: string;
  created_at: string;
  username?: string;
  text_language: string;
  text_type: string | null;
  series_id: string | null;
  series_mode: string | null;
  episode_number: number | null;
  story_length: string | null;
  kid_age: number | null;
  generation_time_ms: number | null;
  story_generation_ms: number | null;
  image_generation_ms: number | null;
  consistency_check_ms: number | null;
  generation_status: string | null;
  cover_image_status: string | null;
  story_images_status: string | null;
}

interface StoryStats {
  id: string;
  title: string;
  difficulty: string | null;
  text_language: string;
  is_deleted: boolean;
  created_at: string;
  user_id: string | null;
  kid_profile_id: string | null;
  kid_name?: string;
  kid_school_class?: string;
  kid_school_system?: string;
  username?: string;
  is_read: boolean;
  has_feedback: boolean;
  quiz_completed: boolean;
  concrete_theme: string | null;
  emotional_coloring: string | null;
}

// Column definitions for the stories table
type StoryColumnKey = 'date' | 'user' | 'child' | 'title' | 'textLanguage' | 'difficulty' | 'jaiFini' | 'quizCompleted' | 'status' | 'theme' | 'emotionBlueprint';

interface StoryColumnDef {
  key: StoryColumnKey;
  label: string;
  defaultVisible: boolean;
  optional: boolean; // true = can be toggled
}

const translations: Record<Language, {
  title: string;
  subtitle: string;
  storiesTab: string;
  feedbackTab: string;
  totalStories: string;
  storiesRead: string;
  avgRating: string;
  mostCommonIssue: string;
  wordsRequested: string;
  wordsSaved: string;
  storyTitle: string;
  child: string;
  user: string;
  rating: string;
  weakestPart: string;
  reason: string;
  date: string;
  noData: string;
  beginning: string;
  development: string;
  ending: string;
  tooShort: string;
  tooShallow: string;
  tooRepetitive: string;
  prompt: string;
  difficulty: string;
  textType: string;
  status: string;
  fiction: string;
  nonFiction: string;
  easy: string;
  medium: string;
  hard: string;
  read: string;
  unread: string;
  active: string;
  deleted: string;
  language: string;
  length: string;
  words: string;
  filterPlaceholder: string;
  all: string;
  jaiFini: string;
  questionsAnswered: string;
  yes: string;
  no: string;
  answered: string;
  notAnswered: string;
  noQuestions: string;
  consistencyTab: string;
  classificationTab: string;
  structureBeginning: string;
  structureMiddle: string;
  structureEnding: string;
  emotionalColoring: string;
  performanceTab: string;
}> = {
  de: {
    title: "Story-Statistiken",
    subtitle: "Übersicht aller Geschichten und Bewertungen",
    storiesTab: "Geschichten",
    feedbackTab: "Feedback",
    totalStories: "Gesamt Geschichten",
    storiesRead: "Gelesen",
    avgRating: "Durchschnitt",
    mostCommonIssue: "Häufigstes Problem",
    wordsRequested: "Wörter angefragt",
    wordsSaved: "Wörter gespeichert",
    storyTitle: "Titel",
    child: "Kind",
    user: "Benutzer",
    rating: "Bewertung",
    weakestPart: "Schwächster Teil",
    reason: "Grund",
    date: "Datum",
    noData: "Keine Daten",
    beginning: "Aufbau",
    development: "Entwicklung",
    ending: "Schluss",
    tooShort: "Zu kurz",
    tooShallow: "Zu flach",
    tooRepetitive: "Zu repetitiv",
    prompt: "Prompt",
    difficulty: "Schwierigkeit",
    textType: "Textart",
    status: "Status",
    fiction: "Fiktion",
    nonFiction: "Sachtext",
    easy: "Leicht",
    medium: "Mittel",
    hard: "Schwer",
    read: "Gelesen",
    unread: "Ungelesen",
    active: "Aktiv",
    deleted: "Gelöscht",
    language: "Sprache",
    length: "Länge",
    words: "Wörter",
    filterPlaceholder: "Filtern...",
    all: "Alle",
    jaiFini: "J'ai fini",
    questionsAnswered: "Fragen",
    yes: "Ja",
    no: "Nein",
    answered: "Beantwortet",
    notAnswered: "Nicht beantwortet",
    noQuestions: "Keine Fragen",
    consistencyTab: "Qualitätsprüfung",
    classificationTab: "Klassifikation",
    structureBeginning: "Anfang",
    structureMiddle: "Mitte",
    structureEnding: "Ende",
    emotionalColoring: "Emotional Coloring",
    performanceTab: "Performance",
  },
  fr: {
    title: "Statistiques des histoires",
    subtitle: "Aperçu de toutes les histoires et évaluations",
    storiesTab: "Histoires",
    feedbackTab: "Retours",
    totalStories: "Total histoires",
    storiesRead: "Lues",
    avgRating: "Moyenne",
    mostCommonIssue: "Problème le plus fréquent",
    wordsRequested: "Mots demandés",
    wordsSaved: "Mots sauvegardés",
    storyTitle: "Titre",
    child: "Enfant",
    user: "Utilisateur",
    rating: "Note",
    weakestPart: "Partie la plus faible",
    reason: "Raison",
    date: "Date",
    noData: "Pas de données",
    beginning: "Début",
    development: "Développement",
    ending: "Fin",
    tooShort: "Trop court",
    tooShallow: "Trop superficiel",
    tooRepetitive: "Trop répétitif",
    prompt: "Prompt",
    difficulty: "Difficulté",
    textType: "Type de texte",
    status: "Statut",
    fiction: "Fiction",
    nonFiction: "Documentaire",
    easy: "Facile",
    medium: "Moyen",
    hard: "Difficile",
    read: "Lu",
    unread: "Non lu",
    active: "Actif",
    deleted: "Supprimé",
    language: "Langue",
    length: "Longueur",
    words: "Mots",
    filterPlaceholder: "Filtrer...",
    all: "Tous",
    jaiFini: "J'ai fini",
    questionsAnswered: "Questions",
    yes: "Oui",
    no: "Non",
    answered: "Répondu",
    notAnswered: "Non répondu",
    noQuestions: "Pas de questions",
    consistencyTab: "Contrôle qualité",
    classificationTab: "Classification",
    structureBeginning: "Début",
    structureMiddle: "Milieu",
    structureEnding: "Fin",
    emotionalColoring: "Coloration émotionnelle",
    performanceTab: "Performance",
  },
  en: {
    title: "Story Statistics",
    subtitle: "Overview of all stories and ratings",
    storiesTab: "Stories",
    feedbackTab: "Feedback",
    totalStories: "Total Stories",
    storiesRead: "Read",
    avgRating: "Average",
    mostCommonIssue: "Most Common Issue",
    wordsRequested: "Words Requested",
    wordsSaved: "Words Saved",
    storyTitle: "Title",
    child: "Child",
    user: "User",
    rating: "Rating",
    weakestPart: "Weakest Part",
    reason: "Reason",
    date: "Date",
    noData: "No data",
    beginning: "Beginning",
    development: "Development",
    ending: "Ending",
    tooShort: "Too short",
    tooShallow: "Too shallow",
    tooRepetitive: "Too repetitive",
    prompt: "Prompt",
    difficulty: "Difficulty",
    textType: "Text Type",
    status: "Status",
    fiction: "Fiction",
    nonFiction: "Non-Fiction",
    easy: "Easy",
    medium: "Medium",
    hard: "Hard",
    read: "Read",
    unread: "Unread",
    active: "Active",
    deleted: "Deleted",
    language: "Language",
    length: "Length",
    words: "Words",
    filterPlaceholder: "Filter...",
    all: "All",
    jaiFini: "J'ai fini",
    questionsAnswered: "Questions",
    yes: "Yes",
    no: "No",
    answered: "Answered",
    notAnswered: "Not answered",
    noQuestions: "No questions",
    consistencyTab: "Quality Check",
    classificationTab: "Classification",
    structureBeginning: "Beginning",
    structureMiddle: "Middle",
    structureEnding: "Ending",
    emotionalColoring: "Emotional Coloring",
    performanceTab: "Performance",
  },
  es: {
    title: "Estadísticas de historias",
    subtitle: "Resumen de todas las historias y valoraciones",
    storiesTab: "Historias",
    feedbackTab: "Comentarios",
    totalStories: "Total historias",
    storiesRead: "Leídas",
    avgRating: "Promedio",
    mostCommonIssue: "Problema más común",
    wordsRequested: "Palabras solicitadas",
    wordsSaved: "Palabras guardadas",
    storyTitle: "Título",
    child: "Niño",
    user: "Usuario",
    rating: "Valoración",
    weakestPart: "Parte más débil",
    reason: "Razón",
    date: "Fecha",
    noData: "Sin datos",
    beginning: "Inicio",
    development: "Desarrollo",
    ending: "Final",
    tooShort: "Demasiado corto",
    tooShallow: "Demasiado superficial",
    tooRepetitive: "Demasiado repetitivo",
    prompt: "Prompt",
    difficulty: "Dificultad",
    textType: "Tipo de texto",
    status: "Estado",
    fiction: "Ficción",
    nonFiction: "No ficción",
    easy: "Fácil",
    medium: "Medio",
    hard: "Difícil",
    read: "Leído",
    unread: "No leído",
    active: "Activo",
    deleted: "Eliminado",
    language: "Idioma",
    length: "Longitud",
    words: "Palabras",
    filterPlaceholder: "Filtrar...",
    all: "Todos",
    jaiFini: "J'ai fini",
    questionsAnswered: "Preguntas",
    yes: "Sí",
    no: "No",
    answered: "Respondido",
    notAnswered: "Sin responder",
    noQuestions: "Sin preguntas",
    consistencyTab: "Control de calidad",
    classificationTab: "Clasificación",
    structureBeginning: "Inicio",
    structureMiddle: "Medio",
    structureEnding: "Final",
    emotionalColoring: "Coloración emocional",
    performanceTab: "Rendimiento",
  },
  nl: {
    title: "Verhaal Statistieken",
    subtitle: "Overzicht van alle verhalen en beoordelingen",
    storiesTab: "Verhalen",
    feedbackTab: "Feedback",
    totalStories: "Totaal verhalen",
    storiesRead: "Gelezen",
    avgRating: "Gemiddelde",
    mostCommonIssue: "Meest voorkomend probleem",
    wordsRequested: "Woorden gevraagd",
    wordsSaved: "Woorden opgeslagen",
    storyTitle: "Titel",
    child: "Kind",
    user: "Gebruiker",
    rating: "Beoordeling",
    weakestPart: "Zwakste deel",
    reason: "Reden",
    date: "Datum",
    noData: "Geen gegevens",
    beginning: "Begin",
    development: "Ontwikkeling",
    ending: "Einde",
    tooShort: "Te kort",
    tooShallow: "Te oppervlakkig",
    tooRepetitive: "Te repetitief",
    prompt: "Prompt",
    difficulty: "Moeilijkheid",
    textType: "Teksttype",
    status: "Status",
    fiction: "Fictie",
    nonFiction: "Non-fictie",
    easy: "Makkelijk",
    medium: "Gemiddeld",
    hard: "Moeilijk",
    read: "Gelezen",
    unread: "Ongelezen",
    active: "Actief",
    deleted: "Verwijderd",
    language: "Taal",
    length: "Lengte",
    words: "Woorden",
    filterPlaceholder: "Filteren...",
    all: "Alle",
    jaiFini: "J'ai fini",
    questionsAnswered: "Vragen",
    yes: "Ja",
    no: "Nee",
    answered: "Beantwoord",
    notAnswered: "Niet beantwoord",
    noQuestions: "Geen vragen",
    consistencyTab: "Kwaliteitscontrole",
    classificationTab: "Classificatie",
    structureBeginning: "Begin",
    structureMiddle: "Midden",
    structureEnding: "Einde",
    emotionalColoring: "Emotionele kleuring",
    performanceTab: "Prestaties",
  },
  it: {
    title: "Statistiche delle storie",
    subtitle: "Panoramica di tutte le storie e valutazioni",
    storiesTab: "Storie",
    feedbackTab: "Feedback",
    totalStories: "Totale storie",
    storiesRead: "Lette",
    avgRating: "Media",
    mostCommonIssue: "Problema più comune",
    wordsRequested: "Parole richieste",
    wordsSaved: "Parole salvate",
    storyTitle: "Titolo",
    child: "Bambino",
    user: "Utente",
    rating: "Valutazione",
    weakestPart: "Parte più debole",
    reason: "Motivo",
    date: "Data",
    noData: "Nessun dato",
    beginning: "Inizio",
    development: "Sviluppo",
    ending: "Fine",
    tooShort: "Troppo corto",
    tooShallow: "Troppo superficiale",
    tooRepetitive: "Troppo ripetitivo",
    prompt: "Prompt",
    difficulty: "Difficoltà",
    textType: "Tipo di testo",
    status: "Stato",
    fiction: "Finzione",
    nonFiction: "Non-fiction",
    easy: "Facile",
    medium: "Medio",
    hard: "Difficile",
    read: "Letto",
    unread: "Non letto",
    active: "Attivo",
    deleted: "Eliminato",
    language: "Lingua",
    length: "Lunghezza",
    words: "Parole",
    filterPlaceholder: "Filtra...",
    all: "Tutti",
    jaiFini: "J'ai fini",
    questionsAnswered: "Domande",
    yes: "Sì",
    no: "No",
    answered: "Risposto",
    notAnswered: "Non risposto",
    noQuestions: "Nessuna domanda",
    consistencyTab: "Controllo qualità",
    classificationTab: "Classificazione",
    structureBeginning: "Inizio",
    structureMiddle: "Mezzo",
    structureEnding: "Fine",
    emotionalColoring: "Colorazione emotiva",
    performanceTab: "Prestazioni",
  },
  bs: {
    title: "Statistika priča",
    subtitle: "Pregled svih priča i ocjena",
    storiesTab: "Priče",
    feedbackTab: "Povratne info",
    totalStories: "Ukupno priča",
    storiesRead: "Pročitane",
    avgRating: "Prosjek",
    mostCommonIssue: "Najčešći problem",
    wordsRequested: "Zatražene riječi",
    wordsSaved: "Sačuvane riječi",
    storyTitle: "Naslov",
    child: "Dijete",
    user: "Korisnik",
    rating: "Ocjena",
    weakestPart: "Najslabiji dio",
    reason: "Razlog",
    date: "Datum",
    noData: "Nema podataka",
    beginning: "Početak",
    development: "Razvoj",
    ending: "Kraj",
    tooShort: "Prekratko",
    tooShallow: "Preplitko",
    tooRepetitive: "Previše ponavljanja",
    prompt: "Prompt",
    difficulty: "Težina",
    textType: "Vrsta teksta",
    status: "Status",
    fiction: "Fikcija",
    nonFiction: "Poučni tekst",
    easy: "Lako",
    medium: "Srednje",
    hard: "Teško",
    read: "Pročitano",
    unread: "Nepročitano",
    active: "Aktivno",
    deleted: "Obrisano",
    language: "Jezik",
    length: "Dužina",
    words: "Riječi",
    filterPlaceholder: "Filtriraj...",
    all: "Sve",
    jaiFini: "J'ai fini",
    questionsAnswered: "Pitanja",
    yes: "Da",
    no: "Ne",
    answered: "Odgovoreno",
    notAnswered: "Nije odgovoreno",
    noQuestions: "Nema pitanja",
    consistencyTab: "Provjera kvalitete",
    classificationTab: "Klasifikacija",
    structureBeginning: "Početak",
    structureMiddle: "Sredina",
    structureEnding: "Kraj",
    emotionalColoring: "Emocionalno bojenje",
    performanceTab: "Performans",
  },
  pt: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
  sk: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
  bg: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
  ca: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
  hu: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
  lt: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
  pl: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
  ro: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
  sl: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
  tr: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
  ru: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
  uk: { title: "Story Statistics", subtitle: "Overview of all stories and ratings", storiesTab: "Stories", feedbackTab: "Feedback", totalStories: "Total Stories", storiesRead: "Read", avgRating: "Average", mostCommonIssue: "Most Common Issue", wordsRequested: "Words Requested", wordsSaved: "Words Saved", storyTitle: "Title", child: "Child", user: "User", rating: "Rating", weakestPart: "Weakest Part", reason: "Reason", date: "Date", noData: "No data", beginning: "Beginning", development: "Development", ending: "Ending", tooShort: "Too short", tooShallow: "Too shallow", tooRepetitive: "Too repetitive", prompt: "Prompt", difficulty: "Difficulty", textType: "Text Type", status: "Status", fiction: "Fiction", nonFiction: "Non-Fiction", easy: "Easy", medium: "Medium", hard: "Hard", read: "Read", unread: "Unread", active: "Active", deleted: "Deleted", language: "Language", length: "Length", words: "Words", filterPlaceholder: "Filter...", all: "All", jaiFini: "J'ai fini", questionsAnswered: "Questions", yes: "Yes", no: "No", answered: "Answered", notAnswered: "Not answered", noQuestions: "No questions", consistencyTab: "Quality Check", classificationTab: "Classification", structureBeginning: "Beginning", structureMiddle: "Middle", structureEnding: "Ending", emotionalColoring: "Emotional Coloring", performanceTab: "Performance" },
};

const WEEKDAY_LABELS = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

const toMonBasedDay = (d: Date) => {
  const day = d.getDay();
  return day === 0 ? 6 : day - 1;
};

interface UsageStatsProps {
  stories: StoryStats[];
  userProgressData: Array<{ kid_profile_id: string; total_stars: number | null; total_stories_read: number | null }>;
  wordExplanationCounts: Map<string, number>;
  markedWordsCounts: Map<string, number>;
  usageStartDate: Date;
  setUsageStartDate: (d: Date) => void;
}

const UsageStatsContent = ({ stories, userProgressData, wordExplanationCounts, markedWordsCounts, usageStartDate, setUsageStartDate }: UsageStatsProps) => {
  // Sort state for user-kid table
  type UserKidSortCol = 'username' | 'kidName' | 'generated' | 'read' | 'stars' | 'wordsRequested' | 'wordsSaved';
  const [ukSortCol, setUkSortCol] = useState<UserKidSortCol>('generated');
  const [ukSortDir, setUkSortDir] = useState<'asc' | 'desc'>('desc');

  const handleUkSort = (col: UserKidSortCol) => {
    if (ukSortCol === col) setUkSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setUkSortCol(col); setUkSortDir('desc'); }
  };

  const UkSortIcon = ({ column }: { column: UserKidSortCol }) => {
    if (ukSortCol !== column) return <ArrowUpDown className="ml-1 h-3 w-3 opacity-40" />;
    return ukSortDir === 'asc' ? <ArrowUp className="ml-1 h-3 w-3" /> : <ArrowDown className="ml-1 h-3 w-3" />;
  };

  // Pending date for weekday stats — only applied on button click
  const [pendingDate, setPendingDate] = useState<Date>(usageStartDate);

  const userKidStats = useMemo(() => {
    const map = new Map<string, { username: string; kidName: string; kidProfileId: string | null; generated: number; read: number; stars: number; wordsRequested: number; wordsSaved: number }>();
    stories.forEach(s => {
      const key = `${s.username || '-'}__${s.kid_name || '-'}`;
      if (!map.has(key)) {
        const progress = userProgressData.find(p => p.kid_profile_id === s.kid_profile_id);
        const kidPid = s.kid_profile_id || '';
        map.set(key, {
          username: s.username || '-', kidName: s.kid_name || '-', kidProfileId: s.kid_profile_id,
          generated: 0, read: 0, stars: progress?.total_stars || 0,
          wordsRequested: wordExplanationCounts.get(kidPid) || 0,
          wordsSaved: markedWordsCounts.get(kidPid) || 0,
        });
      }
      const entry = map.get(key)!;
      entry.generated++;
      if (s.is_read) entry.read++;
    });
    const arr = [...map.values()];
    arr.sort((a, b) => {
      const aVal = a[ukSortCol];
      const bVal = b[ukSortCol];
      if (typeof aVal === 'string') return ukSortDir === 'asc' ? (aVal as string).localeCompare(bVal as string) : (bVal as string).localeCompare(aVal as string);
      return ukSortDir === 'asc' ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
    });
    return arr;
  }, [stories, userProgressData, wordExplanationCounts, markedWordsCounts, ukSortCol, ukSortDir]);

  const weekdayStats = useMemo(() => {
    const startDay = startOfDay(usageStartDate);
    const filteredStories = stories.filter(s => new Date(s.created_at) >= startDay);
    const generated = new Array(7).fill(0);
    const read = new Array(7).fill(0);
    filteredStories.forEach(s => {
      const dayIdx = toMonBasedDay(new Date(s.created_at));
      generated[dayIdx]++;
      if (s.is_read) read[dayIdx]++;
    });
    return WEEKDAY_LABELS.map((label, i) => ({ label, generated: generated[i], read: read[i] }));
  }, [stories, usageStartDate]);

  const totalGenerated = weekdayStats.reduce((sum, d) => sum + d.generated, 0);
  const totalRead = weekdayStats.reduce((sum, d) => sum + d.read, 0);

  // Language stats
  const languageStats = useMemo(() => {
    const filteredStories = usageStartDate
      ? stories.filter(s => new Date(s.created_at) >= usageStartDate)
      : stories;
    const langMap = new Map<string, number>();
    filteredStories.forEach(s => {
      const lang = s.text_language || '-';
      langMap.set(lang, (langMap.get(lang) || 0) + 1);
    });
    return Array.from(langMap.entries())
      .map(([lang, count]) => ({ lang, count }))
      .sort((a, b) => b.count - a.count);
  }, [stories, usageStartDate]);

  return (
    <Accordion type="multiple" defaultValue={[]} className="space-y-4">
      <AccordionItem value="user-kid" className="border rounded-lg bg-card shadow-sm">
        <AccordionTrigger className="px-4">
          <div className="flex items-center gap-2"><Users className="h-4 w-4" /><span className="font-semibold">User – Kind Übersicht</span></div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleUkSort('username')}>
                    <div className="flex items-center">User<UkSortIcon column="username" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50" onClick={() => handleUkSort('kidName')}>
                    <div className="flex items-center">Kind<UkSortIcon column="kidName" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleUkSort('generated')}>
                    <div className="flex items-center justify-end">Stories generiert<UkSortIcon column="generated" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleUkSort('read')}>
                    <div className="flex items-center justify-end">Stories gelesen<UkSortIcon column="read" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleUkSort('stars')}>
                    <div className="flex items-center justify-end">⭐ Sterne<UkSortIcon column="stars" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleUkSort('wordsRequested')}>
                    <div className="flex items-center justify-end">📖 Wörter angefragt<UkSortIcon column="wordsRequested" /></div>
                  </TableHead>
                  <TableHead className="cursor-pointer hover:bg-muted/50 text-right" onClick={() => handleUkSort('wordsSaved')}>
                    <div className="flex items-center justify-end">💾 Wörter gespeichert<UkSortIcon column="wordsSaved" /></div>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {userKidStats.map((row, i) => (
                  <TableRow key={i}>
                    <TableCell>{row.username}</TableCell>
                    <TableCell>{row.kidName}</TableCell>
                    <TableCell className="text-right font-mono">{row.generated}</TableCell>
                    <TableCell className="text-right font-mono">{row.read}</TableCell>
                    <TableCell className="text-right font-mono">{row.stars}</TableCell>
                    <TableCell className="text-right font-mono">{row.wordsRequested}</TableCell>
                    <TableCell className="text-right font-mono">{row.wordsSaved}</TableCell>
                  </TableRow>
                ))}
                {userKidStats.length === 0 && (
                  <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">Keine Daten</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="by-language" className="border rounded-lg bg-card shadow-sm">
        <AccordionTrigger className="px-4">
          <div className="flex items-center gap-2"><Globe className="h-4 w-4" /><span className="font-semibold">Stories pro Textsprache</span></div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sprache</TableHead>
                  <TableHead className="text-right">Anzahl Stories</TableHead>
                  <TableHead className="text-right">Anteil</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {languageStats.map((row) => (
                  <TableRow key={row.lang}>
                    <TableCell>
                      <Badge variant="outline" className="uppercase">{row.lang}</Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono">{row.count}</TableCell>
                    <TableCell className="text-right font-mono text-muted-foreground">
                      {stories.length > 0 ? `${Math.round((row.count / stories.length) * 100)}%` : '-'}
                    </TableCell>
                  </TableRow>
                ))}
                {languageStats.length === 0 && (
                  <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Keine Daten</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>

      <AccordionItem value="weekday" className="border rounded-lg bg-card shadow-sm">
        <AccordionTrigger className="px-4">
          <div className="flex items-center gap-2"><CalendarIcon className="h-4 w-4" /><span className="font-semibold">Stories pro Wochentag (kumuliert)</span></div>
        </AccordionTrigger>
        <AccordionContent className="px-4 pb-4">
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm text-muted-foreground">Ab:</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className={cn("w-[200px] justify-start text-left font-normal")}>
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(pendingDate, "dd.MM.yyyy")}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={pendingDate} onSelect={(d) => d && setPendingDate(d)} initialFocus className={cn("p-3 pointer-events-auto")} />
              </PopoverContent>
            </Popover>
            <Button size="sm" onClick={() => setUsageStartDate(pendingDate)}>
              Neu berechnen
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Wochentag</TableHead>
                  <TableHead className="text-right">Stories generiert</TableHead>
                  <TableHead className="text-right">Stories gelesen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {weekdayStats.map((day, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">{day.label}</TableCell>
                    <TableCell className="text-right font-mono">{day.generated}</TableCell>
                    <TableCell className="text-right font-mono">{day.read}</TableCell>
                  </TableRow>
                ))}
                <TableRow className="font-semibold border-t-2">
                  <TableCell>Gesamt</TableCell>
                  <TableCell className="text-right font-mono">{totalGenerated}</TableCell>
                  <TableCell className="text-right font-mono">{totalRead}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
};

const FeedbackStatsPage = () => {
  const { user } = useAuth();
  const [ratings, setRatings] = useState<StoryRating[]>([]);
  const [stories, setStories] = useState<StoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stories");

  // Filter states for stories
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterKid, setFilterKid] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTitle, setFilterTitle] = useState<string>("");
  const [filterJaiFini, setFilterJaiFini] = useState<string>("all");
  const [filterQuizCompleted, setFilterQuizCompleted] = useState<string>("all");

  // Which filters are visible
  type StoryFilterKey = 'title' | 'user' | 'kid' | 'difficulty' | 'status' | 'jaiFini' | 'quiz';
  const [visibleFilters, setVisibleFilters] = useState<Set<StoryFilterKey>>(new Set([
    'title', 'user', 'kid', 'difficulty', 'status'
  ]));
  const toggleFilter = (key: StoryFilterKey) => {
    setVisibleFilters(prev => {
      const next = new Set(prev);
      if (next.has(key)) { next.delete(key); } else { next.add(key); }
      return next;
    });
  };

  // Column visibility state
  const [visibleColumns, setVisibleColumns] = useState<Set<StoryColumnKey>>(new Set([
    'date', 'user', 'child', 'title', 'textLanguage', 'difficulty', 'jaiFini', 'quizCompleted', 'status'
  ]));

  // Filter states for feedback
  const [filterFeedbackKid, setFilterFeedbackKid] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");

  // Detail dialog state
  const [selectedRating, setSelectedRating] = useState<StoryRating | null>(null);
  
  // Story preview dialog
  const [previewStory, setPreviewStory] = useState<{ title: string; content: string; cover_image_url: string | null; story_images: string[] | null } | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  const openStoryPreview = async (storyId: string) => {
    setPreviewLoading(true);
    setPreviewStory(null);
    const { data } = await supabase
      .from("stories")
      .select("title, content, cover_image_url, story_images")
      .eq("id", storyId)
      .single();
    if (data) {
      setPreviewStory({
        title: data.title,
        content: data.content,
        cover_image_url: data.cover_image_url,
        story_images: data.story_images,
      });
    }
    setPreviewLoading(false);
  };
  // Selection states for deletion
  const [selectedFeedbackIds, setSelectedFeedbackIds] = useState<Set<string>>(new Set());
  const [isDeletingFeedback, setIsDeletingFeedback] = useState(false);
  
  // Classification state
  const [classifications, setClassifications] = useState<StoryClassification[]>([]);
  const [classificationSortKey, setClassificationSortKey] = useState<keyof StoryClassification>("created_at");
  const [classificationSortDir, setClassificationSortDir] = useState<"asc" | "desc">("desc");
  
  // Performance state
  const [performanceData, setPerformanceData] = useState<PerformanceEntry[]>([]);
  const [perfSortKey, setPerfSortKey] = useState<keyof PerformanceEntry>("created_at");
  const [perfSortDir, setPerfSortDir] = useState<"asc" | "desc">("desc");
  const [perfFilterTextart, setPerfFilterTextart] = useState<string>("all");
  const [perfFilterAge, setPerfFilterAge] = useState<string>("all");
  const [perfFilterLength, setPerfFilterLength] = useState<string>("all");

  // Usage stats state
  const [usageStartDate, setUsageStartDate] = useState<Date>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d;
  });
  const [userProgressData, setUserProgressData] = useState<Array<{
    kid_profile_id: string;
    total_stars: number | null;
    total_stories_read: number | null;
  }>>([]);
  const [wordExplanationCounts, setWordExplanationCounts] = useState<Map<string, number>>(new Map());
  const [markedWordsCounts, setMarkedWordsCounts] = useState<Map<string, number>>(new Map());
  const [totalKidProfiles, setTotalKidProfiles] = useState(0);
  const [kpiStartDate, setKpiStartDate] = useState<Date | undefined>(undefined);
  const [pendingKpiDate, setPendingKpiDate] = useState<Date | undefined>(undefined);
  
  const adminLang = (user?.adminLanguage || 'de') as Language;
  const t = translations[adminLang] || translations.de;

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    // Load ratings
    const { data: ratingsData } = await supabase
      .from("story_ratings")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5000);

    // Ratings will be enriched after stories/users are loaded
    const rawRatings = ratingsData || [];

    // Get story IDs that have feedback (J'ai fini clicked)
    const feedbackStoryIds = new Set(ratingsData?.map(r => r.story_id).filter(Boolean) || []);

    // Load stories with kid profiles
    const { data: storiesData } = await supabase
      .from("stories")
      .select(`
        id,
        title,
        prompt,
        difficulty,
        text_type,
        text_language,
        is_deleted,
        created_at,
        user_id,
        kid_profile_id,
        structure_beginning,
        structure_middle,
        structure_ending,
        emotional_coloring,
        concrete_theme,
        series_id,
        series_mode,
        episode_number,
        story_length,
        generation_time_ms,
        story_generation_ms,
        image_generation_ms,
        consistency_check_ms,
        generation_status,
        cover_image_status,
        story_images_status,
        kid_profiles (
          name,
          school_class,
          school_system,
          age
        )
      `)
      .order("created_at", { ascending: false })
      .limit(5000);

    // Load user results to check which stories have been read
    const { data: resultsData } = await supabase
      .from("user_results")
      .select("reference_id")
      .in("activity_type", ["story_completed", "story_read"])
      .limit(5000);

    const readStoryIds = new Set(resultsData?.map(r => r.reference_id) || []);

    // Load comprehension results (questions answered per story)
    const { data: comprehensionResults } = await supabase
      .from("user_results")
      .select("reference_id, total_questions, correct_answers")
      .in("activity_type", ["quiz_complete", "quiz_completed"])
      .limit(5000);

    const quizCompletedStoryIds = new Set<string>();
    comprehensionResults?.forEach(r => {
      if (r.reference_id) {
        quizCompletedStoryIds.add(r.reference_id);
      }
    });

    // Load comprehension questions count per story (for stories without results)
    const { data: questionsData } = await supabase
      .from("comprehension_questions")
      .select("story_id")
      .limit(10000);

    const questionsPerStory = new Map<string, number>();
    questionsData?.forEach(q => {
      questionsPerStory.set(q.story_id, (questionsPerStory.get(q.story_id) || 0) + 1);
    });

    // Load marked words per story
    const { data: markedWordsData } = await supabase
      .from("marked_words")
      .select("story_id, explanation")
      .limit(10000);

    // Count words per story (requested = has entry, saved = has explanation)
    const wordsPerStory = new Map<string, { requested: number; saved: number }>();
    markedWordsData?.forEach(w => {
      const current = wordsPerStory.get(w.story_id) || { requested: 0, saved: 0 };
      current.requested++;
      if (w.explanation) {
        current.saved++;
      }
      wordsPerStory.set(w.story_id, current);
    });

    // Load user profiles to get usernames
    const { data: usersData } = await invokeEdgeFunction("manage-users", {
      action: "list",
    });

    const usersMap = new Map<string, string>();
    if (usersData?.users) {
      usersData.users.forEach((u: { id: string; username: string }) => {
        usersMap.set(u.id, u.username);
      });
    }

    // Build a map of story_id -> text_language from storiesData
    const storyLangMap = new Map<string, string>();
    if (storiesData) {
      storiesData.forEach((s: any) => {
        storyLangMap.set(s.id, s.text_language || '-');
      });
    }

    // Enrich ratings with username and text_language
    const enrichedRatings: StoryRating[] = rawRatings.map((r: any) => ({
      ...r,
      username: r.user_id ? usersMap.get(r.user_id) : undefined,
      text_language: r.story_id ? storyLangMap.get(r.story_id) : undefined,
    }));
    setRatings(enrichedRatings);

    if (storiesData) {
      const mappedStories: StoryStats[] = storiesData.map((story: any) => {
        return {
          id: story.id,
          title: story.title,
          difficulty: story.difficulty,
          text_language: story.text_language || '-',
          is_deleted: story.is_deleted || false,
          created_at: story.created_at,
          user_id: story.user_id,
          kid_profile_id: story.kid_profile_id,
          kid_name: story.kid_profiles?.name,
          kid_school_class: story.kid_profiles?.school_class,
          kid_school_system: story.kid_profiles?.school_system,
          username: story.user_id ? usersMap.get(story.user_id) : undefined,
          is_read: readStoryIds.has(story.id),
          has_feedback: feedbackStoryIds.has(story.id),
          quiz_completed: quizCompletedStoryIds.has(story.id),
          concrete_theme: story.concrete_theme,
          emotional_coloring: story.emotional_coloring,
        };
      });
      setStories(mappedStories);
      
      // Build classification data
      const classificationData: StoryClassification[] = storiesData.map((story: any) => {
        const ratingData = ratingsData?.find(r => r.story_id === story.id);
        return {
          id: story.id,
          title: story.title,
          created_at: story.created_at,
          username: story.user_id ? usersMap.get(story.user_id) : undefined,
          quality_rating: ratingData?.quality_rating || null,
          structure_beginning: story.structure_beginning,
          structure_middle: story.structure_middle,
          structure_ending: story.structure_ending,
          emotional_coloring: story.emotional_coloring,
        };
      });
      setClassifications(classificationData);
      
      // Build performance data
      const perfData: PerformanceEntry[] = storiesData.map((story: any) => ({
        id: story.id,
        title: story.title,
        created_at: story.created_at,
        username: story.user_id ? usersMap.get(story.user_id) : undefined,
        text_language: story.text_language || '-',
        text_type: story.text_type,
        series_id: story.series_id,
        series_mode: story.series_mode,
        episode_number: story.episode_number,
        story_length: story.story_length,
        kid_age: story.kid_profiles?.age ?? null,
        generation_time_ms: story.generation_time_ms,
        story_generation_ms: story.story_generation_ms,
        image_generation_ms: story.image_generation_ms,
        consistency_check_ms: story.consistency_check_ms,
        generation_status: story.generation_status,
        cover_image_status: story.cover_image_status,
        story_images_status: story.story_images_status,
      }));
      setPerformanceData(perfData);
    }

    // Load user_progress for stars
    const { data: progressData } = await supabase
      .from("user_progress")
      .select("kid_profile_id, total_stars, total_stories_read");
    setUserProgressData(progressData || []);

    // Load word explanation counts per kid
    const { data: wordExplData } = await supabase
      .from("word_explanation_log")
      .select("kid_profile_id");
    const weMap = new Map<string, number>();
    wordExplData?.forEach((w: any) => {
      weMap.set(w.kid_profile_id, (weMap.get(w.kid_profile_id) || 0) + 1);
    });
    setWordExplanationCounts(weMap);

    // Aggregate marked words per kid_profile_id (via story)
    const storyToKid = new Map<string, string>();
    storiesData?.forEach((s: any) => {
      if (s.kid_profile_id) storyToKid.set(s.id, s.kid_profile_id);
    });
    const mwMap = new Map<string, number>();
    markedWordsData?.forEach((w: any) => {
      const kidId = storyToKid.get(w.story_id);
      if (kidId) mwMap.set(kidId, (mwMap.get(kidId) || 0) + 1);
    });
    setMarkedWordsCounts(mwMap);

    // Count total kid profiles
    const { count: kidCount } = await supabase
      .from("kid_profiles")
      .select("id", { count: "exact", head: true });
    setTotalKidProfiles(kidCount || 0);

    setIsLoading(false);
  };

  // Get unique values for filters
  const uniqueUsers = useMemo(() => [...new Set(stories.map(s => s.username).filter(Boolean))], [stories]);
  const uniqueKids = useMemo(() => [...new Set(stories.map(s => s.kid_name).filter(Boolean))], [stories]);
  const uniqueFeedbackKids = useMemo(() => [...new Set(ratings.map(r => r.kid_name).filter(Boolean))], [ratings]);

  // Filtered stories
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      if (kpiStartDate && new Date(story.created_at) < kpiStartDate) return false;
      if (filterUser !== "all" && story.username !== filterUser) return false;
      if (filterKid !== "all" && story.kid_name !== filterKid) return false;
      if (filterDifficulty !== "all" && story.difficulty !== filterDifficulty) return false;
      if (filterStatus === "read" && !story.is_read) return false;
      if (filterStatus === "unread" && story.is_read) return false;
      if (filterStatus === "deleted" && !story.is_deleted) return false;
      if (filterStatus === "active" && story.is_deleted) return false;
      if (filterTitle && !story.title.toLowerCase().includes(filterTitle.toLowerCase())) return false;
      if (filterJaiFini === "yes" && !story.has_feedback) return false;
      if (filterJaiFini === "no" && story.has_feedback) return false;
      if (filterQuizCompleted === "yes" && !story.quiz_completed) return false;
      if (filterQuizCompleted === "no" && story.quiz_completed) return false;
      return true;
    });
  }, [stories, kpiStartDate, filterUser, filterKid, filterDifficulty, filterStatus, filterTitle, filterJaiFini, filterQuizCompleted]);

  // Filtered ratings
  const filteredRatings = useMemo(() => {
    return ratings.filter(rating => {
      if (filterFeedbackKid !== "all" && rating.kid_name !== filterFeedbackKid) return false;
      if (filterRating !== "all" && rating.quality_rating !== parseInt(filterRating)) return false;
      return true;
    });
  }, [ratings, filterFeedbackKid, filterRating]);

  // Sorted classifications
  const sortedClassifications = useMemo(() => {
    return [...classifications].sort((a, b) => {
      const aVal = a[classificationSortKey];
      const bVal = b[classificationSortKey];
      
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return classificationSortDir === 'asc' 
          ? aVal.localeCompare(bVal) 
          : bVal.localeCompare(aVal);
      }
      
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return classificationSortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      
      return 0;
    });
  }, [classifications, classificationSortKey, classificationSortDir]);

  // Helper: textart label
  const getTextartCode = (item: PerformanceEntry) => {
    if (!item.series_id) return 'N';
    if (item.series_mode === 'interactive') return 'SX';
    return 'S';
  };

  // Helper: length label
  const getLengthCode = (len: string | null) => {
    if (!len) return '-';
    switch (len) {
      case 'short': return 'S';
      case 'medium': return 'M';
      case 'long': return 'L';
      case 'extra_long': return 'XL';
      default: return len.charAt(0).toUpperCase();
    }
  };

  // Unique perf filter values
  const uniquePerfAges = useMemo(() => 
    [...new Set(performanceData.map(p => p.kid_age).filter((a): a is number => a !== null))].sort((a, b) => a - b), 
    [performanceData]
  );

  // Sorted & filtered performance data
  const sortedPerformance = useMemo(() => {
    return [...performanceData]
      .filter(item => {
        if (perfFilterTextart !== 'all' && getTextartCode(item) !== perfFilterTextart) return false;
        if (perfFilterAge !== 'all' && String(item.kid_age) !== perfFilterAge) return false;
        if (perfFilterLength !== 'all' && getLengthCode(item.story_length) !== perfFilterLength) return false;
        return true;
      })
      .sort((a, b) => {
      const aVal = a[perfSortKey];
      const bVal = b[perfSortKey];
      if (aVal === null || aVal === undefined) return 1;
      if (bVal === null || bVal === undefined) return -1;
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return perfSortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return perfSortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });
  }, [performanceData, perfSortKey, perfSortDir, perfFilterTextart, perfFilterAge, perfFilterLength]);

  const handleClassificationSort = (key: keyof StoryClassification) => {
    if (classificationSortKey === key) {
      setClassificationSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setClassificationSortKey(key);
      setClassificationSortDir('desc');
    }
  };

  const handlePerfSort = (key: keyof PerformanceEntry) => {
    if (perfSortKey === key) {
      setPerfSortDir(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setPerfSortKey(key);
      setPerfSortDir('desc');
    }
  };

  const SortIcon = ({ column }: { column: keyof StoryClassification }) => {
    if (classificationSortKey !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return classificationSortDir === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const PerfSortIcon = ({ column }: { column: keyof PerformanceEntry }) => {
    if (perfSortKey !== column) {
      return <ArrowUpDown className="h-4 w-4 ml-1 opacity-50" />;
    }
    return perfSortDir === 'asc' 
      ? <ArrowUp className="h-4 w-4 ml-1" />
      : <ArrowDown className="h-4 w-4 ml-1" />;
  };

  const fmtMs = (ms: number | null) => ms != null ? (ms / 1000).toFixed(1) + 's' : '-';

  const kpiRatings = useMemo(() => {
    if (!kpiStartDate) return ratings;
    return ratings.filter(r => new Date(r.created_at) >= kpiStartDate);
  }, [ratings, kpiStartDate]);

  const avgRating = kpiRatings.length > 0
    ? (kpiRatings.reduce((sum, r) => sum + r.quality_rating, 0) / kpiRatings.length).toFixed(1)
    : "0";

  const totalWordsRequested = 0;
  const totalWordsSaved = 0;

  const getMostCommonIssue = () => {
    const issues: Record<string, number> = {};
    ratings.forEach((r) => {
      if (r.weakness_reason) {
        issues[r.weakness_reason] = (issues[r.weakness_reason] || 0) + 1;
      }
    });
    const sorted = Object.entries(issues).sort((a, b) => b[1] - a[1]);
    return sorted[0]?.[0] || null;
  };

  const mostCommonIssue = getMostCommonIssue();

  const translateWeakestPart = (part: string | null) => {
    if (!part) return "-";
    switch (part) {
      case "beginning": return t.beginning;
      case "development": return t.development;
      case "ending": return t.ending;
      default: return part;
    }
  };

  const translateReason = (reason: string | null) => {
    if (!reason) return "-";
    switch (reason) {
      case "too_short": return t.tooShort;
      case "too_shallow": return t.tooShallow;
      case "too_repetitive": return t.tooRepetitive;
      default: return reason;
    }
  };

  const translateDifficulty = (diff: string | null) => {
    if (!diff) return "-";
    switch (diff) {
      case "easy": return t.easy;
      case "medium": return t.medium;
      case "difficult": return t.hard;
      default: return diff;
    }
  };

  const translateTextType = (type: string | null) => {
    if (!type) return "-";
    switch (type) {
      case "fiction": return t.fiction;
      case "non-fiction": return t.nonFiction;
      default: return type;
    }
  };

  const renderStars = (rating: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`h-4 w-4 ${
            star <= rating ? "fill-sunshine text-sunshine" : "text-muted-foreground/30"
          }`}
        />
      ))}
    </div>
  );

  // Feedback selection handlers
  const toggleFeedbackSelection = (id: string) => {
    setSelectedFeedbackIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const toggleAllFeedback = () => {
    if (selectedFeedbackIds.size === filteredRatings.length) {
      setSelectedFeedbackIds(new Set());
    } else {
      setSelectedFeedbackIds(new Set(filteredRatings.map(r => r.id)));
    }
  };

  const deleteSelectedFeedback = async () => {
    if (selectedFeedbackIds.size === 0) return;
    
    setIsDeletingFeedback(true);
    try {
      const { error } = await supabase
        .from("story_ratings")
        .delete()
        .in("id", Array.from(selectedFeedbackIds));
      
      if (error) throw error;
      
      setRatings(prev => prev.filter(r => !selectedFeedbackIds.has(r.id)));
      setSelectedFeedbackIds(new Set());
      toast.success(adminLang === 'de' ? 'Feedback gelöscht' : adminLang === 'fr' ? 'Feedback supprimé' : 'Feedback deleted');
    } catch (error) {
      console.error("Error deleting feedback:", error);
      toast.error(adminLang === 'de' ? 'Fehler beim Löschen' : adminLang === 'fr' ? 'Erreur lors de la suppression' : 'Error deleting');
    }
    setIsDeletingFeedback(false);
  };




  const kpiStories = useMemo(() => {
    if (!kpiStartDate) return stories;
    return stories.filter(s => new Date(s.created_at) >= kpiStartDate);
  }, [stories, kpiStartDate]);

  const storiesRead = kpiStories.filter(s => s.is_read).length;
  const quizzesCompleted = kpiStories.filter(s => s.quiz_completed).length;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <PageHeader title={t.title} backTo="/" />
        <p className="text-muted-foreground mb-6">{t.subtitle}</p>
        {/* KPI Date Filter */}
        <div className="flex items-center gap-2 mb-4">
          <span className="text-sm text-muted-foreground">KPI ab:</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="w-[150px] justify-start text-left font-normal">
                <CalendarIcon className="h-4 w-4 mr-2" />
                {pendingKpiDate ? format(pendingKpiDate, "dd.MM.yyyy") : "Alle Daten"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={pendingKpiDate}
                onSelect={setPendingKpiDate}
                locale={de}
                className="p-3 pointer-events-auto"
              />
            </PopoverContent>
          </Popover>
          <Button size="sm" variant="secondary" onClick={() => setKpiStartDate(pendingKpiDate)}>
            Neu berechnen
          </Button>
          {kpiStartDate && (
            <Button size="sm" variant="ghost" onClick={() => { setKpiStartDate(undefined); setPendingKpiDate(undefined); }}>
              ✕
            </Button>
          )}
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Aktive Kinder
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{kpiStartDate ? new Set(kpiStories.map(s => s.kid_profile_id).filter(Boolean)).size : totalKidProfiles}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bücher generiert
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{kpiStories.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Bücher gelesen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-mint" />
                <span className="text-2xl font-bold">{storiesRead}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Quizzes beendet
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-mint" />
                <span className="text-2xl font-bold">{quizzesCompleted}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Ø Rating
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-sunshine text-sunshine" />
                <span className="text-2xl font-bold">{avgRating}</span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="stories" className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              {t.storiesTab} ({filteredStories.length})
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              {t.feedbackTab} ({filteredRatings.length})
            </TabsTrigger>
            <TabsTrigger value="consistency" className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4" />
              {t.consistencyTab}
            </TabsTrigger>
            <TabsTrigger value="classification" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              {t.classificationTab}
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <Timer className="h-4 w-4" />
              {t.performanceTab}
            </TabsTrigger>
            <TabsTrigger value="usage" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Usage Stats
            </TabsTrigger>
          </TabsList>

          {/* Stories Tab */}
          <TabsContent value="stories">
            {/* Filters */}
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filter</span>
                  </div>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                        <Columns3 className="h-3 w-3" /> Filter ein/aus
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-48 p-2" align="end">
                      {([
                        ['title', 'Titel'],
                        ['user', 'User'],
                        ['kid', 'Kind'],
                        ['difficulty', 'Schwierigkeit'],
                        ['status', 'Status'],
                        ['jaiFini', "J'ai fini"],
                        ['quiz', 'Quiz'],
                      ] as [StoryFilterKey, string][]).map(([key, label]) => (
                        <label key={key} className="flex items-center gap-2 py-1 px-1 text-sm cursor-pointer hover:bg-muted/50 rounded">
                          <Checkbox checked={visibleFilters.has(key)} onCheckedChange={() => toggleFilter(key)} />
                          {label}
                        </label>
                      ))}
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex flex-wrap gap-2">
                  {visibleFilters.has('title') && (
                    <Input
                      placeholder="Titel"
                      value={filterTitle}
                      onChange={(e) => setFilterTitle(e.target.value)}
                      className="h-9 w-[130px]"
                    />
                  )}
                  {visibleFilters.has('user') && (
                    <Select value={filterUser} onValueChange={setFilterUser}>
                      <SelectTrigger className="h-9 w-[130px]">
                        <span className="text-muted-foreground text-xs mr-1">User:</span>
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.all}</SelectItem>
                        {uniqueUsers.map(u => (
                          <SelectItem key={u} value={u!}>{u}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {visibleFilters.has('kid') && (
                    <Select value={filterKid} onValueChange={setFilterKid}>
                      <SelectTrigger className="h-9 w-[130px]">
                        <span className="text-muted-foreground text-xs mr-1">Kind:</span>
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.all}</SelectItem>
                        {uniqueKids.map(k => (
                          <SelectItem key={k} value={k!}>{k}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                  {visibleFilters.has('difficulty') && (
                    <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                      <SelectTrigger className="h-9 w-[150px]">
                        <span className="text-muted-foreground text-xs mr-1">Schwierigk.:</span>
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.all}</SelectItem>
                        <SelectItem value="easy">{t.easy}</SelectItem>
                        <SelectItem value="medium">{t.medium}</SelectItem>
                        <SelectItem value="difficult">{t.hard}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {visibleFilters.has('status') && (
                    <Select value={filterStatus} onValueChange={setFilterStatus}>
                      <SelectTrigger className="h-9 w-[130px]">
                        <span className="text-muted-foreground text-xs mr-1">Status:</span>
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.all}</SelectItem>
                        <SelectItem value="read">{t.read}</SelectItem>
                        <SelectItem value="unread">{t.unread}</SelectItem>
                        <SelectItem value="active">{t.active}</SelectItem>
                        <SelectItem value="deleted">{t.deleted}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {visibleFilters.has('jaiFini') && (
                    <Select value={filterJaiFini} onValueChange={setFilterJaiFini}>
                      <SelectTrigger className="h-9 w-[130px]">
                        <span className="text-muted-foreground text-xs mr-1">J'ai fini:</span>
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.all}</SelectItem>
                        <SelectItem value="yes">{t.yes}</SelectItem>
                        <SelectItem value="no">{t.no}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                  {visibleFilters.has('quiz') && (
                    <Select value={filterQuizCompleted} onValueChange={setFilterQuizCompleted}>
                      <SelectTrigger className="h-9 w-[120px]">
                        <span className="text-muted-foreground text-xs mr-1">Quiz:</span>
                        <SelectValue placeholder="Alle" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">{t.all}</SelectItem>
                        <SelectItem value="yes">{t.yes}</SelectItem>
                        <SelectItem value="no">{t.no}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>

            {filteredStories.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">{t.noData}</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  {/* Column visibility toggle */}
                  <div className="flex justify-end p-2 border-b">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className="gap-1">
                          <Columns3 className="h-4 w-4" />
                          Spalten
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-56" align="end">
                        <div className="space-y-2">
                          <p className="text-sm font-medium mb-2">Spalten ein/ausblenden</p>
                          {([
                            { key: 'date' as StoryColumnKey, label: t.date },
                            { key: 'user' as StoryColumnKey, label: t.user },
                            { key: 'child' as StoryColumnKey, label: t.child },
                            { key: 'title' as StoryColumnKey, label: t.storyTitle },
                            { key: 'textLanguage' as StoryColumnKey, label: t.language },
                            { key: 'difficulty' as StoryColumnKey, label: t.difficulty },
                            { key: 'jaiFini' as StoryColumnKey, label: t.jaiFini },
                            { key: 'quizCompleted' as StoryColumnKey, label: 'Quiz' },
                            { key: 'status' as StoryColumnKey, label: t.status },
                            { key: 'theme' as StoryColumnKey, label: 'Theme' },
                            { key: 'emotionBlueprint' as StoryColumnKey, label: 'Emotion Blueprint' },
                          ]).map(col => (
                            <div key={col.key} className="flex items-center gap-2">
                              <Checkbox
                                checked={visibleColumns.has(col.key)}
                                onCheckedChange={(checked) => {
                                  setVisibleColumns(prev => {
                                    const next = new Set(prev);
                                    if (checked) next.add(col.key);
                                    else next.delete(col.key);
                                    return next;
                                  });
                                }}
                              />
                              <span className="text-sm">{col.label}</span>
                            </div>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          {visibleColumns.has('date') && <TableHead>{t.date}</TableHead>}
                          {visibleColumns.has('user') && <TableHead>{t.user}</TableHead>}
                          {visibleColumns.has('child') && <TableHead>{t.child}</TableHead>}
                          {visibleColumns.has('title') && <TableHead>{t.storyTitle}</TableHead>}
                          {visibleColumns.has('textLanguage') && <TableHead>{t.language}</TableHead>}
                          {visibleColumns.has('difficulty') && <TableHead>{t.difficulty}</TableHead>}
                          {visibleColumns.has('jaiFini') && <TableHead>{t.jaiFini}</TableHead>}
                          {visibleColumns.has('quizCompleted') && <TableHead>Quiz</TableHead>}
                          {visibleColumns.has('status') && <TableHead>{t.status}</TableHead>}
                          {visibleColumns.has('theme') && <TableHead>Theme</TableHead>}
                          {visibleColumns.has('emotionBlueprint') && <TableHead>Emotion</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStories.map((story) => (
                          <TableRow key={story.id} className={story.is_deleted ? "opacity-50" : ""}>
                            {visibleColumns.has('date') && (
                              <TableCell className="whitespace-nowrap">
                                {format(new Date(story.created_at), "dd.MM.yyyy")}
                              </TableCell>
                            )}
                            {visibleColumns.has('user') && (
                              <TableCell>{story.username || "-"}</TableCell>
                            )}
                            {visibleColumns.has('child') && (
                              <TableCell>
                                <div className="flex flex-col">
                                  <span className="font-medium">{story.kid_name || "-"}</span>
                                  {story.kid_school_class && (
                                    <span className="text-xs text-muted-foreground">
                                      {story.kid_school_class} ({story.kid_school_system?.toUpperCase()})
                                    </span>
                                  )}
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.has('title') && (
                              <TableCell className="max-w-[200px] truncate font-medium" title={story.title}>
                                {story.title}
                              </TableCell>
                            )}
                            {visibleColumns.has('textLanguage') && (
                              <TableCell>
                                <Badge variant="outline">{story.text_language?.toUpperCase() || "-"}</Badge>
                              </TableCell>
                            )}
                            {visibleColumns.has('difficulty') && (
                              <TableCell>
                                <Badge variant={
                                  story.difficulty === "easy" ? "secondary" :
                                  story.difficulty === "difficult" ? "destructive" : "default"
                                }>
                                  {translateDifficulty(story.difficulty)}
                                </Badge>
                              </TableCell>
                            )}
                            {visibleColumns.has('jaiFini') && (
                              <TableCell>
                                {story.has_feedback ? (
                                  <Badge className="bg-mint/20 text-mint border-mint">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {t.yes}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    {t.no}
                                  </Badge>
                                )}
                              </TableCell>
                            )}
                            {visibleColumns.has('quizCompleted') && (
                              <TableCell>
                                {story.quiz_completed ? (
                                  <Badge className="bg-mint/20 text-mint border-mint">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    {t.yes}
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-muted-foreground">
                                    <XCircle className="h-3 w-3 mr-1" />
                                    {t.no}
                                  </Badge>
                                )}
                              </TableCell>
                            )}
                            {visibleColumns.has('status') && (
                              <TableCell>
                                <div className="flex flex-col gap-1">
                                  {story.is_read ? (
                                    <Badge className="bg-mint/20 text-mint border-mint">
                                      <CheckCircle className="h-3 w-3 mr-1" />
                                      {t.read}
                                    </Badge>
                                  ) : (
                                    <Badge variant="outline" className="text-muted-foreground">
                                      <XCircle className="h-3 w-3 mr-1" />
                                      {t.unread}
                                    </Badge>
                                  )}
                                  {story.is_deleted && (
                                    <Badge variant="destructive">
                                      <Trash2 className="h-3 w-3 mr-1" />
                                      {t.deleted}
                                    </Badge>
                                  )}
                                </div>
                              </TableCell>
                            )}
                            {visibleColumns.has('theme') && (
                              <TableCell className="max-w-[120px] truncate" title={story.concrete_theme || ""}>
                                {story.concrete_theme || "-"}
                              </TableCell>
                            )}
                            {visibleColumns.has('emotionBlueprint') && (
                              <TableCell className="max-w-[120px] truncate" title={story.emotional_coloring || ""}>
                                {story.emotional_coloring || "-"}
                              </TableCell>
                            )}
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Feedback Tab */}
          <TabsContent value="feedback">
            {/* Filters and Actions */}
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">Filter</span>
                  </div>
                  {selectedFeedbackIds.size > 0 && (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={deleteSelectedFeedback}
                      disabled={isDeletingFeedback}
                    >
                      {isDeletingFeedback ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      {adminLang === 'de' ? `${selectedFeedbackIds.size} löschen` : 
                       adminLang === 'fr' ? `Supprimer ${selectedFeedbackIds.size}` : 
                       `Delete ${selectedFeedbackIds.size}`}
                    </Button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Select value={filterFeedbackKid} onValueChange={setFilterFeedbackKid}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t.child} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      {uniqueFeedbackKids.map(k => (
                        <SelectItem key={k} value={k!}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterRating} onValueChange={setFilterRating}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t.rating} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      {[1, 2, 3, 4, 5].map(r => (
                        <SelectItem key={r} value={r.toString()}>{r} ⭐</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {filteredRatings.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">{t.noData}</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-10">
                            <Checkbox
                              checked={filteredRatings.length > 0 && selectedFeedbackIds.size === filteredRatings.length}
                              onCheckedChange={toggleAllFeedback}
                            />
                          </TableHead>
                          <TableHead>{t.date}</TableHead>
                          <TableHead>{t.user}</TableHead>
                          <TableHead>{t.child}</TableHead>
                          <TableHead>{t.storyTitle}</TableHead>
                          <TableHead>{t.language}</TableHead>
                          <TableHead>{t.rating}</TableHead>
                          <TableHead></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRatings.map((rating) => (
                          <TableRow key={rating.id} className={selectedFeedbackIds.has(rating.id) ? "bg-muted/50" : ""}>
                            <TableCell>
                              <Checkbox
                                checked={selectedFeedbackIds.has(rating.id)}
                                onCheckedChange={() => toggleFeedbackSelection(rating.id)}
                              />
                            </TableCell>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(rating.created_at), "dd.MM.yyyy HH:mm")}
                            </TableCell>
                            <TableCell>{rating.username || "-"}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-medium">{rating.kid_name || "-"}</span>
                                {rating.kid_school_class && (
                                  <span className="text-xs text-muted-foreground">
                                    {rating.kid_school_class} ({rating.kid_school_system?.toUpperCase()})
                                  </span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate" title={rating.story_title}>
                              {rating.story_id ? (
                                <button
                                  onClick={() => openStoryPreview(rating.story_id!)}
                                  className="text-primary hover:underline cursor-pointer text-left"
                                >
                                  {rating.story_title}
                                </button>
                              ) : (
                                rating.story_title
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">{rating.text_language?.toUpperCase() || "-"}</Badge>
                            </TableCell>
                            <TableCell>{renderStars(rating.quality_rating)}</TableCell>
                            <TableCell>
                              {rating.weakness_reason && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setSelectedRating(rating)}
                                  className="h-8 w-8"
                                >
                                  <Eye className="h-4 w-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Consistency Check Tab */}
          <TabsContent value="consistency">
            <ConsistencyCheckStats language={(user?.adminLanguage || 'de') as Language} />
          </TabsContent>

          {/* Classification Tab */}
          <TabsContent value="classification">
            {sortedClassifications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">{t.noData}</p>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleClassificationSort("username")}
                          >
                            <div className="flex items-center">
                              {t.user}
                              <SortIcon column="username" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleClassificationSort("created_at")}
                          >
                            <div className="flex items-center">
                              {t.date}
                              <SortIcon column="created_at" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleClassificationSort("title")}
                          >
                            <div className="flex items-center">
                              {t.storyTitle}
                              <SortIcon column="title" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleClassificationSort("quality_rating")}
                          >
                            <div className="flex items-center">
                              {t.rating}
                              <SortIcon column="quality_rating" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleClassificationSort("structure_beginning")}
                          >
                            <div className="flex items-center">
                              {t.structureBeginning}
                              <SortIcon column="structure_beginning" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleClassificationSort("structure_middle")}
                          >
                            <div className="flex items-center">
                              {t.structureMiddle}
                              <SortIcon column="structure_middle" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleClassificationSort("structure_ending")}
                          >
                            <div className="flex items-center">
                              {t.structureEnding}
                              <SortIcon column="structure_ending" />
                            </div>
                          </TableHead>
                          <TableHead 
                            className="cursor-pointer hover:bg-muted/50"
                            onClick={() => handleClassificationSort("emotional_coloring")}
                          >
                            <div className="flex items-center">
                              {t.emotionalColoring}
                              <SortIcon column="emotional_coloring" />
                            </div>
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {sortedClassifications.map((item) => (
                          <TableRow key={item.id}>
                            <TableCell>{item.username || "-"}</TableCell>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(item.created_at), "dd.MM.yyyy")}
                            </TableCell>
                            <TableCell className="max-w-[200px] truncate font-medium" title={item.title}>
                              {item.title}
                            </TableCell>
                            <TableCell>
                              {item.quality_rating ? (
                                <Badge variant="outline">{item.quality_rating}/5</Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.structure_beginning ? (
                                <Badge variant={item.structure_beginning >= 4 ? "default" : item.structure_beginning >= 3 ? "secondary" : "destructive"}>
                                  {item.structure_beginning}/5
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.structure_middle ? (
                                <Badge variant={item.structure_middle >= 4 ? "default" : item.structure_middle >= 3 ? "secondary" : "destructive"}>
                                  {item.structure_middle}/5
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell>
                              {item.structure_ending ? (
                                <Badge variant={item.structure_ending >= 4 ? "default" : item.structure_ending >= 3 ? "secondary" : "destructive"}>
                                  {item.structure_ending}/5
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate" title={item.emotional_coloring || ""}>
                              {item.emotional_coloring || "-"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.performanceTab}</CardTitle>
              </CardHeader>
              <CardContent>
                {/* Filters */}
                <div className="flex flex-wrap gap-3 mb-4">
                  <Select value={perfFilterTextart} onValueChange={setPerfFilterTextart}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder={t.textType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      <SelectItem value="N">N (Normal)</SelectItem>
                      <SelectItem value="S">S (Kapitel-Abenteuer)</SelectItem>
                      <SelectItem value="SX">SX (Du entscheidest!)</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={perfFilterAge} onValueChange={setPerfFilterAge}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder="Alter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      {uniquePerfAges.map(age => (
                        <SelectItem key={age} value={String(age)}>{age} J.</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={perfFilterLength} onValueChange={setPerfFilterLength}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue placeholder={t.length} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      <SelectItem value="S">S</SelectItem>
                      <SelectItem value="M">M</SelectItem>
                      <SelectItem value="L">L</SelectItem>
                      <SelectItem value="XL">XL</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="cursor-pointer" onClick={() => handlePerfSort("created_at")}>
                          <div className="flex items-center">{t.date}<PerfSortIcon column="created_at" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer" onClick={() => handlePerfSort("username")}>
                          <div className="flex items-center">{t.user}<PerfSortIcon column="username" /></div>
                        </TableHead>
                        <TableHead>{t.language}</TableHead>
                        <TableHead>Alter</TableHead>
                        <TableHead>{t.length}</TableHead>
                        <TableHead className="text-center">✓ Text</TableHead>
                        <TableHead className="text-center">✓ Bilder</TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handlePerfSort("story_generation_ms")}>
                          <div className="flex items-center justify-end">⏱️ Story<PerfSortIcon column="story_generation_ms" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handlePerfSort("image_generation_ms")}>
                          <div className="flex items-center justify-end">🖼️ Bilder<PerfSortIcon column="image_generation_ms" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handlePerfSort("consistency_check_ms")}>
                          <div className="flex items-center justify-end">✅ Check<PerfSortIcon column="consistency_check_ms" /></div>
                        </TableHead>
                        <TableHead className="cursor-pointer text-right" onClick={() => handlePerfSort("generation_time_ms")}>
                          <div className="flex items-center justify-end font-semibold">Total<PerfSortIcon column="generation_time_ms" /></div>
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedPerformance.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-xs whitespace-nowrap">
                            {format(new Date(item.created_at), "dd.MM.yy HH:mm")}
                          </TableCell>
                          <TableCell className="text-xs">{item.username || '-'}</TableCell>
                          <TableCell className="text-xs uppercase">{item.text_language}</TableCell>
                          <TableCell className="text-xs">{item.kid_age ?? '-'}</TableCell>
                          <TableCell className="text-xs">
                            <Badge variant="outline" className="text-xs">{getLengthCode(item.story_length)}</Badge>
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {item.generation_status === 'verified' ? '✅' : item.generation_status === 'images_partial' ? '⚠️' : item.generation_status === 'images_failed' ? '🖼️❌' : item.generation_status === 'generating' ? '⏳' : '❌'}
                          </TableCell>
                          <TableCell className="text-xs text-center">
                            {item.cover_image_status === 'complete' && item.story_images_status === 'complete' ? '✅' : 
                             item.cover_image_status === 'pending' || item.story_images_status === 'pending' ? '❌' : '⏳'}
                          </TableCell>
                          <TableCell className="text-xs text-right font-mono">{fmtMs(item.story_generation_ms)}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{fmtMs(item.image_generation_ms)}</TableCell>
                          <TableCell className="text-xs text-right font-mono">{fmtMs(item.consistency_check_ms)}</TableCell>
                          <TableCell className="text-xs text-right font-mono font-semibold">{fmtMs(item.generation_time_ms)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Usage Stats Tab */}
          <TabsContent value="usage">
            <UsageStatsContent
              stories={stories}
              userProgressData={userProgressData}
              wordExplanationCounts={wordExplanationCounts}
              markedWordsCounts={markedWordsCounts}
              usageStartDate={usageStartDate}
              setUsageStartDate={setUsageStartDate}
            />
          </TabsContent>
        </Tabs>

        {/* Detail Dialog */}
        <Dialog open={!!selectedRating} onOpenChange={(open) => !open && setSelectedRating(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedRating?.story_title}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">{t.rating}:</span>
                {selectedRating && renderStars(selectedRating.quality_rating)}
              </div>
              {selectedRating?.kid_name && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">{t.child}:</span>
                  <span className="font-medium">{selectedRating.kid_name}</span>
                </div>
              )}
              {selectedRating?.weakness_reason && (
                <div className="space-y-2">
                  <span className="text-sm text-muted-foreground">Kommentar:</span>
                  <p className="bg-muted p-3 rounded-lg">{selectedRating.weakness_reason}</p>
                </div>
              )}
              <div className="text-xs text-muted-foreground">
                {selectedRating && format(new Date(selectedRating.created_at), "dd.MM.yyyy HH:mm")}
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Story Preview Dialog */}
        <Dialog open={!!previewStory || previewLoading} onOpenChange={(open) => { if (!open) { setPreviewStory(null); setPreviewLoading(false); } }}>
          <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{previewStory?.title || "Laden..."}</DialogTitle>
            </DialogHeader>
            {previewLoading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : previewStory ? (
              <div className="space-y-4">
                <StoryImage
                  src={previewStory.cover_image_url}
                  alt="Cover"
                  className="rounded-md mx-auto block"
                  style={{ maxWidth: 400 }}
                />
                <div className="prose prose-sm max-w-none whitespace-pre-line text-foreground">
                  {previewStory.content}
                </div>
                {previewStory.story_images && previewStory.story_images.length > 0 && (
                  <div className="space-y-3 pt-4 border-t">
                    <h4 className="text-sm font-medium text-muted-foreground">Bilder</h4>
                    {previewStory.story_images.map((img, i) => (
                      <StoryImage
                        key={i}
                        src={img}
                        alt={`Scene ${i + 1}`}
                        className="rounded-md mx-auto block"
                        style={{ maxWidth: 400 }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : null}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default FeedbackStatsPage;
