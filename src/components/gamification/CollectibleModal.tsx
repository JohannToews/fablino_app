import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles } from "lucide-react";
import confetti from "canvas-confetti";
import type { CollectedItem, Rarity } from "@/hooks/useCollection";
import { cn } from "@/lib/utils";

interface CollectibleModalProps {
  item: CollectedItem | null;
  onClose: () => void;
  language?: string;
}

const translations: Record<string, {
  newItem: string;
  youFound: string;
  rarity: Record<Rarity, string>;
  awesome: string;
  viewCollection: string;
}> = {
  de: {
    newItem: "Neues Sammelobjekt!",
    youFound: "Du hast gefunden:",
    rarity: { common: "Gewöhnlich", rare: "Selten", epic: "Episch", legendary: "Legendär" },
    awesome: "Super!",
    viewCollection: "Zur Sammlung"
  },
  fr: {
    newItem: "Nouvel objet!",
    youFound: "Tu as trouvé:",
    rarity: { common: "Commun", rare: "Rare", epic: "Épique", legendary: "Légendaire" },
    awesome: "Super!",
    viewCollection: "Voir la collection"
  },
  en: {
    newItem: "New Collectible!",
    youFound: "You found:",
    rarity: { common: "Common", rare: "Rare", epic: "Epic", legendary: "Legendary" },
    awesome: "Awesome!",
    viewCollection: "View Collection"
  },
  es: {
    newItem: "¡Nuevo objeto!",
    youFound: "Encontraste:",
    rarity: { common: "Común", rare: "Raro", epic: "Épico", legendary: "Legendario" },
    awesome: "¡Genial!",
    viewCollection: "Ver colección"
  },
  nl: {
    newItem: "Nieuw voorwerp!",
    youFound: "Je hebt gevonden:",
    rarity: { common: "Gewoon", rare: "Zeldzaam", epic: "Episch", legendary: "Legendarisch" },
    awesome: "Super!",
    viewCollection: "Bekijk collectie"
  },
  bs: {
    newItem: "Novi predmet!",
    youFound: "Pronašao/la si:",
    rarity: { common: "Obično", rare: "Rijetko", epic: "Epsko", legendary: "Legendarno" },
    awesome: "Odlično!",
    viewCollection: "Pogledaj kolekciju"
  }
};

const rarityColors: Record<Rarity, string> = {
  common: "text-muted-foreground",
  rare: "text-blue-500",
  epic: "text-purple-500",
  legendary: "text-amber-500"
};

const rarityBgs: Record<Rarity, string> = {
  common: "bg-muted/50",
  rare: "bg-blue-500/10",
  epic: "bg-purple-500/10",
  legendary: "bg-gradient-to-br from-amber-500/20 to-orange-500/20"
};

export const CollectibleModal = ({ item, onClose, language = 'de' }: CollectibleModalProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const t = translations[language] || translations.de;

  useEffect(() => {
    if (item) {
      setIsOpen(true);
      
      // Confetti for rare+ items
      if (item.rarity !== 'common') {
        const colors = item.rarity === 'legendary' 
          ? ['#fbbf24', '#f97316', '#fef08a']
          : item.rarity === 'epic'
          ? ['#a855f7', '#c084fc', '#e879f9']
          : ['#3b82f6', '#60a5fa', '#93c5fd'];

        confetti({
          particleCount: item.rarity === 'legendary' ? 100 : 50,
          spread: 70,
          origin: { y: 0.6 },
          colors
        });
      }
    }
  }, [item]);

  const handleClose = () => {
    setIsOpen(false);
    onClose();
  };

  if (!item) return null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-sm text-center border-2 border-primary/50">
        <div className="py-6 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-center gap-2">
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
            <h2 className="text-xl font-baloo font-bold text-primary">
              {t.newItem}
            </h2>
            <Sparkles className="h-5 w-5 text-primary animate-pulse" />
          </div>

          <p className="text-muted-foreground">{t.youFound}</p>

          {/* Item Display */}
          <div className={cn(
            "mx-auto w-32 h-32 rounded-2xl border-2 flex flex-col items-center justify-center",
            rarityBgs[item.rarity],
            item.rarity === 'legendary' && "animate-pulse border-amber-500",
            item.rarity === 'epic' && "border-purple-500",
            item.rarity === 'rare' && "border-blue-500",
            item.rarity === 'common' && "border-border"
          )}>
            <span className="text-6xl mb-1">{item.item_emoji}</span>
          </div>

          {/* Item Info */}
          <div>
            <p className="text-lg font-bold">{item.item_name}</p>
            <p className={cn("text-sm font-medium", rarityColors[item.rarity])}>
              {t.rarity[item.rarity]}
            </p>
            {item.item_description && (
              <p className="text-xs text-muted-foreground mt-1">{item.item_description}</p>
            )}
          </div>

          {/* Buttons */}
          <div className="flex gap-2 justify-center pt-2">
            <Button onClick={handleClose} variant="outline">
              {t.awesome}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
