import React, { useMemo } from 'react';
import { ImmersivePage, LayoutMode, Spread } from './constants';
import { SyllableText, countSyllables } from '@/components/SyllableText';

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

const MIN_WORD_LENGTH_CLICKABLE = 3;

function isStopWord(word: string): boolean {
  const clean = word.toLowerCase().replace(/[.,!?;:'"«»\-–—()[\]{}]/g, '');
  return STOP_WORDS.has(clean) || clean.length < MIN_WORD_LENGTH_CLICKABLE;
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
 * Renders the text paragraphs with clickable words and optional syllable coloring.
 *
 * When syllableMode is ON:
 * - EVERY word gets colored (blue/red alternating across the entire page)
 * - A running colorOffset counter ensures colors alternate continuously
 * - No word is left black — even stop words, short words, and punctuation
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
  // Running color counter — resets per page render, counts across all paragraphs
  let colorOffset = 0;

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
        <p
          key={pIdx}
          style={{
            marginBottom: pIdx < paragraphs.length - 1 ? '16px' : '0',
            textIndent: pIdx > 0 ? '1.5em' : '0',
          }}
        >
          {para.split(/(\s+)/).map((word, wIdx) => {
            const isSpace = /^\s+$/.test(word);
            if (isSpace) return <span key={wIdx}>{word}</span>;

            const cleanWord = word.toLowerCase().replace(/[.,!?;:'"«»\-–—()[\]{}]/g, '');
            const isHighlighted = !!(highlightedWord && cleanWord === highlightedWord.toLowerCase());
            const canBeClicked = !isStopWord(word);

            if (syllableMode) {
              const currentOffset = colorOffset;
              colorOffset += countSyllables(word, storyLanguage);

              return (
                <SyllableText
                  key={wIdx}
                  text={word}
                  language={storyLanguage}
                  colorOffset={currentOffset}
                  onClick={canBeClicked ? (e) => {
                    e.stopPropagation();
                    onWordTap(word);
                  } : undefined}
                  className={`${canBeClicked ? 'cursor-pointer hover:bg-primary/10 rounded transition-colors' : ''} ${isHighlighted ? 'bg-yellow-200/70 rounded px-0.5' : ''}`}
                />
              );
            }

            // syllableMode OFF — normal rendering
            if (!canBeClicked) {
              return <span key={wIdx}>{word}</span>;
            }

            return (
              <span
                key={wIdx}
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
  storyTheme,
  fontSize,
  lineHeight,
  letterSpacing,
  syllableMode,
  storyLanguage,
  onWordTap,
  highlightedWord,
}) => {
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
            className={`w-full ${imageHeight} object-cover`}
            loading="lazy"
            onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
          />
          {/* Bottom gradient fade into background */}
          <div
            className="absolute bottom-0 left-0 right-0 pointer-events-none"
            style={{ height: '80px', background: 'linear-gradient(to bottom, transparent, #FFF9F0)' }}
          />
        </div>
        {/* Text area */}
        <div className="flex-1 pt-4 pb-6 overflow-hidden">
          {textBlock}
        </div>
      </div>
    );
  }

  // Text-only vertical: warm background, no gradient bar
  return (
    <div className={`flex flex-col min-h-[80vh] ${padding}`}>
      <div className="flex-1 pt-6 pb-6 overflow-hidden">
        {textBlock}
      </div>
    </div>
  );
};

export default ImmersivePageRenderer;

// ═════════════════════════════════════════════════════════════
// Spread Renderer (landscape double-page layout)
// ═════════════════════════════════════════════════════════════

/**
 * Full-bleed image for one half of a spread.
 * Includes gradient fades on the side facing text and on the bottom.
 */
function SpreadImageHalf({ imageUrl, fadeSide = 'right' }: { imageUrl: string; fadeSide?: 'left' | 'right' }) {
  return (
    <div className="relative flex items-center justify-center h-full overflow-hidden p-4">
      <img
        src={imageUrl}
        alt="Story illustration"
        className="max-w-full max-h-full object-contain"
        loading="lazy"
        onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
      />
      {/* Side fade toward text */}
      <div
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          [fadeSide]: 0,
          width: '60px',
          background: fadeSide === 'right'
            ? 'linear-gradient(to right, transparent, #FFF9F0)'
            : 'linear-gradient(to left, transparent, #FFF9F0)',
        }}
      />
      {/* Bottom fade */}
      <div
        className="absolute bottom-0 left-0 right-0 pointer-events-none"
        style={{ height: '40px', background: 'linear-gradient(to bottom, transparent, #FFF9F0)', zIndex: 1 }}
      />
    </div>
  );
}

/**
 * Text half of a spread. Top-aligned (book-like), no scrolling.
 */
function SpreadTextHalf({ paragraphs, typo }: { paragraphs: string[]; typo: TypoProps }) {
  return (
    <div className="flex flex-col justify-start h-full overflow-hidden px-8" style={{ paddingTop: '40px', paddingBottom: '24px' }}>
      <TextContent
        paragraphs={paragraphs}
        fontSize={typo.fontSize}
        lineHeight={typo.lineHeight}
        letterSpacing={typo.letterSpacing}
        syllableMode={typo.syllableMode}
        storyLanguage={typo.storyLanguage}
        onWordTap={typo.onWordTap}
        highlightedWord={typo.highlightedWord}
      />
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
 * Variant A: Image + Text — image fills one ENTIRE half, text fills the other.
 * Variant B: Text + Text  — two text pages side by side like a book.
 * Variant C: Single page  — centered left, right side empty.
 *
 * RULE: Image and text NEVER share the same half. No scrolling allowed.
 */
export const ImmersiveSpreadRenderer: React.FC<ImmersiveSpreadRendererProps> = ({
  spread,
  visibleImages,
  storyTheme,
  typo,
}) => {
  const leftImageUrl = spread.left.hasImage && spread.left.imageIndex !== undefined
    ? visibleImages[spread.left.imageIndex]
    : undefined;

  const rightImageUrl = spread.right?.hasImage && spread.right.imageIndex !== undefined
    ? visibleImages[spread.right.imageIndex]
    : undefined;

  const isSinglePage = spread.right === null;

  // Collect all text paragraphs from both pages for image+text spreads
  const allParagraphs = useMemo(() => {
    const paras = [...spread.left.paragraphs];
    if (spread.right) paras.push(...spread.right.paragraphs);
    return paras;
  }, [spread.left.paragraphs, spread.right]);

  // Determine if this spread has any image
  const hasAnyImage = !!(leftImageUrl || rightImageUrl);
  const imageUrl = leftImageUrl || rightImageUrl;

  // ── Variant C: Single page (cover, chapter title, last odd page) ──
  if (isSinglePage) {
    if (leftImageUrl) {
      // Single image page: image left, empty right
      return (
        <div className="flex h-full min-h-[80vh]">
          <div className="flex-[3]">
            <SpreadImageHalf imageUrl={leftImageUrl} fadeSide="right" />
          </div>
          <div className="flex-[2]">
            <SpreadEmptyHalf />
          </div>
        </div>
      );
    }
    // Single text page
    return (
      <div className="flex h-full min-h-[80vh]">
        <div className="flex-[3]">
          <SpreadTextHalf paragraphs={spread.left.paragraphs} typo={typo} />
        </div>
        <div className="flex-[2]">
          <SpreadEmptyHalf />
        </div>
      </div>
    );
  }

  // ── Variant A: Image + Text spread ──
  // One entire half = image, the other entire half = ALL text from both pages
  if (hasAnyImage && imageUrl) {
    const imageOnLeft = !!leftImageUrl;
    const imageHalf = <SpreadImageHalf imageUrl={imageUrl} fadeSide={imageOnLeft ? 'right' : 'left'} />;
    const textHalf = <SpreadTextHalf paragraphs={allParagraphs} typo={typo} />;

    return (
      <div className="flex h-full min-h-[80vh]">
        <div className="flex-1">
          {imageOnLeft ? imageHalf : textHalf}
        </div>
        <div className="flex-1">
          {imageOnLeft ? textHalf : imageHalf}
        </div>
      </div>
    );
  }

  // ── Variant B: Text + Text (both pages are text-only) ──
  return (
    <div className="flex h-full min-h-[80vh]">
      <div
        className="flex-1"
        style={{ borderRight: '1px solid rgba(0, 0, 0, 0.06)' }}
      >
        <SpreadTextHalf paragraphs={spread.left.paragraphs} typo={typo} />
      </div>
      <div className="flex-1">
        <SpreadTextHalf paragraphs={spread.right!.paragraphs} typo={typo} />
      </div>
    </div>
  );
};
