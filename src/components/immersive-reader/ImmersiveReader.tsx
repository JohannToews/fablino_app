import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useImmersiveLayout } from './useImmersiveLayout';
import { useContentSplitter } from './useContentSplitter';
import { usePagePosition } from './usePagePosition';
import { useSyllableColoring } from './useSyllableColoring';
import {
  FontSizeSetting,
  getTypographyForAge,
  PAGE_TRANSITION_MS,
  PAGE_TRANSITION_EASING,
  NAV_HINT_TIMEOUT_MS,
  NAV_HINT_STORAGE_KEY,
} from './constants';
import {
  getImagePositionsFromPlan,
  getVisibleImages,
  buildImageArray,
  getImageSide,
  parseImagePlan,
} from './imageUtils';
import { getImmersiveLabels } from './labels';
import ImmersivePageRenderer from './ImmersivePageRenderer';
import ImmersiveNavigation from './ImmersiveNavigation';
import ImmersiveProgressBar from './ImmersiveProgressBar';
import ImmersiveWordSheet from './ImmersiveWordSheet';
import ImmersiveToolbar from './ImmersiveToolbar';
import ImmersiveChapterTitle from './ImmersiveChapterTitle';

// Minimal Story interface — matches the shape used in ReadingPage.tsx
interface Story {
  id: string;
  title: string;
  content: string;
  cover_image_url: string | null;
  story_images?: string[] | null;
  text_language?: string;
  series_id?: string | null;
  episode_number?: number | null;
  series_episode_count?: number | null;
  ending_type?: 'A' | 'B' | 'C' | null;
  concrete_theme?: string | null;
  kid_profile_id?: string | null;
  difficulty?: string;
  image_plan?: unknown;
}

interface KidProfile {
  id: string;
  name: string;
  age?: number | null;
  explanation_language?: string | null;
}

export interface ImmersiveReaderProps {
  story: Story;
  kidProfile: KidProfile | null;
  accountTier?: string;
  onComplete: () => void;
  onQuizStart?: () => void;
  onNavigateToStories?: () => void;
}

/**
 * Main Immersive Reader orchestrator.
 *
 * Combines all sub-components: layout detection, content splitting, page rendering,
 * navigation, progress bar, word explanation sheet, toolbar, and chapter title pages.
 */
const ImmersiveReader: React.FC<ImmersiveReaderProps> = ({
  story,
  kidProfile,
  accountTier = 'standard',
  onComplete,
  onQuizStart,
  onNavigateToStories,
}) => {
  const readerRef = useRef<HTMLDivElement>(null);

  // ── Layout & Typography ───────────────────────────────────
  const layoutMode = useImmersiveLayout();
  const age = kidProfile?.age || 8;
  const storyLanguage = story.text_language || 'de';
  const uiLanguage = storyLanguage; // Use story language for UI labels
  const labels = getImmersiveLabels(uiLanguage);

  const [fontSizeSetting, setFontSizeSetting] = useState<FontSizeSetting>('medium');
  const typography = useMemo(
    () => getTypographyForAge(age, fontSizeSetting),
    [age, fontSizeSetting]
  );

  // ── Syllable Coloring ─────────────────────────────────────
  const [syllableModeEnabled, setSyllableModeEnabled] = useState(false);
  const { isActive: syllableActive, hyphenLanguage } = useSyllableColoring(
    storyLanguage,
    syllableModeEnabled
  );

  // ── Images ────────────────────────────────────────────────
  const allImages = useMemo(
    () => buildImageArray(story.cover_image_url, story.story_images),
    [story.cover_image_url, story.story_images]
  );
  const visibleImages = useMemo(
    () => getVisibleImages(allImages, accountTier),
    [allImages, accountTier]
  );

  // Normalize story content (handle escaped newlines)
  const normalizedContent = useMemo(() => {
    return story.content
      .replace(/\\n\\n/g, '\n\n')
      .replace(/\\n/g, '\n');
  }, [story.content]);

  const paragraphCount = useMemo(
    () => normalizedContent.split('\n\n').filter(p => p.trim()).length,
    [normalizedContent]
  );

  const imagePlan = useMemo(() => parseImagePlan(story.image_plan), [story.image_plan]);
  const imagePositions = useMemo(
    () => getImagePositionsFromPlan(imagePlan, paragraphCount, visibleImages.length),
    [imagePlan, paragraphCount, visibleImages.length]
  );

  // ── Content Splitting ─────────────────────────────────────
  const contentPages = useContentSplitter(
    normalizedContent,
    age,
    fontSizeSetting,
    imagePositions
  );

  // ── Build final page list (chapter title + content + end) ─
  const isChapterStory = !!(story.series_id && story.episode_number);
  const chapterNumber = story.episode_number || 1;
  const totalChapters = story.series_episode_count || 5;

  const allPages = useMemo(() => {
    const pages = [...contentPages];

    // Insert chapter title page at the beginning for chapter stories
    if (isChapterStory) {
      pages.unshift({
        paragraphs: [],
        hasImage: false,
        type: 'chapter-title',
      });
    }

    return pages;
  }, [contentPages, isChapterStory]);

  // ── Page Position ─────────────────────────────────────────
  const {
    currentPage,
    totalPages,
    goNext: rawGoNext,
    goPrev: rawGoPrev,
    isFirstPage,
    isLastPage,
  } = usePagePosition(allPages);

  // ── Word Explanation ──────────────────────────────────────
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const isWordSheetOpen = selectedWord !== null;

  const handleWordTap = useCallback((word: string) => {
    const clean = word.replace(/[.,!?;:'"«»\-–—()[\]{}]/g, '').toLowerCase();
    if (clean.length >= 3) {
      setSelectedWord(clean);
    }
  }, []);

  const handleWordSheetClose = useCallback(() => {
    setSelectedWord(null);
  }, []);

  const handleWordSaved = useCallback(() => {
    // Could trigger a toast or update count — for now just a hook point
  }, []);

  // ── Navigation ────────────────────────────────────────────
  const [slideDirection, setSlideDirection] = useState<'none' | 'left' | 'right'>('none');
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goNext = useCallback(() => {
    if (isTransitioning || isLastPage) return;

    // If on last page: trigger completion
    if (currentPage === totalPages - 1) {
      onComplete();
      return;
    }

    setSlideDirection('left');
    setIsTransitioning(true);
    setTimeout(() => {
      rawGoNext();
      setSlideDirection('none');
      setIsTransitioning(false);
    }, PAGE_TRANSITION_MS);
  }, [isTransitioning, isLastPage, currentPage, totalPages, rawGoNext, onComplete]);

  const goPrev = useCallback(() => {
    if (isTransitioning || isFirstPage) return;

    setSlideDirection('right');
    setIsTransitioning(true);
    setTimeout(() => {
      rawGoPrev();
      setSlideDirection('none');
      setIsTransitioning(false);
    }, PAGE_TRANSITION_MS);
  }, [isTransitioning, isFirstPage, rawGoPrev]);

  // ── Navigation Hint ───────────────────────────────────────
  const [showNavHint, setShowNavHint] = useState(false);

  useEffect(() => {
    const alreadyShown = localStorage.getItem(NAV_HINT_STORAGE_KEY);
    if (!alreadyShown && currentPage === 0) {
      setShowNavHint(true);
      const timer = setTimeout(() => setShowNavHint(false), NAV_HINT_TIMEOUT_MS);
      return () => clearTimeout(timer);
    }
  }, []); // Only on mount

  // Hide hint on first navigation
  useEffect(() => {
    if (currentPage > 0 && showNavHint) {
      setShowNavHint(false);
      localStorage.setItem(NAV_HINT_STORAGE_KEY, 'true');
    }
  }, [currentPage, showNavHint]);

  // ── Fullscreen ────────────────────────────────────────────
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      setIsFullscreen(false);
    } else if (readerRef.current?.requestFullscreen) {
      readerRef.current.requestFullscreen();
      setIsFullscreen(true);
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // ── Resolve current page content ──────────────────────────
  const currentPageData = allPages[currentPage];
  const isChapterTitlePage = currentPageData?.type === 'chapter-title';

  // Track which image page we're on for landscape alternation
  const imagePageIndex = useMemo(() => {
    let count = 0;
    for (let i = 0; i < currentPage; i++) {
      if (allPages[i]?.hasImage) count++;
    }
    return count;
  }, [allPages, currentPage]);

  const currentImageUrl = currentPageData?.hasImage && currentPageData.imageIndex !== undefined
    ? visibleImages[currentPageData.imageIndex]
    : undefined;

  const currentImageSide = currentImageUrl ? getImageSide(imagePageIndex) : undefined;

  // ── Slide animation CSS ───────────────────────────────────
  const slideStyle: React.CSSProperties = useMemo(() => {
    if (slideDirection === 'none') return {};
    return {
      transform: slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
      transition: `transform ${PAGE_TRANSITION_MS}ms ${PAGE_TRANSITION_EASING}`,
      opacity: 0.3,
    };
  }, [slideDirection]);

  // ── Render ────────────────────────────────────────────────
  if (!story.content || allPages.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">
        No content available.
      </div>
    );
  }

  return (
    <div
      ref={readerRef}
      className="immersive-reader bg-background min-h-screen flex flex-col"
    >
      {/* Progress Bar */}
      <ImmersiveProgressBar
        currentPage={currentPage}
        totalPages={totalPages}
        chapterNumber={isChapterStory ? chapterNumber : undefined}
        totalChapters={isChapterStory ? totalChapters : undefined}
        language={uiLanguage}
      />

      {/* Main page area with navigation */}
      <ImmersiveNavigation
        onNext={goNext}
        onPrev={goPrev}
        disabled={isWordSheetOpen || isTransitioning}
      >
        <div className="flex-1 relative overflow-hidden" style={slideStyle}>
          {/* Chapter Title Page */}
          {isChapterTitlePage && (
            <ImmersiveChapterTitle
              chapterNumber={chapterNumber}
              totalChapters={totalChapters}
              title={story.title}
              coverImageUrl={story.cover_image_url}
              language={uiLanguage}
            />
          )}

          {/* Content Pages (text-only or image-text) */}
          {!isChapterTitlePage && currentPageData && (
            <ImmersivePageRenderer
              page={currentPageData}
              layoutMode={layoutMode}
              imageUrl={currentImageUrl}
              imageSide={currentImageSide}
              storyTheme={story.concrete_theme}
              fontSize={typography.fontSize}
              lineHeight={typography.lineHeight}
              letterSpacing={typography.letterSpacing}
              syllableMode={syllableActive}
              storyLanguage={hyphenLanguage}
              onWordTap={handleWordTap}
              highlightedWord={selectedWord}
            />
          )}
        </div>

        {/* Navigation hint (first page, first time only) */}
        {showNavHint && currentPage === 0 && (
          <div className="absolute bottom-20 left-0 right-0 flex justify-center pointer-events-none">
            <div className="bg-foreground/80 text-background px-6 py-3 rounded-full text-sm font-medium animate-bounce shadow-lg">
              {labels.tapToContinue}
            </div>
          </div>
        )}
      </ImmersiveNavigation>

      {/* Toolbar (font size, syllables, fullscreen) */}
      <ImmersiveToolbar
        fontSizeSetting={fontSizeSetting}
        onFontSizeChange={setFontSizeSetting}
        syllableMode={syllableModeEnabled}
        onSyllableModeChange={setSyllableModeEnabled}
        isFullscreen={isFullscreen}
        onToggleFullscreen={toggleFullscreen}
        storyLanguage={storyLanguage}
        uiLanguage={uiLanguage}
      />

      {/* Word Explanation Bottom Sheet */}
      <ImmersiveWordSheet
        word={selectedWord}
        storyId={story.id}
        storyLanguage={storyLanguage}
        explanationLanguage={kidProfile?.explanation_language || storyLanguage}
        kidProfileId={kidProfile?.id}
        onClose={handleWordSheetClose}
        onSaved={handleWordSaved}
      />
    </div>
  );
};

export default ImmersiveReader;
