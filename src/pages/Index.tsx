import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { BookOpen, Settings, Sparkles, Star, Brain, Trophy, Hand, Users, BarChart3, QrCode, Album } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useColorPalette } from "@/hooks/useColorPalette";
import { useKidProfile } from "@/hooks/useKidProfile";
import { Language } from "@/lib/translations";
import heroImage from "@/assets/hero-reading.jpg";
import ScanStoryButton from "@/components/story-sharing/ScanStoryButton";

// Home page translations
const homeTranslations: Record<Language, {
  greeting: string;
  subtitle: string;
  readStory: string;
  readStoryDesc: string;
  createOwnStory: string;
  createOwnStoryDesc: string;
  wordQuiz: string;
  wordQuizDesc: string;
  myResults: string;
  myResultsDesc: string;
  myCollection: string;
  myCollectionDesc: string;
  footer: string;
  appName: string;
  newBadge: string;
  scanStory: string;
}> = {
  de: {
    greeting: 'Hallo',
    subtitle: 'Lerne lesen mit Freude! ✨',
    readStory: 'Eine Geschichte lesen',
    readStoryDesc: 'Lies und lerne neue Wörter',
    createOwnStory: 'Eigene Geschichte',
    createOwnStoryDesc: 'Erzähle deine Idee!',
    wordQuiz: 'Wörter-Quiz',
    wordQuizDesc: 'Teste dein Vokabular',
    myResults: 'Meine Ergebnisse',
    myResultsDesc: 'Punkte und Fortschritt',
    myCollection: 'Sammelalbum',
    myCollectionDesc: 'Deine Schätze',
    footer: 'Mit ❤️ für kleine Leser gemacht',
    appName: 'LeseMagie',
    newBadge: 'Neu',
    scanStory: 'Geschichte scannen',
  },
  fr: {
    greeting: 'Salut',
    subtitle: 'Apprends à lire avec plaisir! ✨',
    readStory: 'Lire une Histoire',
    readStoryDesc: 'Lis et apprends de nouveaux mots',
    createOwnStory: 'Ma propre histoire',
    createOwnStoryDesc: 'Raconte ton idée!',
    wordQuiz: 'Quiz des Mots',
    wordQuizDesc: 'Teste ton vocabulaire',
    myResults: 'Mes Résultats',
    myResultsDesc: 'Points et progrès',
    myCollection: 'Ma Collection',
    myCollectionDesc: 'Tes trésors',
    footer: 'Fait avec ❤️ pour les petits lecteurs',
    appName: 'LireMagie',
    newBadge: 'Nouveau',
    scanStory: 'Scanner une histoire',
  },
  en: {
    greeting: 'Hello',
    subtitle: 'Learn to read with joy! ✨',
    readStory: 'Read a Story',
    readStoryDesc: 'Read and learn new words',
    createOwnStory: 'Create Your Story',
    createOwnStoryDesc: 'Tell your idea!',
    wordQuiz: 'Word Quiz',
    wordQuizDesc: 'Test your vocabulary',
    myResults: 'My Results',
    myResultsDesc: 'Points and progress',
    myCollection: 'My Collection',
    myCollectionDesc: 'Your treasures',
    footer: 'Made with ❤️ for little readers',
    appName: 'ReadMagic',
    newBadge: 'New',
    scanStory: 'Scan Story',
  },
  es: {
    greeting: 'Hola',
    subtitle: '¡Aprende a leer con alegría! ✨',
    readStory: 'Leer una Historia',
    readStoryDesc: 'Lee y aprende palabras nuevas',
    createOwnStory: 'Mi propia historia',
    createOwnStoryDesc: '¡Cuenta tu idea!',
    wordQuiz: 'Quiz de Palabras',
    wordQuizDesc: 'Pon a prueba tu vocabulario',
    myResults: 'Mis Resultados',
    myResultsDesc: 'Puntos y progreso',
    myCollection: 'Mi Colección',
    myCollectionDesc: 'Tus tesoros',
    footer: 'Hecho con ❤️ para pequeños lectores',
    appName: 'LeerMagia',
    newBadge: 'Nuevo',
    scanStory: 'Escanear historia',
  },
  nl: {
    greeting: 'Hallo',
    subtitle: 'Leer lezen met plezier! ✨',
    readStory: 'Een Verhaal Lezen',
    readStoryDesc: 'Lees en leer nieuwe woorden',
    createOwnStory: 'Eigen verhaal',
    createOwnStoryDesc: 'Vertel je idee!',
    wordQuiz: 'Woordenquiz',
    wordQuizDesc: 'Test je woordenschat',
    myResults: 'Mijn Resultaten',
    myResultsDesc: 'Punten en voortgang',
    myCollection: 'Mijn Album',
    myCollectionDesc: 'Jouw schatten',
    footer: 'Gemaakt met ❤️ voor kleine lezers',
    appName: 'LeesMagie',
    newBadge: 'Nieuw',
    scanStory: 'Verhaal scannen',
  },
  it: {
    greeting: 'Ciao',
    subtitle: 'Impara a leggere con gioia! ✨',
    readStory: 'Leggi una Storia',
    readStoryDesc: 'Leggi e impara nuove parole',
    createOwnStory: 'La mia storia',
    createOwnStoryDesc: 'Racconta la tua idea!',
    wordQuiz: 'Quiz delle Parole',
    wordQuizDesc: 'Metti alla prova il tuo vocabolario',
    myResults: 'I Miei Risultati',
    myResultsDesc: 'Punti e progressi',
    myCollection: 'La Mia Collezione',
    myCollectionDesc: 'I tuoi tesori',
    footer: 'Fatto con ❤️ per i piccoli lettori',
    appName: 'LeggiMagia',
    newBadge: 'Nuovo',
    scanStory: 'Scansiona storia',
  },
  bs: {
    greeting: 'Zdravo',
    subtitle: 'Nauči čitati s radošću! ✨',
    readStory: 'Pročitaj priču',
    readStoryDesc: 'Čitaj i uči nove riječi',
    createOwnStory: 'Moja priča',
    createOwnStoryDesc: 'Ispričaj svoju ideju!',
    wordQuiz: 'Kviz riječi',
    wordQuizDesc: 'Testiraj svoj vokabular',
    myResults: 'Moji rezultati',
    myResultsDesc: 'Bodovi i napredak',
    myCollection: 'Moja Kolekcija',
    myCollectionDesc: 'Tvoja blaga',
    footer: 'Napravljeno s ❤️ za male čitače',
    appName: 'ČitajMagija',
    newBadge: 'Novo',
    scanStory: 'Skeniraj priču',
  },
};

const Index = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { colors: paletteColors } = useColorPalette();
  const { 
    kidProfiles, 
    selectedProfileId, 
    selectedProfile, 
    setSelectedProfileId, 
    hasMultipleProfiles,
    kidAppLanguage,
    isLoading,
  } = useKidProfile();

  const t = homeTranslations[kidAppLanguage] || homeTranslations.fr;

  // Show nothing while loading to prevent flash of default content
  if (isLoading) {
    return (
      <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} flex items-center justify-center`}>
        <div className="animate-pulse flex flex-col items-center gap-4">
          <Star className="h-12 w-12 text-primary animate-spin" />
        </div>
      </div>
    );
  }

  const displayImage = selectedProfile?.cover_image_url || heroImage;
  const childName = selectedProfile?.name;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${paletteColors.bg} overflow-hidden`}>
      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute top-10 left-10 w-20 h-20 ${paletteColors.accent} rounded-full blur-2xl animate-bounce-soft`} />
        <div className={`absolute top-40 right-20 w-32 h-32 ${paletteColors.accent} rounded-full blur-3xl animate-bounce-soft`} style={{ animationDelay: "0.5s" }} />
        <div className={`absolute bottom-40 left-1/4 w-24 h-24 ${paletteColors.accent} rounded-full blur-2xl animate-bounce-soft`} style={{ animationDelay: "1s" }} />
      </div>

      <div className={`relative container max-w-4xl mx-auto px-4 ${hasMultipleProfiles ? 'py-4 md:py-6' : 'py-8 md:py-12'} flex flex-col items-center min-h-screen`}>
        {/* Top Right Icons */}
        <div className="absolute top-4 right-4 flex items-center gap-2">
          {/* Scan QR Button */}
          <ScanStoryButton 
            language={kidAppLanguage} 
            onImportSuccess={(storyId) => navigate(`/read/${storyId}`)}
          />
          {user?.role === 'admin' && (
            <button
              onClick={() => navigate("/feedback-stats")}
              className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
              title={kidAppLanguage === 'de' ? 'Story-Statistiken' : kidAppLanguage === 'fr' ? 'Statistiques' : 'Statistics'}
            >
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </button>
          )}
          <button
            onClick={() => navigate("/words")}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
            title={kidAppLanguage === 'de' ? 'Wörter verwalten' : kidAppLanguage === 'fr' ? 'Gérer les mots' : 'Manage words'}
          >
            <Hand className="h-5 w-5 text-muted-foreground" />
          </button>
          <button
            onClick={() => navigate("/admin")}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm border border-border hover:bg-muted transition-colors"
            title="Admin"
          >
            <Settings className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Hero Section */}
        <div className="flex-1 flex flex-col items-center justify-center text-center">
          {/* Logo / Title */}
          <div className={`${hasMultipleProfiles ? 'mb-3' : 'mb-6'} flex items-center gap-2`}>
            <Star className="h-8 w-8 text-primary animate-sparkle" />
            <Star className="h-6 w-6 text-cotton-candy animate-sparkle" style={{ animationDelay: "0.3s" }} />
            <Star className="h-8 w-8 text-primary animate-sparkle" style={{ animationDelay: "0.6s" }} />
          </div>

          <h1 className={`${hasMultipleProfiles ? 'text-4xl md:text-5xl mb-2' : 'text-5xl md:text-7xl mb-4'} font-baloo font-bold text-foreground tracking-tight`}>
            {childName ? `${t.greeting} ${childName}!` : t.appName}
          </h1>
          
          <p className={`${hasMultipleProfiles ? 'text-lg md:text-xl mb-3' : 'text-xl md:text-2xl mb-6'} text-muted-foreground font-nunito`}>
            {t.subtitle}
          </p>

          {/* Profile Selector - compact horizontal when multiple kids */}
          {hasMultipleProfiles && (
            <div className="flex items-center justify-center gap-2 mb-4">
              {kidProfiles.map((profile) => (
                <button
                  key={profile.id}
                  onClick={() => setSelectedProfileId(profile.id)}
                  className={`
                    flex items-center gap-2 px-3 py-1.5 rounded-full transition-all duration-200
                    ${selectedProfileId === profile.id 
                      ? 'bg-primary/20 ring-2 ring-primary' 
                      : 'bg-card/60 hover:bg-card/80'
                    }
                  `}
                >
                  <div className={`
                    w-8 h-8 rounded-full overflow-hidden border-2 flex-shrink-0
                    ${selectedProfileId === profile.id ? 'border-primary' : 'border-border'}
                  `}>
                    {profile.cover_image_url ? (
                      <img 
                        src={profile.cover_image_url} 
                        alt={profile.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <Users className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <span className={`
                    text-sm font-medium whitespace-nowrap
                    ${selectedProfileId === profile.id ? 'text-primary' : 'text-muted-foreground'}
                  `}>
                    {profile.name}
                  </span>
                </button>
              ))}
            </div>
          )}

          {/* Hero Image - smaller when multiple profiles */}
          <div className={`relative w-full ${hasMultipleProfiles ? 'max-w-md mb-4' : 'max-w-2xl mb-6'}`}>
            <div className={`absolute inset-0 ${paletteColors.primary} rounded-2xl blur-2xl transform scale-105`} />
            <img
              src={displayImage}
              alt="Magical reading adventure"
              className={`relative w-full h-auto rounded-2xl shadow-card object-cover ${hasMultipleProfiles ? 'max-h-[20vh]' : 'max-h-[30vh]'}`}
            />
          </div>

          {/* Navigation Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
            {/* Read a Story */}
            <Card 
              onClick={() => navigate("/stories")}
              className="cursor-pointer border-2 border-primary/30 hover:border-primary hover:shadow-card transition-all duration-300 group touch-manipulation"
            >
              <CardContent className="flex flex-col items-center p-4 md:p-6 text-center">
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-primary/20 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                  <BookOpen className="h-7 w-7 md:h-8 md:w-8 text-primary" />
                </div>
                <h3 className="font-baloo font-bold text-base md:text-lg mb-1">{t.readStory}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{t.readStoryDesc}</p>
              </CardContent>
            </Card>

            {/* Create Own Story - NEW */}
            <Card 
              onClick={() => navigate("/create-story")}
              className="cursor-pointer border-2 border-pink-400 hover:border-pink-500 hover:shadow-card transition-all duration-300 group touch-manipulation relative overflow-visible"
            >
              {/* NEW Badge */}
              <div className="absolute -top-2 -right-2 z-10">
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-lg">
                  ✨ {t.newBadge}
                </span>
              </div>
              <CardContent className="flex flex-col items-center p-4 md:p-6 text-center">
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-cotton-candy/30 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                  <Sparkles className="h-7 w-7 md:h-8 md:w-8 text-pink-500" />
                </div>
                <h3 className="font-baloo font-bold text-base md:text-lg mb-1">{t.createOwnStory}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{t.createOwnStoryDesc}</p>
              </CardContent>
            </Card>

            {/* Word Quiz */}
            <Card 
              onClick={() => navigate("/quiz")}
              className="cursor-pointer border-2 border-accent/30 hover:border-accent hover:shadow-card transition-all duration-300 group touch-manipulation"
            >
              <CardContent className="flex flex-col items-center p-4 md:p-6 text-center">
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-accent/20 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                  <Brain className="h-7 w-7 md:h-8 md:w-8 text-accent-foreground" />
                </div>
                <h3 className="font-baloo font-bold text-base md:text-lg mb-1">{t.wordQuiz}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{t.wordQuizDesc}</p>
              </CardContent>
            </Card>

            {/* My Results */}
            <Card 
              onClick={() => navigate("/results")}
              className="cursor-pointer border-2 border-sunshine/50 hover:border-sunshine hover:shadow-card transition-all duration-300 group touch-manipulation"
            >
              <CardContent className="flex flex-col items-center p-4 md:p-6 text-center">
                <div className="h-14 w-14 md:h-16 md:w-16 rounded-full bg-sunshine/30 flex items-center justify-center mb-3 md:mb-4 group-hover:scale-110 transition-transform">
                  <Trophy className="h-7 w-7 md:h-8 md:w-8 text-amber-600" />
                </div>
                <h3 className="font-baloo font-bold text-base md:text-lg mb-1">{t.myResults}</h3>
                <p className="text-xs md:text-sm text-muted-foreground">{t.myResultsDesc}</p>
              </CardContent>
            </Card>
          </div>

          {/* Collection Card - centered below */}
          <div className="mt-4 w-full max-w-xs">
            <Card 
              onClick={() => navigate("/collection")}
              className="cursor-pointer border-2 border-secondary/30 hover:border-secondary hover:shadow-card transition-all duration-300 group touch-manipulation"
            >
              <CardContent className="flex items-center gap-4 p-4">
                <div className="h-12 w-12 rounded-full bg-secondary/20 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                  <span className="text-2xl">🏆</span>
                </div>
                <div className="text-left">
                  <h3 className="font-baloo font-bold text-base">{t.myCollection}</h3>
                  <p className="text-xs text-muted-foreground">{t.myCollectionDesc}</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-auto pt-8 pb-4 text-center">
          <p className="text-sm text-muted-foreground/60">
            {t.footer}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
