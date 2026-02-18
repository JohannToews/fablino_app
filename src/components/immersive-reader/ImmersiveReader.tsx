import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { useImmersiveLayout } from './useImmersiveLayout';
import { useContentSplitter, normalizeToParagraphs } from './useContentSplitter';
import { usePagePosition } from './usePagePosition';
import { useSyllableColoring } from './useSyllableColoring';
import { resetLiveLog, preloadSyllables, isFrenchReady } from '@/lib/syllabify';
import {
  getTypographyForAge,
  PAGE_TRANSITION_MS,
  PAGE_TRANSITION_EASING,
  NAV_HINT_TIMEOUT_MS,
  NAV_HINT_STORAGE_KEY,
  Spread,
  buildSpreads,
} from './constants';
import {
  getImagePositionsFromPlan,
  getVisibleImages,
  buildImageArray,
  getImageSide,
  parseImagePlan,
} from './imageUtils';
import { getImmersiveLabels } from './labels';
import ImmersivePageRenderer, { ImmersiveSpreadRenderer } from './ImmersivePageRenderer';
import ImmersiveNavigation from './ImmersiveNavigation';
import ImmersiveProgressBar from './ImmersiveProgressBar';
import ImmersiveWordSheet from './ImmersiveWordSheet';
import ImmersiveToolbar from './ImmersiveToolbar';
import ImmersiveChapterTitle from './ImmersiveChapterTitle';
import ImmersiveQuizFlow from './ImmersiveQuizFlow';
import ImmersiveEndScreen from './ImmersiveEndScreen';

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
  hasQuiz?: boolean;
  quizPassThreshold?: number;
  onComplete: () => void;
  onQuizComplete?: (correctCount: number, totalCount: number) => void;
  onNavigateToStories?: () => void;
  onNextChapter?: () => void;
  onNewStory?: () => void;
  /** Result from log_activity RPC, set externally after onComplete fires */
  activityResult?: Record<string, unknown> | null;
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
  hasQuiz = false,
  quizPassThreshold = 80,
  onComplete,
  onQuizComplete,
  onNavigateToStories,
  onNextChapter,
  onNewStory,
  activityResult,
}) => {
  const readerRef = useRef<HTMLDivElement>(null);

  // ── Layout & Typography ───────────────────────────────────
  const layoutMode = useImmersiveLayout();
  const age = kidProfile?.age || 8;
  const storyLanguage = story.text_language || 'de';
  const uiLanguage = storyLanguage; // Use story language for UI labels
  const labels = getImmersiveLabels(uiLanguage);

  const typography = useMemo(
    () => getTypographyForAge(age),
    [age]
  );

  // ── Syllable Coloring ─────────────────────────────────────
  const [syllableModeEnabled, setSyllableModeEnabled] = useState(false);
  const { isActive: syllableActive, hyphenLanguage } = useSyllableColoring(
    storyLanguage,
    syllableModeEnabled
  );

  // FR async preload: cache all words before enabling syllable rendering
  const needsPreload = storyLanguage.toLowerCase().startsWith('fr');
  const [syllablesReady, setSyllablesReady] = useState(!needsPreload);
  const [, setForceUpdate] = useState(0);

  useEffect(() => {
    if (!needsPreload) {
      setSyllablesReady(true);
      return;
    }
    if (isFrenchReady()) {
      setSyllablesReady(true);
      return;
    }
    let cancelled = false;
    preloadSyllables(story.content, storyLanguage).then(() => {
      if (!cancelled) {
        setSyllablesReady(true);
        setForceUpdate(prev => prev + 1);
      }
    });
    return () => { cancelled = true; };
  }, [story.id, storyLanguage, needsPreload, story.content]);

  const effectiveSyllableActive = syllableActive && syllablesReady;

  // ── Images ────────────────────────────────────────────────
  const allImages = useMemo(
    () => buildImageArray(story.cover_image_url, story.story_images),
    [story.cover_image_url, story.story_images]
  );
  const visibleImages = useMemo(
    () => getVisibleImages(allImages, accountTier),
    [allImages, accountTier]
  );

  // Paragraph count for image position calculation.
  // Uses same normalization logic as useContentSplitter.
  const paragraphCount = useMemo(() => {
    let text = story.content
      .replace(/\\n/g, '\n')
      .replace(/\r\n/g, '\n')
      .replace(/\n{2,}/g, '\n\n');
    let paras = text.split('\n\n').map(p => p.trim()).filter(Boolean);
    if (paras.length <= 1 && text.includes('\n')) {
      paras = text.split('\n').map(p => p.trim()).filter(Boolean);
    }
    return paras.length;
  }, [story.content]);

  const imagePlan = useMemo(() => parseImagePlan(story.image_plan), [story.image_plan]);
  const imagePositions = useMemo(
    () => getImagePositionsFromPlan(imagePlan, paragraphCount, visibleImages.length),
    [imagePlan, paragraphCount, visibleImages.length]
  );

  // ── Cover page logic ─────────────────────────────────────
  // ALL stories get a cover page showing title + first paragraph.
  // The splitter skips the first paragraph so it's not duplicated.
  const isChapterStory = !!(story.series_id && story.episode_number);
  const chapterNumber = story.episode_number || 1;
  const totalChapters = story.series_episode_count || 5;
  const hasCoverPage = !!(story.cover_image_url || story.title);

  const firstParagraph = useMemo(() => {
    if (!hasCoverPage) return null;
    const paras = normalizeToParagraphs(story.content);
    return paras.length > 0 ? paras[0] : null;
  }, [story.content, hasCoverPage]);

  // ── Content Splitting ─────────────────────────────────────
  const contentPages = useContentSplitter(
    story.content,
    age,
    imagePositions,
    hasCoverPage, // skip first paragraph — it's on the cover page
  );

  const allPages = useMemo(() => {
    const pages = [...contentPages];

    // Insert cover/title page at the beginning for all stories
    if (hasCoverPage) {
      pages.unshift({
        paragraphs: [],
        hasImage: false,
        type: 'chapter-title',
      });
    }

    return pages;
  }, [contentPages, hasCoverPage]);

  // ── Page Position ─────────────────────────────────────────
  const {
    currentPage,
    totalPages,
    goToPage,
    goNext: rawGoNext,
    goPrev: rawGoPrev,
    isFirstPage,
    isLastPage,
  } = usePagePosition(allPages);

  // ── Spreads (landscape double-page layout) ─────────────
  const isLandscape = layoutMode === 'landscape-spread';
  const spreads = useMemo(
    () => buildSpreads(allPages, isLandscape),
    [allPages, isLandscape]
  );

  // Map currentPage → current spread index
  const currentSpreadIndex = useMemo(() => {
    for (let si = 0; si < spreads.length; si++) {
      const s = spreads[si];
      if (s.leftPageIndex === currentPage) return si;
      if (s.rightPageIndex === currentPage) return si;
    }
    return 0;
  }, [spreads, currentPage]);

  const currentSpread = spreads[currentSpreadIndex] || spreads[0];
  const isFirstSpread = currentSpreadIndex === 0;
  const isLastSpread = currentSpreadIndex === spreads.length - 1;

  // ── Reader Phase (reading → quiz → end) ────────────────
  type ReaderPhase = 'reading' | 'quiz' | 'end-screen';
  const [readerPhase, setReaderPhase] = useState<ReaderPhase>('reading');
  const [quizResult, setQuizResult] = useState<{ correctCount: number; totalCount: number; starsEarned: number } | null>(null);

  // Determine end screen variant
  const endScreenVariant = useMemo(() => {
    if (!isChapterStory) return 'single' as const;
    const isLastEpisode = chapterNumber >= totalChapters;
    return isLastEpisode ? 'series-complete' as const : 'chapter' as const;
  }, [isChapterStory, chapterNumber, totalChapters]);

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

  /**
   * Helper: check if we're on the very last viewable unit (page or spread).
   * Used to trigger completion flow.
   */
  const isAtEnd = isLandscape ? isLastSpread : isLastPage;

  const goNext = useCallback(() => {
    if (isTransitioning || isAtEnd) return;
    resetLiveLog();

    // If on last viewable unit: fire onComplete and transition to quiz or end screen
    const reachedEnd = isLandscape
      ? currentSpreadIndex === spreads.length - 1
      : currentPage === totalPages - 1;

    if (reachedEnd) {
      onComplete();
      if (isChapterStory && hasQuiz) {
        setReaderPhase('quiz');
      } else {
        setReaderPhase('end-screen');
      }
      return;
    }

    setSlideDirection('left');
    setIsTransitioning(true);
    setTimeout(() => {
      if (isLandscape) {
        // Advance to the left page of the NEXT spread
        const nextSpread = spreads[currentSpreadIndex + 1];
        if (nextSpread) {
          goToPage(nextSpread.leftPageIndex);
        }
      } else {
        rawGoNext();
      }
      setSlideDirection('none');
      setIsTransitioning(false);
    }, PAGE_TRANSITION_MS);
  }, [isTransitioning, isAtEnd, isLandscape, currentSpreadIndex, spreads, currentPage, totalPages, rawGoNext, goToPage, onComplete, isChapterStory, hasQuiz]);

  const goPrev = useCallback(() => {
    const atStart = isLandscape ? isFirstSpread : isFirstPage;
    if (isTransitioning || atStart) return;
    resetLiveLog();

    setSlideDirection('right');
    setIsTransitioning(true);
    setTimeout(() => {
      if (isLandscape) {
        const prevSpread = spreads[currentSpreadIndex - 1];
        if (prevSpread) {
          goToPage(prevSpread.leftPageIndex);
        }
      } else {
        rawGoPrev();
      }
      setSlideDirection('none');
      setIsTransitioning(false);
    }, PAGE_TRANSITION_MS);
  }, [isTransitioning, isLandscape, isFirstSpread, isFirstPage, currentSpreadIndex, spreads, rawGoPrev, goToPage]);

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

  // ── Resolve current page content (portrait mode) ──────────
  const currentPageData = allPages[currentPage];
  const isChapterTitlePage = currentPageData?.type === 'chapter-title';

  // Track which image page we're on for portrait image alternation
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

  // ── Shared typography props for spread renderer ──────────
  const typoProps = useMemo(() => ({
    fontSize: typography.fontSize,
    lineHeight: typography.lineHeight,
    letterSpacing: typography.letterSpacing,
    syllableMode: effectiveSyllableActive,
    storyLanguage: hyphenLanguage,
    onWordTap: handleWordTap,
    highlightedWord: selectedWord,
  }), [typography, effectiveSyllableActive, hyphenLanguage, handleWordTap, selectedWord]);

  // ── Slide animation CSS ───────────────────────────────────
  const slideStyle: React.CSSProperties = useMemo(() => {
    if (slideDirection === 'none') return {};
    return {
      transform: slideDirection === 'left' ? 'translateX(-100%)' : 'translateX(100%)',
      transition: `transform ${PAGE_TRANSITION_MS}ms ${PAGE_TRANSITION_EASING}`,
      opacity: 0.3,
    };
  }, [slideDirection]);

  // ── Quiz / End Screen handlers ─────────────────────────
  const handleQuizComplete = useCallback((correctCount: number, totalCount: number) => {
    setQuizResult({ correctCount, totalCount, starsEarned: 0 });
    setReaderPhase('end-screen');
    onQuizComplete?.(correctCount, totalCount);
  }, [onQuizComplete]);

  const handleQuizRetry = useCallback(() => {
    setReaderPhase('reading');
    setQuizResult(null);
    goToPage(hasCoverPage ? 1 : 0);
  }, [hasCoverPage, goToPage]);

  const handleStartQuizFromEndScreen = useCallback(() => {
    setReaderPhase('quiz');
  }, []);

  const handleReadAgain = useCallback(() => {
    setReaderPhase('reading');
    setQuizResult(null);
    goToPage(0);
  }, [goToPage]);

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
      className="immersive-reader min-h-screen flex flex-col"
      style={{
        backgroundColor: '#FFF9F0',
        ...(isFullscreen ? { width: '100%', height: '100%' } : {}),
      }}
    >
      {/* Progress Bar (only during reading phase) */}
      {readerPhase === 'reading' && (
        <div className="relative">
          <ImmersiveProgressBar
            currentPage={currentPage}
            totalPages={totalPages}
            chapterNumber={isChapterStory ? chapterNumber : undefined}
            totalChapters={isChapterStory ? totalChapters : undefined}
            language={uiLanguage}
            layoutMode={layoutMode}
            spread={isLandscape ? currentSpread : undefined}
          />
          {/* Fullscreen button — always visible top-right */}
          {typeof document !== 'undefined' && document.fullscreenEnabled && (
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              className="absolute top-2 right-2 z-50 flex items-center justify-center h-8 w-8 rounded-lg transition-colors"
              style={{
                background: 'rgba(255, 255, 255, 0.8)',
                border: '1px solid #E5E7EB',
              }}
            >
              <span className="text-sm leading-none">
                {isFullscreen ? '✕' : '⛶'}
              </span>
            </button>
          )}
        </div>
      )}

      {/* ═══ READING PHASE ═══ */}
      {readerPhase === 'reading' && (
        <ImmersiveNavigation
          onNext={goNext}
          onPrev={goPrev}
          disabled={isWordSheetOpen || isTransitioning}
        >
          <div className="flex-1 relative overflow-hidden" style={slideStyle}>

            {/* ── Landscape Spread Mode ── */}
            {isLandscape && currentSpread && (
              <>
                {/* Chapter title as single spread page */}
                {currentSpread.left.type === 'chapter-title' ? (
                  <ImmersiveChapterTitle
                    key={`cover-landscape-syl-${effectiveSyllableActive}`}
                    chapterNumber={isChapterStory ? chapterNumber : undefined}
                    totalChapters={isChapterStory ? totalChapters : undefined}
                    title={story.title}
                    coverImageUrl={story.cover_image_url}
                    language={uiLanguage}
                    layoutMode={layoutMode}
                    firstParagraph={firstParagraph}
                    fontSize={typography.fontSize}
                    lineHeight={typography.lineHeight}
                    letterSpacing={typography.letterSpacing}
                    syllableMode={effectiveSyllableActive}
                    storyLanguage={hyphenLanguage}
                  />
                ) : (
                  <ImmersiveSpreadRenderer
                    key={`spread-${currentSpreadIndex}-syl-${effectiveSyllableActive}`}
                    spread={currentSpread}
                    visibleImages={visibleImages}
                    storyTheme={story.concrete_theme}
                    typo={typoProps}
                  />
                )}
              </>
            )}

            {/* ── Portrait Single-Page Mode ── */}
            {!isLandscape && (
              <>
                {/* Chapter Title Page */}
                {isChapterTitlePage && (
                  <ImmersiveChapterTitle
                    key={`cover-portrait-syl-${effectiveSyllableActive}`}
                    chapterNumber={isChapterStory ? chapterNumber : undefined}
                    totalChapters={isChapterStory ? totalChapters : undefined}
                    title={story.title}
                    coverImageUrl={story.cover_image_url}
                    language={uiLanguage}
                    layoutMode={layoutMode}
                    firstParagraph={firstParagraph}
                    fontSize={typography.fontSize}
                    lineHeight={typography.lineHeight}
                    letterSpacing={typography.letterSpacing}
                    syllableMode={effectiveSyllableActive}
                    storyLanguage={hyphenLanguage}
                  />
                )}

                {/* Content Pages (text-only or image-text) */}
                {!isChapterTitlePage && currentPageData && (
                  <ImmersivePageRenderer
                    key={`page-${currentPage}-syl-${effectiveSyllableActive}`}
                    page={currentPageData}
                    layoutMode={layoutMode}
                    imageUrl={currentImageUrl}
                    imageSide={currentImageSide}
                    storyTheme={story.concrete_theme}
                    fontSize={typography.fontSize}
                    lineHeight={typography.lineHeight}
                    letterSpacing={typography.letterSpacing}
                    syllableMode={effectiveSyllableActive}
                    storyLanguage={hyphenLanguage}
                    onWordTap={handleWordTap}
                    highlightedWord={selectedWord}
                  />
                )}
              </>
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
      )}

      {/* ═══ QUIZ PHASE ═══ */}
      {readerPhase === 'quiz' && (
        <div className="flex-1">
          <ImmersiveQuizFlow
            storyId={story.id}
            storyLanguage={storyLanguage}
            isMandatory={isChapterStory}
            passThreshold={quizPassThreshold}
            onComplete={handleQuizComplete}
            onRetry={handleQuizRetry}
          />
        </div>
      )}

      {/* ═══ END SCREEN PHASE ═══ */}
      {readerPhase === 'end-screen' && (
        <div className="flex-1">
          <ImmersiveEndScreen
            variant={endScreenVariant}
            storyLanguage={storyLanguage}
            activityResult={activityResult as Record<string, unknown> | undefined}
            quizResult={quizResult}
            chapterNumber={chapterNumber}
            totalChapters={totalChapters}
            hasQuiz={hasQuiz}
            quizTaken={!!quizResult}
            onStartQuiz={handleStartQuizFromEndScreen}
            onNewStory={onNewStory || onNavigateToStories}
            onReadAgain={handleReadAgain}
            onNextChapter={onNextChapter}
            onMyStories={onNavigateToStories}
            onNewChapterStory={onNewStory}
          />
        </div>
      )}

      {/* Toolbar (font size, syllables, fullscreen) — only during reading */}
      {readerPhase === 'reading' && (
        <ImmersiveToolbar
          syllableMode={syllableModeEnabled}
          onSyllableModeChange={setSyllableModeEnabled}
          isFullscreen={isFullscreen}
          onToggleFullscreen={toggleFullscreen}
          storyLanguage={storyLanguage}
          uiLanguage={uiLanguage}
        />
      )}

      {/* Word Explanation Bottom Sheet — only during reading */}
      {readerPhase === 'reading' && (
        <ImmersiveWordSheet
          word={selectedWord}
          storyId={story.id}
          storyLanguage={storyLanguage}
          explanationLanguage={kidProfile?.explanation_language || storyLanguage}
          kidProfileId={kidProfile?.id}
          onClose={handleWordSheetClose}
          onSaved={handleWordSaved}
        />
      )}
    </div>
  );
};

export default ImmersiveReader;
