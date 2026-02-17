import React from 'react';
import { FABLINO_TEAL } from './constants';
import { getImmersiveLabels, t } from './labels';

interface ImmersiveProgressBarProps {
  currentPage: number;
  totalPages: number;
  chapterNumber?: number | null;
  totalChapters?: number | null;
  language?: string | null;
}

/**
 * Sticky progress bar at the top of the immersive reader.
 *
 * - Segmented bar (one segment per page)
 * - Filled segments = visited pages
 * - Page counter: "3 / 8"
 * - Chapter label for chapter stories: "Kapitel 2 von 5"
 */
const ImmersiveProgressBar: React.FC<ImmersiveProgressBarProps> = ({
  currentPage,
  totalPages,
  chapterNumber,
  totalChapters,
  language,
}) => {
  const labels = getImmersiveLabels(language);

  return (
    <div className="immersive-progress-bar sticky top-0 z-30 bg-background/95 backdrop-blur-sm pt-3 pb-2 px-4 sm:px-6">
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
              backgroundColor: i <= currentPage
                ? FABLINO_TEAL
                : 'hsl(var(--muted))',
            }}
          />
        ))}
      </div>

      {/* Page counter */}
      <div className="text-right text-xs text-muted-foreground tabular-nums">
        {currentPage + 1} / {totalPages}
      </div>
    </div>
  );
};

export default ImmersiveProgressBar;
