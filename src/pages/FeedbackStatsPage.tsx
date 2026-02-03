import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useColorPalette } from "@/hooks/useColorPalette";
import PageHeader from "@/components/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Star, Loader2, TrendingDown, BarChart3, BookOpen, CheckCircle, XCircle, Trash2 } from "lucide-react";
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
  },
};

const FeedbackStatsPage = () => {
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const [ratings, setRatings] = useState<StoryRating[]>([]);
  const [stories, setStories] = useState<StoryStats[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("stories");

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

    // Load stories with kid profiles and check read status
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
      const mappedStories: StoryStats[] = storiesData.map((story: any) => ({
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
      }));
      setStories(mappedStories);
    }

    setIsLoading(false);
  };

  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.quality_rating, 0) / ratings.length).toFixed(1)
    : "0";

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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
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
                <span className="text-muted-foreground text-sm">/ {stories.length}</span>
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
                <span className="text-muted-foreground">/ 5</span>
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
                <span className="text-lg font-medium">
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
              {t.storiesTab}
            </TabsTrigger>
            <TabsTrigger value="feedback" className="flex items-center gap-2">
              <Star className="h-4 w-4" />
              {t.feedbackTab}
            </TabsTrigger>
          </TabsList>

          {/* Stories Tab */}
          <TabsContent value="stories">
            {stories.length === 0 ? (
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
                          <TableHead>{t.status}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {stories.map((story) => (
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
            {ratings.length === 0 ? (
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
                        {ratings.map((rating) => (
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
