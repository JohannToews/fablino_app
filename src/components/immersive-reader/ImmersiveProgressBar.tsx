import React from 'react';
import { FABLINO_TEAL, LayoutMode, Spread } from './constants';
import { getImmersiveLabels, t } from './labels';

interface ImmersiveProgressBarProps {
  currentPage: number;
  totalPages: number;
  chapterNumber?: number | null;
  totalChapters?: number | null;
  language?: string | null;
  layoutMode?: LayoutMode;
  /** Current spread (only provided in landscape mode) */
  spread?: Spread;
}

/**
 * Sticky progress bar at the top of the immersive reader.
 *
 * - Segmented bar (one segment per page)
 * - Filled segments = visited pages
 * - Page counter: "3 / 8" or "3–4 / 8" in landscape spread mode
 * - Chapter label for chapter stories: "Kapitel 2 von 5"
 */
const ImmersiveProgressBar: React.FC<ImmersiveProgressBarProps> = ({
  currentPage,
  totalPages,
  chapterNumber,
  totalChapters,
  language,
  layoutMode,
  spread,
}) => {
  const labels = getImmersiveLabels(language);
  const isLandscape = layoutMode === 'landscape-spread';

  // In landscape mode with a spread showing two pages, highlight both
  const highestVisiblePage = (isLandscape && spread?.rightPageIndex != null)
    ? spread.rightPageIndex
    : currentPage;

  // Page counter text
  const counterText = (isLandscape && spread?.rightPageIndex != null)
    ? `${spread.leftPageIndex + 1}–${spread.rightPageIndex + 1} / ${totalPages}`
    : `${currentPage + 1} / ${totalPages}`;

  return (
    <div
      className="immersive-progress-bar sticky top-0 z-30 backdrop-blur-sm pt-3 pb-2 px-4 sm:px-6"
      style={{ backgroundColor: 'rgba(255, 249, 240, 0.95)' }}
    >
      {/* Chapter label (only for chapter stories) */}
      {chapterNumber && totalChapters && (
        <div className="text-xs font-medium text-muted-foreground mb-1.5 text-center">
          {t(labels.chapterOf, { current: chapterNumber, total: totalChapters })}
        </div>
      )}

      {/* Segmented progress bar */}
      <div className="flex gap-1 w-full mb-1">
        {Array.from({ length: totalPages }, (_, i) => (
          <div
            key={i}
            className="h-1.5 rounded-full flex-1 transition-colors duration-300"
            style={{
              backgroundColor: i <= highestVisiblePage
                ? FABLINO_TEAL
                : 'hsl(var(--muted))',
            }}
          />
        ))}
      </div>

      {/* Page counter */}
      <div className="text-right text-xs text-muted-foreground tabular-nums">
        {counterText}
      </div>
    </div>
  );
};

export default ImmersiveProgressBar;
