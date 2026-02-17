import React from 'react';
import { getImmersiveLabels, t } from './labels';
import { FABLINO_TEAL, LayoutMode } from './constants';

interface ImmersiveChapterTitleProps {
  chapterNumber: number;
  totalChapters: number;
  title: string;
  coverImageUrl: string | null;
  language?: string | null;
  layoutMode?: LayoutMode;
  /** First paragraph of the story — shown on the cover page to fill the space */
  firstParagraph?: string | null;
  /** Typography props for rendering the first paragraph */
  fontSize?: number;
  lineHeight?: number;
  letterSpacing?: string;
}

/**
 * Chapter title / cover page.
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
  fontSize = 19,
  lineHeight = 1.65,
  letterSpacing = '0.1px',
}) => {
  const labels = getImmersiveLabels(language);
  const isLandscape = layoutMode === 'landscape-spread';

  const chapterBadge = (
    <div
      className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold mb-4 shadow-md"
      style={{ backgroundColor: FABLINO_TEAL }}
    >
      {labels.chapter} {chapterNumber}
    </div>
  );

  const titleEl = (
    <h1
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: '28px',
        fontWeight: 700,
        lineHeight: 1.3,
        marginBottom: '12px',
      }}
    >
      {title}
    </h1>
  );

  const chapterCounter = (
    <p className="text-sm text-muted-foreground mb-3">
      {t(labels.chapterOf, { current: chapterNumber, total: totalChapters })}
    </p>
  );

  const separator = (
    <div
      className="mx-auto mb-4"
      style={{
        width: '60%',
        height: '1px',
        backgroundColor: 'rgba(0, 0, 0, 0.15)',
      }}
    />
  );

  const firstParaEl = firstParagraph ? (
    <p
      className="text-left"
      style={{
        fontFamily: "'Nunito', sans-serif",
        fontSize: `${fontSize}px`,
        lineHeight,
        letterSpacing,
        color: '#374151',
      }}
    >
      {firstParagraph}
    </p>
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
        {/* Left: cover image */}
        <div
          className="flex-1 flex items-center justify-center p-6 overflow-hidden"
          style={{ borderRight: '1px solid rgba(0, 0, 0, 0.06)' }}
        >
          {coverImageUrl ? (
            <img
              src={coverImageUrl}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-lg"
              loading="eager"
              onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
            />
          ) : (
            imageFallback
          )}
        </div>

        {/* Right: title + separator + first paragraph */}
        <div className="flex-1 flex flex-col justify-start px-8 py-8 overflow-hidden">
          {chapterBadge}
          {titleEl}
          {chapterCounter}
          {separator}
          {firstParaEl}
        </div>
      </div>
    );
  }

  // ── Portrait: stacked ───────────────────────────────────
  return (
    <div className="flex flex-col items-center min-h-[80vh] px-6 py-8 overflow-hidden">
      {coverImageUrl ? (
        <div className="w-full max-w-sm mb-6 flex-shrink-0">
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full rounded-2xl shadow-lg object-cover max-h-[35vh]"
            loading="eager"
            onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
          />
        </div>
      ) : (
        <div className="w-full max-w-sm h-40 mb-6 flex-shrink-0">
          {imageFallback}
        </div>
      )}

      <div className="text-center mb-2">
        {chapterBadge}
      </div>
      {titleEl}
      {chapterCounter}
      {separator}
      <div className="w-full overflow-hidden">
        {firstParaEl}
      </div>
    </div>
  );
};

export default ImmersiveChapterTitle;
