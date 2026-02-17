import React, { useState } from 'react';
import { FontSizeSetting } from './constants';
import { getImmersiveLabels } from './labels';
import { isSyllableColoringSupported } from './useSyllableColoring';
import { Button } from '@/components/ui/button';
import {
  Maximize,
  Minimize,
  Type,
  ChevronUp,
  ChevronDown,
} from 'lucide-react';

interface ImmersiveToolbarProps {
  fontSizeSetting: FontSizeSetting;
  onFontSizeChange: (setting: FontSizeSetting) => void;
  syllableMode: boolean;
  onSyllableModeChange: (enabled: boolean) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
  storyLanguage: string;
  uiLanguage?: string | null;
}

const FONT_SIZES: FontSizeSetting[] = ['small', 'medium', 'large'];

/**
 * Collapsible toolbar for the Immersive Reader.
 *
 * Contains:
 * - Font size selector (Small / Medium / Large)
 * - Syllable coloring toggle
 * - Fullscreen toggle
 */
const ImmersiveToolbar: React.FC<ImmersiveToolbarProps> = ({
  fontSizeSetting,
  onFontSizeChange,
  syllableMode,
  onSyllableModeChange,
  isFullscreen,
  onToggleFullscreen,
  storyLanguage,
  uiLanguage,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const labels = getImmersiveLabels(uiLanguage);
  const syllableSupported = isSyllableColoringSupported(storyLanguage);

  const fontLabels: Record<FontSizeSetting, string> = {
    small: labels.fontSmall,
    medium: labels.fontMedium,
    large: labels.fontLarge,
  };

  return (
    <div className="immersive-toolbar fixed bottom-4 right-4 z-40">
      {/* Expanded panel */}
      {isExpanded && (
        <div className="bg-background/95 backdrop-blur-md border rounded-2xl shadow-lg p-3 mb-2 min-w-[180px] animate-in slide-in-from-bottom-2 duration-200">
          {/* Font size */}
          <div className="mb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Type className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs text-muted-foreground font-medium">
                {labels.fontMedium === 'Mittel' ? 'Schriftgröße' : 'Font Size'}
              </span>
            </div>
            <div className="flex gap-1">
              {FONT_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => onFontSizeChange(size)}
                  className={`flex-1 px-2 py-1.5 text-xs rounded-lg transition-colors ${
                    fontSizeSetting === size
                      ? 'bg-primary text-primary-foreground font-semibold'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  {fontLabels[size]}
                </button>
              ))}
            </div>
          </div>

          {/* Syllable coloring toggle */}
          {syllableSupported && (
            <button
              onClick={() => onSyllableModeChange(!syllableMode)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg transition-colors mb-2 ${
                syllableMode
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              <span className="font-medium">
                <span style={{ color: '#2563EB' }}>A</span>
                <span style={{ color: '#DC2626' }}>B</span>
              </span>
              <span>{syllableMode ? labels.syllablesOn : labels.syllablesOff}</span>
            </button>
          )}

          {/* Fullscreen */}
          <button
            onClick={onToggleFullscreen}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground transition-colors"
          >
            {isFullscreen ? (
              <Minimize className="h-3.5 w-3.5" />
            ) : (
              <Maximize className="h-3.5 w-3.5" />
            )}
            <span>{labels.fullscreen}</span>
          </button>
        </div>
      )}

      {/* Toggle button */}
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsExpanded(!isExpanded)}
        className="h-10 w-10 rounded-full shadow-md bg-background/95 backdrop-blur-sm"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronUp className="h-4 w-4" />
        )}
      </Button>
    </div>
  );
};

export default ImmersiveToolbar;
