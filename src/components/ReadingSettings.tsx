import { Button } from "@/components/ui/button";
import { Type, AlignJustify } from "lucide-react";

// Labels for reading settings in different languages
const settingsLabels: Record<string, {
  fontSize: string;
  lineSpacing: string;
  small: string;
  medium: string;
  large: string;
}> = {
  de: {
    fontSize: "Schriftgröße",
    lineSpacing: "Zeilenabstand",
    small: "Klein",
    medium: "Mittel",
    large: "Groß",
  },
  fr: {
    fontSize: "Taille du texte",
    lineSpacing: "Interligne",
    small: "Petit",
    medium: "Moyen",
    large: "Grand",
  },
  en: {
    fontSize: "Font size",
    lineSpacing: "Line spacing",
    small: "Small",
    medium: "Medium",
    large: "Large",
  },
  es: {
    fontSize: "Tamaño de letra",
    lineSpacing: "Espaciado",
    small: "Pequeño",
    medium: "Medio",
    large: "Grande",
  },
  nl: {
    fontSize: "Lettergrootte",
    lineSpacing: "Regelafstand",
    small: "Klein",
    medium: "Gemiddeld",
    large: "Groot",
  },
  it: {
    fontSize: "Dimensione testo",
    lineSpacing: "Interlinea",
    small: "Piccolo",
    medium: "Medio",
    large: "Grande",
  },
  bs: {
    fontSize: "Veličina fonta",
    lineSpacing: "Razmak redova",
    small: "Malo",
    medium: "Srednje",
    large: "Veliko",
  },
};

export type FontSizeLevel = 1 | 2 | 3;
export type LineSpacingLevel = 1 | 2 | 3;

interface ReadingSettingsProps {
  fontSize: FontSizeLevel;
  lineSpacing: LineSpacingLevel;
  onFontSizeChange: (level: FontSizeLevel) => void;
  onLineSpacingChange: (level: LineSpacingLevel) => void;
  language: string;
}

const ReadingSettings = ({
  fontSize,
  lineSpacing,
  onFontSizeChange,
  onLineSpacingChange,
  language,
}: ReadingSettingsProps) => {
  const t = settingsLabels[language] || settingsLabels.fr;
  const levels: FontSizeLevel[] = [1, 2, 3];
  const sizeLabels = [t.small, t.medium, t.large];

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

      {/* Line Spacing */}
      <div className="flex items-center gap-2">
        <AlignJustify className="h-4 w-4 text-muted-foreground" />
        <div className="flex gap-1">
          {levels.map((level, idx) => (
            <Button
              key={`spacing-${level}`}
              variant={lineSpacing === level ? "default" : "outline"}
              size="sm"
              onClick={() => onLineSpacingChange(level)}
              className={`text-xs px-2 py-1 h-7 min-w-[50px] ${
                lineSpacing === level ? "bg-primary text-primary-foreground" : ""
              }`}
            >
              {sizeLabels[idx]}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ReadingSettings;

// CSS classes for reading text based on settings
export const getReadingTextClasses = (fontSize: FontSizeLevel, lineSpacing: LineSpacingLevel): string => {
  const fontClasses: Record<FontSizeLevel, string> = {
    1: "text-base md:text-lg",
    2: "text-lg md:text-xl",
    3: "text-xl md:text-2xl",
  };

  const spacingClasses: Record<LineSpacingLevel, string> = {
    1: "leading-relaxed",
    2: "leading-loose",
    3: "[line-height:2.2]",
  };

  return `${fontClasses[fontSize]} ${spacingClasses[lineSpacing]}`;
};
