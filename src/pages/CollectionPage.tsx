import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Users, ArrowLeft, Sparkles } from "lucide-react";
import { useKidProfile } from "@/hooks/useKidProfile";
import { useCollection, CollectibleCategory, Rarity } from "@/hooks/useCollection";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";

// Translations
const collectionTranslations: Record<string, {
  title: string;
  total: string;
  collected: string;
  empty: string;
  emptyHint: string;
  readStory: string;
  all: string;
  creatures: string;
  places: string;
  objects: string;
  stars: string;
  rarity: Record<Rarity, string>;
}> = {
  de: {
    title: "Mein Sammelalbum",
    total: "Gesammelt",
    collected: "{n} Objekte",
    empty: "Noch keine Sammlung",
    emptyHint: "Lies Geschichten, um magische Objekte zu sammeln!",
    readStory: "Geschichte lesen",
    all: "Alle",
    creatures: "Wesen",
    places: "Orte",
    objects: "Objekte",
    stars: "Sterne",
    rarity: { common: "Gewöhnlich", rare: "Selten", epic: "Episch", legendary: "Legendär" }
  },
  fr: {
    title: "Mon Album",
    total: "Collectionnés",
    collected: "{n} objets",
    empty: "Pas encore de collection",
    emptyHint: "Lis des histoires pour collecter des objets magiques!",
    readStory: "Lire une histoire",
    all: "Tous",
    creatures: "Créatures",
    places: "Lieux",
    objects: "Objets",
    stars: "Étoiles",
    rarity: { common: "Commun", rare: "Rare", epic: "Épique", legendary: "Légendaire" }
  },
  en: {
    title: "My Collection",
    total: "Collected",
    collected: "{n} items",
    empty: "No collection yet",
    emptyHint: "Read stories to collect magical items!",
    readStory: "Read a story",
    all: "All",
    creatures: "Creatures",
    places: "Places",
    objects: "Objects",
    stars: "Stars",
    rarity: { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" }
  },
  es: {
    title: "Mi Álbum",
    total: "Coleccionados",
    collected: "{n} objetos",
    empty: "Aún no hay colección",
    emptyHint: "¡Lee historias para coleccionar objetos mágicos!",
    readStory: "Leer una historia",
    all: "Todos",
    creatures: "Criaturas",
    places: "Lugares",
    objects: "Objetos",
    stars: "Estrellas",
    rarity: { common: "Común", rare: "Raro", epic: "Épico", legendary: "Legendario" }
  },
  nl: {
    title: "Mijn Album",
    total: "Verzameld",
    collected: "{n} voorwerpen",
    empty: "Nog geen collectie",
    emptyHint: "Lees verhalen om magische voorwerpen te verzamelen!",
    readStory: "Verhaal lezen",
    all: "Alle",
    creatures: "Wezens",
    places: "Plaatsen",
    objects: "Voorwerpen",
    stars: "Sterren",
    rarity: { common: "Gewoon", rare: "Zeldzaam", epic: "Episch", legendary: "Legendarisch" }
  },
  bs: { title: "Moj Album", total: "Sakupljeno", collected: "{n} predmeta", empty: "Još nema kolekcije", emptyHint: "Čitaj priče da sakupiš magične predmete!", readStory: "Čitaj priču", all: "Sve", creatures: "Bića", places: "Mjesta", objects: "Predmeti", stars: "Zvijezde", rarity: { common: "Obično", rare: "Rijetko", epic: "Epsko", legendary: "Legendarno" } },
  tr: { title: "Albümüm", total: "Toplanan", collected: "{n} nesne", empty: "Henüz koleksiyon yok", emptyHint: "Hikâye oku ve sihirli nesneler topla!", readStory: "Hikâye oku", all: "Tümü", creatures: "Yaratıklar", places: "Yerler", objects: "Nesneler", stars: "Yıldızlar", rarity: { common: "Yaygın", rare: "Nadir", epic: "Epik", legendary: "Efsanevi" } },
  bg: { title: "Моят Албум", total: "Събрани", collected: "{n} предмета", empty: "Все още няма колекция", emptyHint: "Чети истории, за да събереш магически предмети!", readStory: "Чети история", all: "Всички", creatures: "Създания", places: "Места", objects: "Предмети", stars: "Звезди", rarity: { common: "Обикновен", rare: "Рядък", epic: "Епичен", legendary: "Легендарен" } },
  ro: { title: "Albumul Meu", total: "Colecționate", collected: "{n} obiecte", empty: "Încă nu ai colecție", emptyHint: "Citește povești pentru a colecta obiecte magice!", readStory: "Citește", all: "Toate", creatures: "Creaturi", places: "Locuri", objects: "Obiecte", stars: "Stele", rarity: { common: "Comun", rare: "Rar", epic: "Epic", legendary: "Legendar" } },
  pl: { title: "Mój Album", total: "Zebrane", collected: "{n} przedmiotów", empty: "Jeszcze brak kolekcji", emptyHint: "Czytaj historie, aby zbierać magiczne przedmioty!", readStory: "Czytaj", all: "Wszystko", creatures: "Stworzenia", places: "Miejsca", objects: "Przedmioty", stars: "Gwiazdki", rarity: { common: "Zwykły", rare: "Rzadki", epic: "Epicki", legendary: "Legendarny" } },
  lt: { title: "Mano Albumas", total: "Surinkta", collected: "{n} daiktų", empty: "Kolekcijos dar nėra", emptyHint: "Skaityk istorijas ir rink magiškus daiktus!", readStory: "Skaityti", all: "Visi", creatures: "Būtybės", places: "Vietos", objects: "Daiktai", stars: "Žvaigždės", rarity: { common: "Įprastas", rare: "Retas", epic: "Epinis", legendary: "Legendinis" } },
  hu: { title: "Az Albumom", total: "Összegyűjtve", collected: "{n} tárgy", empty: "Még nincs gyűjtemény", emptyHint: "Olvass meséket, hogy varázstárgyakat gyűjts!", readStory: "Olvasás", all: "Összes", creatures: "Lények", places: "Helyek", objects: "Tárgyak", stars: "Csillagok", rarity: { common: "Közönséges", rare: "Ritka", epic: "Epikus", legendary: "Legendás" } },
  ca: { title: "El Meu Àlbum", total: "Recollits", collected: "{n} objectes", empty: "Encara sense col·lecció", emptyHint: "Llegeix històries per recollir objectes màgics!", readStory: "Llegir", all: "Tots", creatures: "Criatures", places: "Llocs", objects: "Objectes", stars: "Estrelles", rarity: { common: "Comú", rare: "Rar", epic: "Èpic", legendary: "Llegendari" } },
  sl: { title: "Moj Album", total: "Zbranih", collected: "{n} predmetov", empty: "Še ni zbirke", emptyHint: "Beri zgodbe in zbiraj čarobne predmete!", readStory: "Beri", all: "Vse", creatures: "Bitja", places: "Kraji", objects: "Predmeti", stars: "Zvezdice", rarity: { common: "Običajen", rare: "Redek", epic: "Epski", legendary: "Legendarni" } },
  pt: { title: "O Meu Álbum", total: "Colecionados", collected: "{n} objetos", empty: "Ainda sem coleção", emptyHint: "Lê histórias para colecionar objetos mágicos!", readStory: "Ler", all: "Todos", creatures: "Criaturas", places: "Lugares", objects: "Objetos", stars: "Estrelas", rarity: { common: "Comum", rare: "Raro", epic: "Épico", legendary: "Lendário" } },
  sk: { title: "Môj Album", total: "Zozbierané", collected: "{n} predmetov", empty: "Ešte žiadna kolekcia", emptyHint: "Čítaj príbehy a zbieraj magické predmety!", readStory: "Čítať", all: "Všetko", creatures: "Bytosti", places: "Miesta", objects: "Predmety", stars: "Hviezdy", rarity: { common: "Bežný", rare: "Vzácny", epic: "Epický", legendary: "Legendárny" } },
  uk: { title: "Мій Альбом", total: "Зібрано", collected: "{n} предметів", empty: "Ще немає колекції", emptyHint: "Читай історії, щоб збирати магічні предмети!", readStory: "Читати", all: "Усі", creatures: "Істоти", places: "Місця", objects: "Предмети", stars: "Зірки", rarity: { common: "Звичайний", rare: "Рідкісний", epic: "Епічний", legendary: "Легендарний" } },
  ru: { title: "Мой Альбом", total: "Собрано", collected: "{n} предметов", empty: "Ещё нет коллекции", emptyHint: "Читай истории, чтобы собирать волшебные предметы!", readStory: "Читать", all: "Все", creatures: "Существа", places: "Места", objects: "Предметы", stars: "Звёзды", rarity: { common: "Обычный", rare: "Редкий", epic: "Эпический", legendary: "Легендарный" } },
};

const categoryIcons: Record<CollectibleCategory, string> = {
  creature: "🐉",
  place: "🏰",
  object: "⚔️",
  star: "⭐"
};

const rarityBorders: Record<Rarity, string> = {
  common: "border-muted-foreground/30",
  rare: "border-blue-500",
  epic: "border-purple-500",
  legendary: "border-amber-500"
};

const rarityBgs: Record<Rarity, string> = {
  common: "bg-card",
  rare: "bg-blue-500/5",
  epic: "bg-purple-500/5",
  legendary: "bg-gradient-to-br from-amber-500/10 to-orange-500/10"
};

const CollectionPage = () => {
  const navigate = useNavigate();
  const { selectedProfileId, selectedProfile, kidProfiles, hasMultipleProfiles, setSelectedProfileId, kidAppLanguage } = useKidProfile();
  const { items, stats, isLoading, getCategoryName, rarityGlows } = useCollection();
  const [activeTab, setActiveTab] = useState<'all' | CollectibleCategory>('all');

  const t = collectionTranslations[kidAppLanguage] || collectionTranslations.de;

  const filteredItems = activeTab === 'all' 
    ? items 
    : items.filter(item => item.category === activeTab);

  const poolTotals: Record<CollectibleCategory, number> = {
    creature: 15,
    place: 12,
    object: 15,
    star: 4
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-bounce-soft">
          <Sparkles className="h-16 w-16 text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title={t.title} backTo="/" />

      <div className="container max-w-4xl p-4 md:p-8">
        {/* Kid Profile Selector */}
        {hasMultipleProfiles && (
          <div className="mb-6 flex items-center justify-center gap-2 bg-card/60 backdrop-blur-sm rounded-xl p-2">
            {kidProfiles.map((profile) => (
              <button
                key={profile.id}
                onClick={() => setSelectedProfileId(profile.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
                  selectedProfileId === profile.id 
                    ? 'bg-primary text-primary-foreground' 
                    : 'hover:bg-muted'
                )}
              >
                <div className="w-8 h-8 rounded-full overflow-hidden border border-border">
                  {profile.cover_image_url ? (
                    <img src={profile.cover_image_url} alt={profile.name} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-muted flex items-center justify-center">
                      <Users className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
                <span className="font-medium text-sm">{profile.name}</span>
              </button>
            ))}
          </div>
        )}

        {/* Stats Overview */}
        <Card className="mb-6 border-2 border-[#F0E8E0] bg-gradient-to-br from-orange-50 to-transparent">
          <CardContent className="p-5">
            <div className="text-center mb-4">
              <p className="text-4xl font-baloo font-bold text-primary">{stats.total}</p>
              <p className="text-muted-foreground">{t.total}</p>
            </div>

            {/* Category progress */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {(['creature', 'place', 'object', 'star'] as CollectibleCategory[]).map((cat) => (
                <div key={cat} className="text-center">
                  <div className="text-2xl mb-1">{categoryIcons[cat]}</div>
                  <p className="text-sm font-medium">{getCategoryName(cat)}</p>
                  <Progress 
                    value={(stats.byCategory[cat] / poolTotals[cat]) * 100} 
                    className="h-2 mt-1" 
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.byCategory[cat]}/{poolTotals[cat]}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Collection Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
          <TabsList className="w-full grid grid-cols-5 h-auto">
            <TabsTrigger value="all" className="text-xs py-2">{t.all}</TabsTrigger>
            <TabsTrigger value="creature" className="text-xs py-2">🐉</TabsTrigger>
            <TabsTrigger value="place" className="text-xs py-2">🏰</TabsTrigger>
            <TabsTrigger value="object" className="text-xs py-2">⚔️</TabsTrigger>
            <TabsTrigger value="star" className="text-xs py-2">⭐</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Collection Grid */}
        {filteredItems.length === 0 ? (
          <Card className="border-dashed border-2 border-muted-foreground/30">
            <CardContent className="p-8 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-baloo font-bold mb-2">{t.empty}</h3>
              <p className="text-muted-foreground mb-4">{t.emptyHint}</p>
              <Button onClick={() => navigate('/stories')} className="btn-primary-kid">
                {t.readStory}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
            {filteredItems.map((item) => (
              <CollectibleCard
                key={item.id}
                emoji={item.item_emoji}
                name={item.item_name}
                description={item.item_description}
                rarity={item.rarity}
                rarityLabel={t.rarity[item.rarity]}
                glow={rarityGlows[item.rarity]}
              />
            ))}
          </div>
        )}

        {/* Rarity Legend */}
        <Card className="mt-6 border border-border">
          <CardContent className="p-4">
            <div className="flex flex-wrap justify-center gap-4 text-xs">
              {(['common', 'rare', 'epic', 'legendary'] as Rarity[]).map((rarity) => (
                <div key={rarity} className="flex items-center gap-1">
                  <div className={cn(
                    "w-3 h-3 rounded-full border-2",
                    rarityBorders[rarity],
                    rarity === 'legendary' && "bg-amber-500/30",
                    rarity === 'epic' && "bg-purple-500/30",
                    rarity === 'rare' && "bg-blue-500/30"
                  )} />
                  <span className="text-muted-foreground">{t.rarity[rarity]}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

// Collectible Card Component
const CollectibleCard = ({
  emoji,
  name,
  description,
  rarity,
  rarityLabel,
  glow
}: {
  emoji: string;
  name: string;
  description: string | null;
  rarity: Rarity;
  rarityLabel: string;
  glow: string;
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div 
      className={cn(
        "aspect-square rounded-xl border-2 cursor-pointer transition-all hover:scale-105",
        rarityBorders[rarity],
        rarityBgs[rarity],
        glow
      )}
      onClick={() => setIsFlipped(!isFlipped)}
    >
      {!isFlipped ? (
        <div className="h-full flex flex-col items-center justify-center p-2">
          <span className="text-4xl mb-1">{emoji}</span>
          <p className="text-xs font-medium text-center line-clamp-2">{name}</p>
        </div>
      ) : (
        <div className="h-full flex flex-col items-center justify-center p-2 text-center">
          <p className="text-[10px] text-muted-foreground mb-1">{rarityLabel}</p>
          <p className="text-xs line-clamp-3">{description || name}</p>
        </div>
      )}
    </div>
  );
};

export default CollectionPage;
