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
}

/**
 * Chapter title page for series/chapter stories.
 *
 * Portrait: stacked (image on top, title below).
 * Landscape: side-by-side (image left 50%, title right 50%).
 */
const ImmersiveChapterTitle: React.FC<ImmersiveChapterTitleProps> = ({
  chapterNumber,
  totalChapters,
  title,
  coverImageUrl,
  language,
  layoutMode = 'phone',
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
      className="text-2xl sm:text-3xl md:text-4xl font-bold mb-4 max-w-lg leading-tight"
      style={{ fontFamily: "'Nunito', sans-serif" }}
    >
      {title}
    </h1>
  );

  const chapterCounter = (
    <p className="text-sm text-muted-foreground">
      {t(labels.chapterOf, { current: chapterNumber, total: totalChapters })}
    </p>
  );

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
        <div className="flex-1 flex items-center justify-center p-6 overflow-hidden">
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

        {/* Right: title info */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 py-6 text-center">
          {chapterBadge}
          {titleEl}
          {chapterCounter}
        </div>
      </div>
    );
  }

  // ── Portrait: stacked ───────────────────────────────────
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-8 text-center">
      {chapterBadge}
      {titleEl}

      {coverImageUrl ? (
        <div className="w-full max-w-sm mb-8">
          <img
            src={coverImageUrl}
            alt={title}
            className="w-full rounded-2xl shadow-lg object-cover max-h-[40vh]"
            loading="eager"
            onError={(e) => { e.currentTarget.src = '/fallback-illustration.svg'; }}
          />
        </div>
      ) : (
        <div className="w-full max-w-sm h-48 mb-8">
          {imageFallback}
        </div>
      )}

      {chapterCounter}
    </div>
  );
};

export default ImmersiveChapterTitle;
