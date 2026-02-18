import { useMemo, useState, useEffect } from 'react';
import {
  ImmersivePage,
  getMaxWordsPerPage,
  getTypographyForAge,
  MIN_PAGES,
  MIN_PAGES_REDUCTION_FACTOR,
  MAX_PAGES,
  MAX_PAGES_INCREASE_FACTOR,
} from './constants';

// ── Helpers ──────────────────────────────────────────────────

function countWords(text: string): number {
  return text.split(/\s+/).filter(Boolean).length;
}

/**
 * Normalize content into clean paragraphs.
 *
 * LLM-generated stories use inconsistent newline patterns:
 *  - `\\n\\n` (escaped double), `\n\n` (real double), `\\n` (escaped single), `\n` (real single)
 *
 * Strategy:
 *  1. Unescape literal `\\n` → real newlines
 *  2. Collapse 2+ consecutive newlines into a paragraph break marker
 *  3. Single remaining newlines also become paragraph breaks
 *     (stories rarely use intentional soft-wraps)
 *  4. Filter empty paragraphs
 */
export function normalizeToParagraphs(content: string): string[] {
  let text = content
    .replace(/\\n/g, '\n')          // unescape literal \n
    .replace(/\r\n/g, '\n')         // normalize CRLF
    .replace(/\n{2,}/g, '\n\n');    // collapse 3+ newlines → double

  // Split at double-newlines first
  let paragraphs = text.split('\n\n').map(p => p.trim()).filter(Boolean);

  // If that produced only 1 huge block, try single newlines
  if (paragraphs.length <= 1 && text.includes('\n')) {
    paragraphs = text.split('\n').map(p => p.trim()).filter(Boolean);
  }

  return paragraphs;
}

function splitIntoSentences(text: string): string[] {
  return text.match(/[^.!?]+[.!?]+\s*/g) || [text];
}

// ── Pixel-based measurement ─────────────────────────────────

interface MeasureConfig {
  containerWidth: number;
  fontSize: number;
  lineHeight: number;
  letterSpacing: string;
}

function measureTextHeight(text: string, config: MeasureConfig): number {
  const div = document.createElement('div');
  div.style.cssText = `
    position: absolute;
    visibility: hidden;
    width: ${config.containerWidth}px;
    font-size: ${config.fontSize}px;
    line-height: ${config.lineHeight};
    letter-spacing: ${config.letterSpacing};
    font-family: 'Nunito', sans-serif;
    padding: 0;
    margin: 0;
    white-space: normal;
    word-wrap: break-word;
  `;
  div.innerHTML = text.replace(/\n\n/g, '<br><br>');
  document.body.appendChild(div);
  const height = div.scrollHeight;
  document.body.removeChild(div);
  return height;
}

// ── Page assembly ────────────────────────────────────────────

interface PageDraft {
  paragraphs: string[];
  wordCount: number;
  hasImage: boolean;
  imageIndex?: number;
}

function newDraft(): PageDraft {
  return { paragraphs: [], wordCount: 0, hasImage: false };
}

function finalizePage(draft: PageDraft): ImmersivePage {
  return {
    paragraphs: draft.paragraphs,
    hasImage: draft.hasImage,
    imageIndex: draft.imageIndex,
    type: draft.hasImage ? 'image-text' : 'text-only',
  };
}

/**
 * Pixel-based splitting: fills pages until the available height is reached.
 * Falls back to word-based limits as a safety net.
 */
function splitIntoPagesPixel(
  paragraphs: string[],
  maxHeight: number,
  measureConfig: MeasureConfig,
  imagePositions: number[],
  maxWordsFallback: number,
): ImmersivePage[] {
  const pages: ImmersivePage[] = [];
  let current: PageDraft = newDraft();
  let currentText = '';

  const paraToImageIdx = new Map<number, number>();
  imagePositions.forEach((paraIdx, imgIdx) => {
    paraToImageIdx.set(paraIdx, imgIdx);
  });

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const wc = countWords(para);

    const testText = currentText ? currentText + '\n\n' + para : para;
    const measuredHeight = measureTextHeight(testText, measureConfig);
    const wordOverflow = current.wordCount + wc > maxWordsFallback * 1.5;

    if ((measuredHeight > maxHeight || wordOverflow) && current.paragraphs.length > 0) {
      pages.push(finalizePage(current));
      current = newDraft();
      currentText = '';
    }

    // Check if this single paragraph alone is too tall
    if (current.paragraphs.length === 0) {
      const singleHeight = measureTextHeight(para, measureConfig);
      if (singleHeight > maxHeight) {
        const sentences = splitIntoSentences(para);
        let sentenceBuffer = '';
        let sentenceDraft: PageDraft = newDraft();

        if (paraToImageIdx.has(i)) {
          sentenceDraft.hasImage = true;
          sentenceDraft.imageIndex = paraToImageIdx.get(i);
        }

        for (const sentence of sentences) {
          const testSentence = sentenceBuffer ? sentenceBuffer + ' ' + sentence : sentence;
          const h = measureTextHeight(testSentence, measureConfig);

          if (h > maxHeight && sentenceBuffer) {
            sentenceDraft.paragraphs = [sentenceBuffer.trim()];
            sentenceDraft.wordCount = countWords(sentenceBuffer);
            pages.push(finalizePage(sentenceDraft));
            sentenceDraft = newDraft();
            sentenceBuffer = sentence;
          } else {
            sentenceBuffer = testSentence;
          }
        }

        if (sentenceBuffer.trim()) {
          current.paragraphs = [sentenceBuffer.trim()];
          current.wordCount = countWords(sentenceBuffer);
          currentText = sentenceBuffer.trim();
          if (paraToImageIdx.has(i) && !pages.some(p => p.imageIndex === paraToImageIdx.get(i))) {
            current.hasImage = true;
            current.imageIndex = paraToImageIdx.get(i);
          }
        }
        continue;
      }
    }

    current.paragraphs.push(para);
    current.wordCount += wc;
    currentText = currentText ? currentText + '\n\n' + para : para;

    if (paraToImageIdx.has(i)) {
      current.hasImage = true;
      current.imageIndex = paraToImageIdx.get(i);
    }
  }

  if (current.paragraphs.length > 0) {
    pages.push(finalizePage(current));
  }

  return pages;
}

/**
 * Word-based splitting (fallback for SSR or when DOM is unavailable).
 */
function splitIntoPages(
  paragraphs: string[],
  maxWordsPerPage: number,
  imagePositions: number[],
): ImmersivePage[] {
  const pages: ImmersivePage[] = [];
  let current: PageDraft = newDraft();

  const paraToImageIdx = new Map<number, number>();
  imagePositions.forEach((paraIdx, imgIdx) => {
    paraToImageIdx.set(paraIdx, imgIdx);
  });

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const wc = countWords(para);

    if (wc > maxWordsPerPage) {
      if (current.paragraphs.length > 0) {
        pages.push(finalizePage(current));
        current = newDraft();
      }

      const chunks = splitParagraphAtSentences(para, maxWordsPerPage);
      const hasImg = paraToImageIdx.has(i);

      for (let ci = 0; ci < chunks.length; ci++) {
        const assignImage = hasImg && ci === 0;
        pages.push(finalizePage({
          paragraphs: [chunks[ci]],
          wordCount: countWords(chunks[ci]),
          hasImage: assignImage,
          imageIndex: assignImage ? paraToImageIdx.get(i) : undefined,
        }));
      }
      continue;
    }

    if (current.wordCount + wc > maxWordsPerPage && current.paragraphs.length > 0) {
      pages.push(finalizePage(current));
      current = newDraft();
    }

    current.paragraphs.push(para);
    current.wordCount += wc;

    if (paraToImageIdx.has(i)) {
      current.hasImage = true;
      current.imageIndex = paraToImageIdx.get(i);
    }
  }

  if (current.paragraphs.length > 0) {
    pages.push(finalizePage(current));
  }

  return pages;
}

function splitParagraphAtSentences(para: string, maxWords: number): string[] {
  const chunks: string[] = [];
  let remaining = para;

  while (remaining.trim()) {
    const words = remaining.split(/\s+/).filter(Boolean);
    if (words.length <= maxWords) {
      chunks.push(remaining.trim());
      break;
    }

    const candidate = words.slice(0, maxWords).join(' ');
    const sentenceEndRegex = /[.!?]\s+/g;
    let lastBoundary = -1;
    let match: RegExpExecArray | null;

    while ((match = sentenceEndRegex.exec(candidate)) !== null) {
      lastBoundary = match.index + match[0].length - 1;
    }

    if (lastBoundary > 0) {
      const splitPoint = candidate.substring(0, lastBoundary + 1).trimEnd();
      chunks.push(splitPoint);
      remaining = remaining.substring(splitPoint.length).trimStart();
    } else {
      chunks.push(candidate);
      remaining = words.slice(maxWords).join(' ');
    }
  }

  return chunks.filter(c => c.length > 0);
}

// ── Sparse page merging ─────────────────────────────────────

const MIN_SPARSE_WORDS = 30;

function mergeSparsePages(pages: ImmersivePage[]): ImmersivePage[] {
  const result = [...pages];
  for (let i = 1; i < result.length - 1; i++) {
    const wc = result[i].paragraphs.join(' ').split(/\s+/).filter(Boolean).length;
    if (wc < MIN_SPARSE_WORDS && !result[i].hasImage) {
      result[i - 1] = {
        ...result[i - 1],
        paragraphs: [...result[i - 1].paragraphs, ...result[i].paragraphs],
      };
      result.splice(i, 1);
      i--;
    }
  }
  return result;
}

// ── Layout dimensions ────────────────────────────────────────

function getAvailableHeight(isLandscape: boolean): number {
  if (typeof window === 'undefined') return 600;
  const viewport = window.innerHeight;
  const toolbarAndProgress = 96;
  const paddingTopBottom = 80;
  return viewport - toolbarAndProgress - paddingTopBottom;
}

function getTextContainerWidth(isLandscape: boolean): number {
  if (typeof window === 'undefined') return 400;
  const viewport = window.innerWidth;
  if (isLandscape) {
    return (viewport / 2) - 64;
  }
  return Math.min(viewport - 48, 560);
}

// ── Public hook ──────────────────────────────────────────────

export function useContentSplitter(
  content: string,
  age: number,
  imagePositions: number[],
  skipParagraphCount: number | boolean = 0,
): ImmersivePage[] {
  const [windowSize, setWindowSize] = useState({
    w: typeof window !== 'undefined' ? window.innerWidth : 800,
    h: typeof window !== 'undefined' ? window.innerHeight : 600,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({ w: window.innerWidth, h: window.innerHeight });
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return useMemo(() => {
    if (!content || !content.trim()) return [];

    let paragraphs = normalizeToParagraphs(content);
    if (paragraphs.length === 0) return [];

    // Support both boolean (legacy) and number (how many paragraphs to skip)
    const skipCount = typeof skipParagraphCount === 'boolean'
      ? (skipParagraphCount ? 1 : 0)
      : skipParagraphCount;

    if (skipCount > 0 && paragraphs.length > skipCount) {
      paragraphs = paragraphs.slice(skipCount);
    }

    const totalWords = paragraphs.reduce((sum, p) => sum + countWords(p), 0);
    const maxWords = getMaxWordsPerPage(age);
    const typography = getTypographyForAge(age);

    const isLandscape = windowSize.w > 1024 && windowSize.w > windowSize.h;
    const availableHeight = getAvailableHeight(isLandscape);
    const containerWidth = getTextContainerWidth(isLandscape);

    const canMeasure = typeof document !== 'undefined';

    console.log('[ContentSplitter] age:', age, 'maxWords:', maxWords, 'totalWords:', totalWords, 'paragraphs:', paragraphs.length, 'skipped:', skipCount, 'pixelMode:', canMeasure, 'availableH:', availableHeight, 'containerW:', containerWidth);

    let pages: ImmersivePage[];

    if (canMeasure) {
      const measureConfig: MeasureConfig = {
        containerWidth,
        fontSize: typography.fontSize,
        lineHeight: typography.lineHeight,
        letterSpacing: typography.letterSpacing,
      };

      pages = splitIntoPagesPixel(
        paragraphs,
        availableHeight,
        measureConfig,
        imagePositions,
        maxWords,
      );
    } else {
      pages = splitIntoPages(paragraphs, maxWords, imagePositions);
    }

    // Guard: too many pages → re-split with more height tolerance
    if (pages.length > MAX_PAGES) {
      const boostedHeight = Math.round(availableHeight * MAX_PAGES_INCREASE_FACTOR);
      console.log('[ContentSplitter] Too many pages:', pages.length, '→ boosting height from', availableHeight, 'to', boostedHeight);
      if (canMeasure) {
        pages = splitIntoPagesPixel(
          paragraphs,
          boostedHeight,
          { containerWidth, fontSize: typography.fontSize, lineHeight: typography.lineHeight, letterSpacing: typography.letterSpacing },
          imagePositions,
          maxWords,
        );
      } else {
        const boostedWords = Math.round(maxWords * MAX_PAGES_INCREASE_FACTOR);
        pages = splitIntoPages(paragraphs, boostedWords, imagePositions);
      }
    }

    // Guard: too few pages → re-split with less height
    if (pages.length < MIN_PAGES && totalWords >= MIN_PAGES * 3) {
      const reducedHeight = Math.round(availableHeight * MIN_PAGES_REDUCTION_FACTOR);
      if (canMeasure) {
        pages = splitIntoPagesPixel(
          paragraphs,
          reducedHeight,
          { containerWidth, fontSize: typography.fontSize, lineHeight: typography.lineHeight, letterSpacing: typography.letterSpacing },
          imagePositions,
          maxWords,
        );
      } else {
        const reducedWords = Math.round(maxWords * MIN_PAGES_REDUCTION_FACTOR);
        pages = splitIntoPages(paragraphs, reducedWords, imagePositions);
      }
    }

    pages = mergeSparsePages(pages);

    console.log('[ContentSplitter] Final pages:', pages.length);

    return pages;
  }, [content, age, imagePositions, skipParagraphCount, windowSize.w, windowSize.h]);
}
