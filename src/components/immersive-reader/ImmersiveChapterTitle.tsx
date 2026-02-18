import React from 'react';
import { getImmersiveLabels, t } from './labels';
import { FABLINO_TEAL, LayoutMode } from './constants';
import { SyllableText, countSyllables } from '@/components/SyllableText';

interface ImmersiveChapterTitleProps {
  chapterNumber?: number;
  totalChapters?: number;
  title: string;
  coverImageUrl: string | null;
  language?: string | null;
  layoutMode?: LayoutMode;
  firstParagraph?: string | null;
  coverParagraphs?: string[];
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: string;
  syllableMode?: boolean;
  storyLanguage?: string;
}

/**
 * Cover / title page for ALL stories.
 *
 * Chapter stories: show chapter badge + counter.
 * Single stories: show title only (no badge).
 *
 * Portrait: image top, title, first paragraph below.
 * Landscape: image left 50%, title + separator + first paragraph right 50%.
 */
const ImmersiveChapterTitle: React.FC<ImmersiveChapterTitleProps> = ({
  chapterNumber,
  totalChapters,
  title,
  coverImageUrl,
  language,
  layoutMode = 'phone',
  firstParagraph,
  coverParagraphs,
  fontSize = 19,
  lineHeight = 1.65,
  letterSpacing = '0.1px',
  syllableMode = false,
  storyLanguage = 'de',
}) => {
  const allCoverParas = coverParagraphs && coverParagraphs.length > 0
    ? coverParagraphs
    : firstParagraph ? [firstParagraph] : [];
  const labels = getImmersiveLabels(language);
  const isLandscape = layoutMode === 'landscape-spread';
  const isChapter = !!(chapterNumber && totalChapters);

  const chapterBadge = isChapter ? (
    <div
      className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold mb-3 shadow-md"
      style={{ backgroundColor: FABLINO_TEAL }}
    >
      {labels.chapter} {chapterNumber}
    </div>
  ) : null;

  const titleEl = (
    <h1
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: '26px',
        fontWeight: 700,
        lineHeight: 1.3,
        marginBottom: '8px',
        color: '#1F2937',
      }}
    >
      {title}
    </h1>
  );

  const chapterCounter = isChapter ? (
    <p className="text-sm text-muted-foreground mb-2">
      {t(labels.chapterOf, { current: chapterNumber!, total: totalChapters! })}
    </p>
  ) : null;

  const separator = (
    <div
      style={{
        width: '40%',
        height: '1px',
        backgroundColor: 'rgba(0, 0, 0, 0.1)',
        margin: '16px 0',
      }}
    />
  );

  // Cover paragraphs — rendered with syllable coloring when active
  let globalColorOffset = 0;
  const coverParaEls = allCoverParas.length > 0 ? (
    <div
      className="text-left overflow-hidden"
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: `${fontSize}px`,
        lineHeight,
        letterSpacing,
      }}
    >
      {allCoverParas.map((para, pIdx) => (
        <p
          key={pIdx}
          style={{
            marginBottom: pIdx < allCoverParas.length - 1 ? '14px' : '0',
            textIndent: pIdx > 0 ? '1.5em' : '0',
            color: syllableMode ? undefined : '#374151',
          }}
        >
          {(() => {
            if (!syllableMode) return para;
            return para.split(/(\s+)/).map((token, i) => {
              if (/^\s+$/.test(token)) return <span key={i}>{token}</span>;
              const currentOffset = globalColorOffset;
              globalColorOffset += countSyllables(token, storyLanguage);
              return (
                <SyllableText
                  key={i}
                  text={token}
                  language={storyLanguage}
                  colorOffset={currentOffset}
                />
              );
            });
          })()}
        </p>
      ))}
    </div>
  ) : null;

  const imageFallback = (
    <div
      className="w-full h-full min-h-[200px] rounded-2xl flex items-center justify-center opacity-40"
      style={{ background: `linear-gradient(135deg, ${FABLINO_TEAL}40, ${FABLINO_TEAL}20)` }}
    >
      <span className="text-6xl">📖</span>
    </div>
  );

  // ── Landscape: side-by-side ─────────────────────────────
  if (isLandscape) {
    return (
      <div className="flex h-full min-h-[80vh]">
        {/* Left: cover image (max 85% height) */}
        <div
          className="flex-1 flex items-center justify-center p-6 overflow-hidden"
          style={{ borderRight: '1px solid rgba(0, 0, 0, 0.06)' }}
        >
          {coverImageUrl ? (
            <div className="relative flex items-center justify-center w-full h-full">
              <img
                src={coverImageUrl}
                alt={title}
                style={{ maxHeight: '85%', maxWidth: '100%', width: 'auto', objectFit: 'contain' }}
                className="rounded-2xl"
                loading="eager"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {/* Subtle gradient fade on bottom edge */}
              <div
                className="absolute bottom-0 left-0 right-0 pointer-events-none"
                style={{ height: '50px', background: 'linear-gradient(to bottom, transparent, #FFF9F0)' }}
              />
            </div>
          ) : (
            imageFallback
          )}
        </div>

        {/* Right: title + separator + first paragraph */}
        <div className="flex-1 flex flex-col justify-start px-8 overflow-hidden" style={{ paddingTop: '40px' }}>
          {chapterBadge}
          {titleEl}
          {chapterCounter}
          {separator}
          {coverParaEls}
        </div>
      </div>
    );
  }

  // ── Portrait: stacked ───────────────────────────────────
  return (
    <div className="flex flex-col items-center min-h-[80vh] px-6 py-6 overflow-hidden">
      {coverImageUrl ? (
        <div className="relative w-full max-w-sm mb-5 flex-shrink-0">
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full rounded-2xl object-cover max-h-[40vh]"
            loading="eager"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          {/* Gradient fade at bottom */}
          <div
            className="absolute bottom-0 left-0 right-0 rounded-b-2xl pointer-events-none"
            style={{ height: '50px', background: 'linear-gradient(to bottom, transparent, #FFF9F0)' }}
          />
        </div>
      ) : (
        <div className="w-full max-w-sm h-40 mb-5 flex-shrink-0">
          {imageFallback}
        </div>
      )}

      {chapterBadge && <div className="text-center mb-1">{chapterBadge}</div>}
      <div className="text-center">{titleEl}</div>
      {chapterCounter}
      {separator}
      <div className="w-full overflow-hidden">
        {coverParaEls}
      </div>
    </div>
  );
};

export default ImmersiveChapterTitle;
