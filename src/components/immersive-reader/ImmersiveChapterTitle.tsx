import React from 'react';
import { getImmersiveLabels, t } from './labels';
import { FABLINO_TEAL } from './constants';

interface ImmersiveChapterTitleProps {
  chapterNumber: number;
  totalChapters: number;
  title: string;
  coverImageUrl: string | null;
  language?: string | null;
}

/**
 * Chapter title page for series/chapter stories.
 *
 * Rendered before the first text page of each episode.
 * Shows chapter number, episode title, cover image, and total chapter count.
 */
const ImmersiveChapterTitle: React.FC<ImmersiveChapterTitleProps> = ({
  chapterNumber,
  totalChapters,
  title,
  coverImageUrl,
  language,
}) => {
  const labels = getImmersiveLabels(language);

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] px-6 py-8 text-center">
      {/* Chapter badge */}
      <div
        className="inline-flex items-center gap-2 px-5 py-2 rounded-full text-white text-sm font-semibold mb-6 shadow-md"
        style={{ backgroundColor: FABLINO_TEAL }}
      >
        {labels.chapter} {chapterNumber}
      </div>

      {/* Episode title */}
      <h1
        className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8 max-w-lg leading-tight"
        style={{ fontFamily: "'Nunito', sans-serif" }}
      >
        {title}
      </h1>

      {/* Cover image */}
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
        <div
          className="w-full max-w-sm h-48 rounded-2xl mb-8 flex items-center justify-center opacity-40"
          style={{ background: `linear-gradient(135deg, ${FABLINO_TEAL}40, ${FABLINO_TEAL}20)` }}
        >
          <span className="text-6xl">📖</span>
        </div>
      )}

      {/* Chapter counter */}
      <p className="text-sm text-muted-foreground">
        {t(labels.chapterOf, { current: chapterNumber, total: totalChapters })}
      </p>
    </div>
  );
};

export default ImmersiveChapterTitle;
