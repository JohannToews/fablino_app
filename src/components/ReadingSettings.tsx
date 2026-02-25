import { Button } from "@/components/ui/button";
import { Type, AlignJustify, BookA } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Labels for reading settings in different languages
const settingsLabels: Record<string, {
  fontSize: string;
  lineSpacing: string;
  small: string;
  medium: string;
  large: string;
  syllables: string;
}> = {
  de: {
    fontSize: "Schriftgröße",
    lineSpacing: "Zeilenabstand",
    small: "Klein",
    medium: "Mittel",
    large: "Groß",
    syllables: "Silben",
  },
  fr: {
    fontSize: "Taille du texte",
    lineSpacing: "Interligne",
    small: "Petit",
    medium: "Moyen",
    large: "Grand",
    syllables: "Syllabes",
  },
  en: {
    fontSize: "Font size",
    lineSpacing: "Line spacing",
    small: "Small",
    medium: "Medium",
    large: "Large",
    syllables: "Syllables",
  },
  es: {
    fontSize: "Tamaño de letra",
    lineSpacing: "Espaciado",
    small: "Pequeño",
    medium: "Medio",
    large: "Grande",
    syllables: "Sílabas",
  },
  nl: {
    fontSize: "Lettergrootte",
    lineSpacing: "Regelafstand",
    small: "Klein",
    medium: "Gemiddeld",
    large: "Groot",
    syllables: "Lettergrepen",
  },
  it: {
    fontSize: "Dimensione testo",
    lineSpacing: "Interlinea",
    small: "Piccolo",
    medium: "Medio",
    large: "Grande",
    syllables: "Sillabe",
  },
  bs: { fontSize: "Veličina fonta", lineSpacing: "Razmak redova", small: "Malo", medium: "Srednje", large: "Veliko", syllables: "Slogovi" },
  tr: { fontSize: "Yazı boyutu", lineSpacing: "Satır aralığı", small: "Küçük", medium: "Orta", large: "Büyük", syllables: "Heceler" },
  bg: { fontSize: "Размер на шрифта", lineSpacing: "Разстояние между редове", small: "Малък", medium: "Среден", large: "Голям", syllables: "Срички" },
  ro: { fontSize: "Dimensiune font", lineSpacing: "Spațiere rânduri", small: "Mic", medium: "Mediu", large: "Mare", syllables: "Silabe" },
  pl: { fontSize: "Rozmiar czcionki", lineSpacing: "Odstęp między wierszami", small: "Mały", medium: "Średni", large: "Duży", syllables: "Sylaby" },
  lt: { fontSize: "Šrifto dydis", lineSpacing: "Eilučių tarpas", small: "Mažas", medium: "Vidutinis", large: "Didelis", syllables: "Skiemenys" },
  hu: { fontSize: "Betűméret", lineSpacing: "Sorköz", small: "Kicsi", medium: "Közepes", large: "Nagy", syllables: "Szótagok" },
  ca: { fontSize: "Mida de lletra", lineSpacing: "Interlineat", small: "Petit", medium: "Mitjà", large: "Gran", syllables: "Síl·labes" },
  sl: { fontSize: "Velikost pisave", lineSpacing: "Razmik vrstic", small: "Majhno", medium: "Srednje", large: "Veliko", syllables: "Zlogi" },
  pt: { fontSize: "Tamanho da letra", lineSpacing: "Espaçamento", small: "Pequeno", medium: "Médio", large: "Grande", syllables: "Sílabas" },
  sk: { fontSize: "Veľkosť písma", lineSpacing: "Riadkovanie", small: "Malé", medium: "Stredné", large: "Veľké", syllables: "Slabiky" },
  uk: { fontSize: "Розмір шрифту", lineSpacing: "Міжрядковий інтервал", small: "Малий", medium: "Середній", large: "Великий", syllables: "Склади" },
  ru: { fontSize: "Размер шрифта", lineSpacing: "Межстрочный интервал", small: "Маленький", medium: "Средний", large: "Большой", syllables: "Слоги" },
};

export type FontSizeLevel = 1 | 2 | 3 | 4;
export type LineSpacingLevel = 1 | 2 | 3;

interface ReadingSettingsProps {
  fontSize: FontSizeLevel;
  lineSpacing?: LineSpacingLevel;
  onFontSizeChange: (level: FontSizeLevel) => void;
  onLineSpacingChange?: (level: LineSpacingLevel) => void;
  language: string;
  syllableMode?: boolean;
  onSyllableModeChange?: (enabled: boolean) => void;
  showSyllableOption?: boolean;
}

const ReadingSettings = ({
  fontSize,
  onFontSizeChange,
  language,
  syllableMode = false,
  onSyllableModeChange,
  showSyllableOption = false,
}: ReadingSettingsProps) => {
  const t = settingsLabels[language] || settingsLabels.fr;
  const levels: FontSizeLevel[] = [1, 2, 3, 4];
  const sizeLabels = [t.small, t.medium, t.large, "XL"];

  return (
    <div className="flex flex-wrap items-center gap-4 p-3 bg-card/60 backdrop-blur-sm rounded-xl border border-border/50">
      {/* Font Size */}
      <div className="flex items-center gap-2">
        <Type className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {levels.map((level, idx) => (
            <Button
              key={`font-${level}`}
              variant={fontSize === level ? "default" : "outline"}
              size="sm"
              onClick={() => onFontSizeChange(level)}
              className={`text-xs px-2 py-1 h-7 min-w-[50px] ${
                fontSize === level ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              {sizeLabels[idx]}
            </Button>
          ))}
        </div>
      </div>

      {/* Syllable Mode Toggle (only for German) */}
      {showSyllableOption && onSyllableModeChange && (
        <div className="flex items-center gap-2">
          <BookA className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="syllable-mode" className="text-xs text-muted-foreground cursor-pointer">
            {t.syllables}
          </Label>
          <Switch
            id="syllable-mode"
            checked={syllableMode}
            onCheckedChange={onSyllableModeChange}
            className="scale-90"
          />
          {syllableMode && (
            <span className="text-xs">
              <span style={{ color: "#2563EB" }}>Sil</span>
              <span style={{ color: "#DC2626" }}>ben</span>
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default ReadingSettings;

// CSS classes for reading text based on settings
export const getReadingTextClasses = (fontSize: FontSizeLevel): string => {
  const fontClasses: Record<FontSizeLevel, string> = {
    1: "text-base md:text-lg leading-relaxed",
    2: "text-lg md:text-xl leading-relaxed",
    3: "text-xl md:text-2xl leading-loose",
    4: "text-2xl md:text-3xl leading-loose",
  };

  return fontClasses[fontSize];
};
