import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useColorPalette } from "@/hooks/useColorPalette";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Loader2, TrendingDown, BookOpen, CheckCircle, XCircle, Trash2, Filter, MessageSquare, BookMarked } from "lucide-react";
import { format } from "date-fns";
import { Language } from "@/lib/translations";

interface StoryRating {
  id: string;
  story_title: string;
  story_prompt: string | null;
  kid_name: string | null;
  kid_school_class: string | null;
  kid_school_system: string | null;
  quality_rating: number;
  weakest_part: string | null;
  weakness_reason: string | null;
  created_at: string;
}

interface StoryStats {
  id: string;
  title: string;
  prompt: string | null;
  difficulty: string | null;
  text_type: string | null;
  is_deleted: boolean;
  created_at: string;
  user_id: string | null;
  kid_profile_id: string | null;
  kid_name?: string;
  kid_school_class?: string;
  kid_school_system?: string;
  username?: string;
  is_read: boolean;
  words_requested: number;
  words_saved: number;
  has_feedback: boolean;
  questions_answered: number;
  questions_total: number;
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
  },
};

const FeedbackStatsPage = () => {
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const [ratings, setRatings] = useState<StoryRating[]>([]);
  const [stories, setStories] = useState<StoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stories");

  // Filter states for stories
  const [filterUser, setFilterUser] = useState<string>("all");
  const [filterKid, setFilterKid] = useState<string>("all");
  const [filterTextType, setFilterTextType] = useState<string>("all");
  const [filterDifficulty, setFilterDifficulty] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterTitle, setFilterTitle] = useState<string>("");
  const [filterJaiFini, setFilterJaiFini] = useState<string>("all");
  const [filterQuestionsAnswered, setFilterQuestionsAnswered] = useState<string>("all");

  // Filter states for feedback
  const [filterFeedbackKid, setFilterFeedbackKid] = useState<string>("all");
  const [filterRating, setFilterRating] = useState<string>("all");
  const [filterWeakestPart, setFilterWeakestPart] = useState<string>("all");

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
      .order("created_at", { ascending: false });

    if (ratingsData) {
      setRatings(ratingsData);
    }

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
        is_deleted,
        created_at,
        user_id,
        kid_profile_id,
        kid_profiles (
          name,
          school_class,
          school_system
        )
      `)
      .order("created_at", { ascending: false });

    // Load user results to check which stories have been read
    const { data: resultsData } = await supabase
      .from("user_results")
      .select("reference_id")
      .eq("activity_type", "story_completed");

    const readStoryIds = new Set(resultsData?.map(r => r.reference_id) || []);

    // Load comprehension results (questions answered per story)
    const { data: comprehensionResults } = await supabase
      .from("user_results")
      .select("reference_id, total_questions, correct_answers")
      .eq("activity_type", "story_completed");

    const comprehensionPerStory = new Map<string, { answered: number; total: number }>();
    comprehensionResults?.forEach(r => {
      if (r.reference_id && r.total_questions) {
        comprehensionPerStory.set(r.reference_id, {
          answered: r.total_questions, // All questions answered if quiz completed
          total: r.total_questions,
        });
      }
    });

    // Load comprehension questions count per story (for stories without results)
    const { data: questionsData } = await supabase
      .from("comprehension_questions")
      .select("story_id");

    const questionsPerStory = new Map<string, number>();
    questionsData?.forEach(q => {
      questionsPerStory.set(q.story_id, (questionsPerStory.get(q.story_id) || 0) + 1);
    });

    // Load marked words per story
    const { data: markedWordsData } = await supabase
      .from("marked_words")
      .select("story_id, explanation");

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
    const { data: usersData } = await supabase.functions.invoke("manage-users", {
      body: { action: "list" },
    });

    const usersMap = new Map<string, string>();
    if (usersData?.users) {
      usersData.users.forEach((u: { id: string; username: string }) => {
        usersMap.set(u.id, u.username);
      });
    }

    if (storiesData) {
      const mappedStories: StoryStats[] = storiesData.map((story: any) => {
        const wordStats = wordsPerStory.get(story.id) || { requested: 0, saved: 0 };
        const comprehensionStats = comprehensionPerStory.get(story.id);
        const totalQuestions = questionsPerStory.get(story.id) || 0;
        
        return {
          id: story.id,
          title: story.title,
          prompt: story.prompt,
          difficulty: story.difficulty,
          text_type: story.text_type,
          is_deleted: story.is_deleted || false,
          created_at: story.created_at,
          user_id: story.user_id,
          kid_profile_id: story.kid_profile_id,
          kid_name: story.kid_profiles?.name,
          kid_school_class: story.kid_profiles?.school_class,
          kid_school_system: story.kid_profiles?.school_system,
          username: story.user_id ? usersMap.get(story.user_id) : undefined,
          is_read: readStoryIds.has(story.id),
          words_requested: wordStats.requested,
          words_saved: wordStats.saved,
          has_feedback: feedbackStoryIds.has(story.id),
          questions_answered: comprehensionStats?.answered || 0,
          questions_total: comprehensionStats?.total || totalQuestions,
        };
      });
      setStories(mappedStories);
    }

    setIsLoading(false);
  };

  // Get unique values for filters
  const uniqueUsers = useMemo(() => [...new Set(stories.map(s => s.username).filter(Boolean))], [stories]);
  const uniqueKids = useMemo(() => [...new Set(stories.map(s => s.kid_name).filter(Boolean))], [stories]);
  const uniqueFeedbackKids = useMemo(() => [...new Set(ratings.map(r => r.kid_name).filter(Boolean))], [ratings]);

  // Filtered stories
  const filteredStories = useMemo(() => {
    return stories.filter(story => {
      if (filterUser !== "all" && story.username !== filterUser) return false;
      if (filterKid !== "all" && story.kid_name !== filterKid) return false;
      if (filterTextType !== "all" && story.text_type !== filterTextType) return false;
      if (filterDifficulty !== "all" && story.difficulty !== filterDifficulty) return false;
      if (filterStatus === "read" && !story.is_read) return false;
      if (filterStatus === "unread" && story.is_read) return false;
      if (filterStatus === "deleted" && !story.is_deleted) return false;
      if (filterStatus === "active" && story.is_deleted) return false;
      if (filterTitle && !story.title.toLowerCase().includes(filterTitle.toLowerCase())) return false;
      if (filterJaiFini === "yes" && !story.has_feedback) return false;
      if (filterJaiFini === "no" && story.has_feedback) return false;
      if (filterQuestionsAnswered === "answered" && story.questions_answered === 0) return false;
      if (filterQuestionsAnswered === "not_answered" && (story.questions_answered > 0 || story.questions_total === 0)) return false;
      if (filterQuestionsAnswered === "no_questions" && story.questions_total > 0) return false;
      return true;
    });
  }, [stories, filterUser, filterKid, filterTextType, filterDifficulty, filterStatus, filterTitle, filterJaiFini, filterQuestionsAnswered]);

  // Filtered ratings
  const filteredRatings = useMemo(() => {
    return ratings.filter(rating => {
      if (filterFeedbackKid !== "all" && rating.kid_name !== filterFeedbackKid) return false;
      if (filterRating !== "all" && rating.quality_rating !== parseInt(filterRating)) return false;
      if (filterWeakestPart !== "all" && rating.weakest_part !== filterWeakestPart) return false;
      return true;
    });
  }, [ratings, filterFeedbackKid, filterRating, filterWeakestPart]);

  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.quality_rating, 0) / ratings.length).toFixed(1)
    : "0";

  const totalWordsRequested = stories.reduce((sum, s) => sum + s.words_requested, 0);
  const totalWordsSaved = stories.reduce((sum, s) => sum + s.words_saved, 0);

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

  const storiesRead = stories.filter(s => s.is_read).length;

  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} flex items-center justify-center`}>
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg}`}>
      <div className="container max-w-7xl mx-auto px-4 py-8">
        <PageHeader title={t.title} backTo="/" />
        <p className="text-muted-foreground mb-6">{t.subtitle}</p>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.totalStories}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-primary" />
                <span className="text-2xl font-bold">{stories.length}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.storiesRead}
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
                {t.wordsRequested}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5 text-sky-500" />
                <span className="text-2xl font-bold">{totalWordsRequested}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.wordsSaved}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <BookMarked className="h-5 w-5 text-violet-500" />
                <span className="text-2xl font-bold">{totalWordsSaved}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.avgRating}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 fill-sunshine text-sunshine" />
                <span className="text-2xl font-bold">{avgRating}</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {t.mostCommonIssue}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-5 w-5 text-cotton-candy" />
                <span className="text-sm font-medium truncate">
                  {mostCommonIssue ? translateReason(mostCommonIssue) : "-"}
                </span>
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
          </TabsList>

          {/* Stories Tab */}
          <TabsContent value="stories">
            {/* Filters */}
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <Input
                    placeholder={t.storyTitle}
                    value={filterTitle}
                    onChange={(e) => setFilterTitle(e.target.value)}
                    className="h-9"
                  />
                  <Select value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t.user} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      {uniqueUsers.map(u => (
                        <SelectItem key={u} value={u!}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterKid} onValueChange={setFilterKid}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t.child} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      {uniqueKids.map(k => (
                        <SelectItem key={k} value={k!}>{k}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterTextType} onValueChange={setFilterTextType}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t.textType} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      <SelectItem value="fiction">{t.fiction}</SelectItem>
                      <SelectItem value="non-fiction">{t.nonFiction}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterDifficulty} onValueChange={setFilterDifficulty}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t.difficulty} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      <SelectItem value="easy">{t.easy}</SelectItem>
                      <SelectItem value="medium">{t.medium}</SelectItem>
                      <SelectItem value="difficult">{t.hard}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t.status} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      <SelectItem value="read">{t.read}</SelectItem>
                      <SelectItem value="unread">{t.unread}</SelectItem>
                      <SelectItem value="active">{t.active}</SelectItem>
                      <SelectItem value="deleted">{t.deleted}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterJaiFini} onValueChange={setFilterJaiFini}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t.jaiFini} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      <SelectItem value="yes">{t.yes}</SelectItem>
                      <SelectItem value="no">{t.no}</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterQuestionsAnswered} onValueChange={setFilterQuestionsAnswered}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t.questionsAnswered} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      <SelectItem value="answered">{t.answered}</SelectItem>
                      <SelectItem value="not_answered">{t.notAnswered}</SelectItem>
                      <SelectItem value="no_questions">{t.noQuestions}</SelectItem>
                    </SelectContent>
                  </Select>
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
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t.date}</TableHead>
                          <TableHead>{t.user}</TableHead>
                          <TableHead>{t.child}</TableHead>
                          <TableHead>{t.storyTitle}</TableHead>
                          <TableHead>{t.prompt}</TableHead>
                          <TableHead>{t.textType}</TableHead>
                          <TableHead>{t.difficulty}</TableHead>
                          <TableHead>{t.words}</TableHead>
                          <TableHead>{t.jaiFini}</TableHead>
                          <TableHead>{t.questionsAnswered}</TableHead>
                          <TableHead>{t.status}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredStories.map((story) => (
                          <TableRow key={story.id} className={story.is_deleted ? "opacity-50" : ""}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(story.created_at), "dd.MM.yyyy")}
                            </TableCell>
                            <TableCell>{story.username || "-"}</TableCell>
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
                            <TableCell className="max-w-[200px] truncate font-medium" title={story.title}>
                              {story.title}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate text-muted-foreground" title={story.prompt || ""}>
                              {story.prompt || "-"}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {translateTextType(story.text_type)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge variant={
                                story.difficulty === "easy" ? "secondary" :
                                story.difficulty === "difficult" ? "destructive" : "default"
                              }>
                                {translateDifficulty(story.difficulty)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col text-sm">
                                <span className="flex items-center gap-1">
                                  <MessageSquare className="h-3 w-3 text-sky-500" />
                                  {story.words_requested}
                                </span>
                                <span className="flex items-center gap-1 text-muted-foreground">
                                  <BookMarked className="h-3 w-3 text-violet-500" />
                                  {story.words_saved}
                                </span>
                              </div>
                            </TableCell>
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
                            <TableCell>
                              {story.questions_total > 0 ? (
                                <Badge variant={story.questions_answered > 0 ? "default" : "outline"}>
                                  {story.questions_answered}/{story.questions_total}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
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
            {/* Filters */}
            <Card className="mb-4">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-3">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Filter</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                  <Select value={filterWeakestPart} onValueChange={setFilterWeakestPart}>
                    <SelectTrigger className="h-9">
                      <SelectValue placeholder={t.weakestPart} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">{t.all}</SelectItem>
                      <SelectItem value="beginning">{t.beginning}</SelectItem>
                      <SelectItem value="development">{t.development}</SelectItem>
                      <SelectItem value="ending">{t.ending}</SelectItem>
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
                          <TableHead>{t.date}</TableHead>
                          <TableHead>{t.child}</TableHead>
                          <TableHead>{t.storyTitle}</TableHead>
                          <TableHead>{t.prompt}</TableHead>
                          <TableHead>{t.rating}</TableHead>
                          <TableHead>{t.weakestPart}</TableHead>
                          <TableHead>{t.reason}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredRatings.map((rating) => (
                          <TableRow key={rating.id}>
                            <TableCell className="whitespace-nowrap">
                              {format(new Date(rating.created_at), "dd.MM.yyyy HH:mm")}
                            </TableCell>
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
                              {rating.story_title}
                            </TableCell>
                            <TableCell className="max-w-[150px] truncate" title={rating.story_prompt || ""}>
                              {rating.story_prompt || "-"}
                            </TableCell>
                            <TableCell>{renderStars(rating.quality_rating)}</TableCell>
                            <TableCell>{translateWeakestPart(rating.weakest_part)}</TableCell>
                            <TableCell>{translateReason(rating.weakness_reason)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default FeedbackStatsPage;
