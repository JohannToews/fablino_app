import React, { useMemo } from 'react';
import { ImmersivePage, LayoutMode, getThemeGradient } from './constants';
import { SyllableText } from '@/components/SyllableText';

// Multilingual stop words — short functional words that shouldn't be clickable
const STOP_WORDS = new Set([
  // DE
  'der', 'die', 'das', 'ein', 'eine', 'und', 'oder', 'aber', 'ist', 'sind',
  'hat', 'war', 'ich', 'du', 'er', 'sie', 'es', 'wir', 'ihr', 'den', 'dem',
  'des', 'im', 'in', 'an', 'auf', 'mit', 'von', 'zu', 'als', 'so', 'da',
  'um', 'am', 'aus', 'bei', 'vor', 'bis', 'nur', 'wie', 'was',
  // FR
  'le', 'la', 'les', 'un', 'une', 'des', 'du', 'de', 'et', 'ou', 'je', 'tu',
  'il', 'on', 'nous', 'vous', 'ils', 'elles', 'est', 'sont', 'ai', 'as',
  'en', 'dans', 'sur', 'sous', 'avec', 'sans', 'pour', 'par', 'que', 'qui',
  'ne', 'pas', 'se', 'ce', 'mais',
  // EN
  'the', 'a', 'an', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 'be',
  'am', 'he', 'she', 'it', 'we', 'you', 'they', 'my', 'his', 'her', 'its',
  'our', 'in', 'on', 'at', 'to', 'of', 'by', 'if', 'so', 'do', 'no', 'up',
  // ES
  'el', 'los', 'las', 'es', 'son', 'yo', 'él', 'ella', 'eso',
  // NL
  'het', 'een', 'hij', 'zij', 'ik', 'jij',
  // IT
  'il', 'lo', 'gli', 'io', 'lui', 'lei', 'noi', 'voi',
  // BS
  'ja', 'ti', 'mi', 'vi', 'on', 'ona', 'ono', 'oni', 'one',
]);

const MIN_WORD_LENGTH = 3;

function isStopWord(word: string): boolean {
  const clean = word.toLowerCase().replace(/[.,!?;:'"«»\-–—()[\]{}]/g, '');
  return STOP_WORDS.has(clean) || clean.length < MIN_WORD_LENGTH;
}

interface ImmersivePageRendererProps {
  page: ImmersivePage;
  layoutMode: LayoutMode;
  imageUrl?: string;
  imageSide?: 'left' | 'right';
  storyTheme?: string | null;
  fontSize: number;
  lineHeight: number;
  letterSpacing: string;
  syllableMode: boolean;
  storyLanguage: string;
  onWordTap: (word: string) => void;
  highlightedWord?: string | null;
}

/**
 * Renders a word as a clickable span, optionally with syllable coloring.
 */
function WordSpan({
  word,
  syllableMode,
  language,
  onWordTap,
  isHighlighted,
}: {
  word: string;
  syllableMode: boolean;
  language: string;
  onWordTap: (word: string) => void;
  isHighlighted: boolean;
}) {
  const isSpace = /^\s+$/.test(word);
  if (isSpace) return <>{word}</>;

  const canBeClicked = !isStopWord(word);

  if (syllableMode) {
    return (
      <SyllableText
        text={word}
        language={language}
        onClick={canBeClicked ? (e) => {
          e.stopPropagation();
          onWordTap(word);
        } : undefined}
        className={`${canBeClicked ? 'cursor-pointer hover:bg-primary/10 rounded transition-colors' : ''} ${isHighlighted ? 'bg-yellow-200/70 rounded px-0.5' : ''}`}
      />
    );
  }

  if (!canBeClicked) {
    return <span>{word}</span>;
  }

  return (
    <span
      data-word="true"
      onClick={(e) => {
        e.stopPropagation();
        onWordTap(word);
      }}
      className={`cursor-pointer hover:bg-primary/10 rounded transition-colors ${isHighlighted ? 'bg-yellow-200/70 rounded px-0.5' : ''}`}
    >
      {word}
    </span>
  );
}

/**
 * Renders the text paragraphs with clickable words and optional syllable coloring.
 */
function TextContent({
  paragraphs,
  fontSize,
  lineHeight,
  letterSpacing,
  syllableMode,
  storyLanguage,
  onWordTap,
  highlightedWord,
}: {
  paragraphs: string[];
  fontSize: number;
  lineHeight: number;
  letterSpacing: string;
  syllableMode: boolean;
  storyLanguage: string;
  onWordTap: (word: string) => void;
  highlightedWord?: string | null;
}) {
  return (
    <div
      className="immersive-text-content px-5 sm:px-8"
      style={{
        fontSize: `${fontSize}px`,
        lineHeight,
        letterSpacing,
        fontFamily: "'Nunito', sans-serif",
      }}
    >
      {paragraphs.map((para, pIdx) => (
        <p key={pIdx} className="mb-4 last:mb-0">
          {para.split(/(\s+)/).map((word, wIdx) => {
            const cleanWord = word.toLowerCase().replace(/[.,!?;:'"«»\-–—()[\]{}]/g, '');
            const isHighlighted = !!(highlightedWord && cleanWord === highlightedWord.toLowerCase());
            return (
              <WordSpan
                key={wIdx}
                word={word}
                syllableMode={syllableMode}
                language={storyLanguage}
                onWordTap={onWordTap}
                isHighlighted={isHighlighted}
              />
            );
          })}
        </p>
      ))}
    </div>
  );
}

/**
 * Renders a single immersive reader page.
 * Handles image+text, text-only layouts across phone/tablet/landscape modes.
 */
const ImmersivePageRenderer: React.FC<ImmersivePageRendererProps> = ({
  page,
  layoutMode,
  imageUrl,
  imageSide = 'left',
  storyTheme,
  fontSize,
  lineHeight,
  letterSpacing,
  syllableMode,
  storyLanguage,
  onWordTap,
  highlightedWord,
}) => {
  const gradient = useMemo(() => getThemeGradient(storyTheme), [storyTheme]);

  const textBlock = (
    <TextContent
      paragraphs={page.paragraphs}
      fontSize={fontSize}
      lineHeight={lineHeight}
      letterSpacing={letterSpacing}
      syllableMode={syllableMode}
      storyLanguage={storyLanguage}
      onWordTap={onWordTap}
      highlightedWord={highlightedWord}
    />
  );

  // ── Landscape Spread Layout ───────────────────────────────
  if (layoutMode === 'landscape-spread') {
    if (page.hasImage && imageUrl) {
      const imageBlock = (
        <div className="w-1/2 flex items-center justify-center p-4">
          <img
            src={imageUrl}
            alt="Story illustration"
            className="max-h-[70vh] w-full object-contain rounded-xl shadow-lg"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
          />
        </div>
      );
      const textSide = (
        <div className="w-1/2 flex items-center overflow-y-auto max-h-[80vh] py-6">
          {textBlock}
        </div>
      );
      return (
        <div className="flex items-center min-h-[80vh] gap-4 px-6">
          {imageSide === 'left' ? (
            <>{imageBlock}{textSide}</>
          ) : (
            <>{textSide}{imageBlock}</>
          )}
        </div>
      );
    }

    // Text-only landscape: centered full-width
    return (
      <div className="flex flex-col items-center justify-center min-h-[80vh] px-8">
        <div className="w-full max-w-2xl">
          <div
            className="h-3 w-full rounded-full mb-8 opacity-60"
            style={{ background: gradient }}
          />
          {textBlock}
        </div>
      </div>
    );
  }

  // ── Phone / Small-Tablet (Vertical) Layout ────────────────
  const padding = layoutMode === 'small-tablet' ? 'px-8' : 'px-5';
  const imageHeight = layoutMode === 'small-tablet' ? 'max-h-[55vh]' : 'max-h-[50vh]';

  if (page.hasImage && imageUrl) {
    return (
      <div className={`flex flex-col min-h-[80vh] ${padding}`}>
        {/* Image area with gradient fade */}
        <div className="relative flex-shrink-0">
          <img
            src={imageUrl}
            alt="Story illustration"
            className={`w-full ${imageHeight} object-cover rounded-b-2xl`}
            loading="lazy"
            onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
          />
          {/* Gradient fade overlay */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 rounded-b-2xl"
            style={{
              background: 'linear-gradient(transparent 0%, hsl(var(--background)) 100%)',
            }}
          />
        </div>
        {/* Text area */}
        <div className="flex-1 pt-4 pb-6 overflow-y-auto">
          {textBlock}
        </div>
      </div>
    );
  }

  // Text-only vertical: themed gradient accent at top
  return (
    <div className={`flex flex-col min-h-[80vh] ${padding}`}>
      <div
        className="h-24 w-full rounded-b-2xl mb-4 flex-shrink-0 opacity-70"
        style={{ background: gradient }}
      />
      <div className="flex-1 pt-2 pb-6 overflow-y-auto">
        {textBlock}
      </div>
    </div>
  );
};

export default ImmersivePageRenderer;
