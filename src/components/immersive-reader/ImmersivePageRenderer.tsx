import React, { useMemo } from 'react';
import { ImmersivePage, LayoutMode, Spread, getThemeGradient } from './constants';
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

// ── Shared typography props ─────────────────────────────────

interface TypoProps {
  fontSize: number;
  lineHeight: number;
  letterSpacing: string;
  syllableMode: boolean;
  storyLanguage: string;
  onWordTap: (word: string) => void;
  highlightedWord?: string | null;
}

/**
 * Renders a single immersive reader page.
 * Handles image+text and text-only layouts for phone / small-tablet (vertical).
 * In landscape mode this component is NOT used directly — see ImmersiveSpreadRenderer.
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
          {/* Gradient fade overlay — matches warm cream background */}
          <div
            className="absolute bottom-0 left-0 right-0 h-16 rounded-b-2xl"
            style={{
              background: 'linear-gradient(transparent 0%, #FFF9F0 100%)',
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

  // Text-only vertical: subtle themed gradient accent at top
  return (
    <div className={`flex flex-col min-h-[80vh] ${padding}`}>
      <div
        className="h-2 w-full rounded-full mt-4 mb-6 flex-shrink-0 opacity-50"
        style={{ background: gradient }}
      />
      <div className="flex-1 pb-6 overflow-y-auto">
        {textBlock}
      </div>
    </div>
  );
};

export default ImmersivePageRenderer;

// ═════════════════════════════════════════════════════════════
// Spread Renderer (landscape double-page layout)
// ═════════════════════════════════════════════════════════════

interface SpreadHalfProps {
  page: ImmersivePage;
  imageUrl?: string;
  gradient: string;
  typo: TypoProps;
}

/**
 * Renders one half of a landscape spread (either left or right page).
 */
function SpreadHalf({ page, imageUrl, gradient, typo }: SpreadHalfProps) {
  const textBlock = (
    <TextContent
      paragraphs={page.paragraphs}
      fontSize={typo.fontSize}
      lineHeight={typo.lineHeight}
      letterSpacing={typo.letterSpacing}
      syllableMode={typo.syllableMode}
      storyLanguage={typo.storyLanguage}
      onWordTap={typo.onWordTap}
      highlightedWord={typo.highlightedWord}
    />
  );

  // Image page — full image with gradient fade + text below
  if (page.hasImage && imageUrl) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <div className="relative flex-shrink-0">
          <img
            src={imageUrl}
            alt="Story illustration"
            className="w-full max-h-[50vh] object-cover rounded-b-xl"
            loading="lazy"
            onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
          />
          <div
            className="absolute bottom-0 left-0 right-0 h-12 rounded-b-xl"
            style={{ background: 'linear-gradient(transparent 0%, #FFF9F0 100%)' }}
          />
        </div>
        <div className="flex-1 pt-3 pb-4 overflow-y-auto">
          {textBlock}
        </div>
      </div>
    );
  }

  // Text-only page
  return (
    <div className="flex flex-col h-full">
      <div
        className="h-1.5 w-full rounded-full mt-3 mb-4 flex-shrink-0 opacity-40"
        style={{ background: gradient }}
      />
      <div className="flex-1 pb-4 overflow-y-auto">
        {textBlock}
      </div>
    </div>
  );
}

/**
 * Empty right half placeholder when a spread has only one page.
 */
function SpreadEmptyHalf() {
  return (
    <div
      className="flex-1 h-full"
      style={{ backgroundColor: '#FAF8F5' }}
    />
  );
}

export interface ImmersiveSpreadRendererProps {
  spread: Spread;
  visibleImages: string[];
  storyTheme?: string | null;
  typo: TypoProps;
}

/**
 * Renders a landscape double-page spread.
 *
 * Three variants:
 *  A) Image + Text  — one side has the image, the other has text
 *  B) Text + Text   — two text pages side by side like a book
 *  C) Single page   — left page centered (~60%), right side empty
 */
export const ImmersiveSpreadRenderer: React.FC<ImmersiveSpreadRendererProps> = ({
  spread,
  visibleImages,
  storyTheme,
  typo,
}) => {
  const gradient = useMemo(() => getThemeGradient(storyTheme), [storyTheme]);

  const leftImageUrl = spread.left.hasImage && spread.left.imageIndex !== undefined
    ? visibleImages[spread.left.imageIndex]
    : undefined;

  const rightImageUrl = spread.right?.hasImage && spread.right.imageIndex !== undefined
    ? visibleImages[spread.right.imageIndex]
    : undefined;

  const isSinglePage = spread.right === null;

  // ── Variant C: Single page (cover, chapter title, last odd page) ──
  if (isSinglePage) {
    return (
      <div className="flex h-full min-h-[80vh]">
        {/* Centered single page (~60% width) */}
        <div className="flex-[3] px-8 py-4 flex flex-col justify-center">
          <SpreadHalf
            page={spread.left}
            imageUrl={leftImageUrl}
            gradient={gradient}
            typo={typo}
          />
        </div>
        {/* Empty right side */}
        <div className="flex-[2]">
          <SpreadEmptyHalf />
        </div>
      </div>
    );
  }

  // ── Variant A & B: Two pages side by side ──
  return (
    <div className="flex h-full min-h-[80vh]">
      {/* Left page */}
      <div
        className="flex-1 px-6 py-4"
        style={{ borderRight: '1px solid rgba(0, 0, 0, 0.06)' }}
      >
        <SpreadHalf
          page={spread.left}
          imageUrl={leftImageUrl}
          gradient={gradient}
          typo={typo}
        />
      </div>

      {/* Right page */}
      <div className="flex-1 px-6 py-4">
        <SpreadHalf
          page={spread.right}
          imageUrl={rightImageUrl}
          gradient={gradient}
          typo={typo}
        />
      </div>
    </div>
  );
};
