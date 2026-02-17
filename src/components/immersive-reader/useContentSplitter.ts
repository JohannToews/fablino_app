import { useMemo } from 'react';
import {
  ImmersivePage,
  FontSizeSetting,
  getMaxWordsPerPage,
  MIN_PAGES,
  MIN_PAGES_REDUCTION_FACTOR,
} from './constants';

/**
 * Split a paragraph at the nearest sentence boundary within the word limit.
 * Sentence boundaries: `. `, `! `, `? `, or end-of-string.
 */
function splitParagraphAtSentences(para: string, maxWords: number): string[] {
  const chunks: string[] = [];
  let remaining = para;

  while (remaining.trim()) {
    const words = remaining.split(/\s+/);
    if (words.length <= maxWords) {
      chunks.push(remaining.trim());
      break;
    }

    // Take maxWords worth of text and find the last sentence boundary
    const candidate = words.slice(0, maxWords).join(' ');
    const sentenceEndRegex = /[.!?]\s+/g;
    let lastBoundary = -1;
    let match: RegExpExecArray | null;

    while ((match = sentenceEndRegex.exec(candidate)) !== null) {
      lastBoundary = match.index + match[0].length - 1; // end of punctuation + space
    }

    if (lastBoundary > 0) {
      // Split at the last sentence boundary (include the punctuation)
      const splitPoint = candidate.substring(0, lastBoundary + 1).trimEnd();
      chunks.push(splitPoint);
      remaining = remaining.substring(splitPoint.length).trimStart();
    } else {
      // No sentence boundary found — take the whole maxWords chunk (avoid infinite loop)
      chunks.push(candidate);
      remaining = words.slice(maxWords).join(' ');
    }
  }

  return chunks.filter(c => c.length > 0);
}

interface PageDraft {
  paragraphs: string[];
  hasImage: boolean;
  imageIndex?: number;
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
 * Core splitting algorithm.
 * Distributes paragraphs to pages respecting maxWordsPerPage.
 * Handles overflow by splitting at sentence boundaries.
 * Maps images to pages based on imagePositions (paragraph indices).
 */
function splitIntoPages(
  content: string,
  maxWordsPerPage: number,
  imagePositions: number[],
): ImmersivePage[] {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  const pages: ImmersivePage[] = [];
  let currentPage: PageDraft = { paragraphs: [], hasImage: false };
  let currentWordCount = 0;

  // Build a map: paragraph index → image array index
  const paraToImageIdx = new Map<number, number>();
  imagePositions.forEach((paraIdx, imgIdx) => {
    paraToImageIdx.set(paraIdx, imgIdx);
  });

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const wordCount = para.split(/\s+/).length;

    // If adding this paragraph exceeds limit and we already have content, start new page
    if (currentWordCount + wordCount > maxWordsPerPage && currentPage.paragraphs.length > 0) {
      pages.push(finalizePage(currentPage));
      currentPage = { paragraphs: [], hasImage: false };
      currentWordCount = 0;
    }

    // If single paragraph exceeds limit, split at sentence boundary
    if (wordCount > maxWordsPerPage) {
      // First, flush any accumulated page
      if (currentPage.paragraphs.length > 0) {
        pages.push(finalizePage(currentPage));
        currentPage = { paragraphs: [], hasImage: false };
        currentWordCount = 0;
      }

      const chunks = splitParagraphAtSentences(para, maxWordsPerPage);
      const hasImageForPara = paraToImageIdx.has(i);

      for (let ci = 0; ci < chunks.length; ci++) {
        // Assign the image to the first chunk of the split paragraph
        const assignImage = hasImageForPara && ci === 0;
        pages.push(finalizePage({
          paragraphs: [chunks[ci]],
          hasImage: assignImage,
          imageIndex: assignImage ? paraToImageIdx.get(i) : undefined,
        }));
      }
      continue;
    }

    currentPage.paragraphs.push(para);
    currentWordCount += wordCount;

    // Check if this paragraph has an image assigned
    if (paraToImageIdx.has(i)) {
      currentPage.hasImage = true;
      currentPage.imageIndex = paraToImageIdx.get(i);
    }
  }

  // Flush remaining
  if (currentPage.paragraphs.length > 0) {
    pages.push(finalizePage(currentPage));
  }

  return pages;
}

/**
 * Hook: splits story text into ImmersivePage[].
 *
 * Re-computes when content, age, fontSizeSetting, or imagePositions change.
 * Enforces a minimum of MIN_PAGES pages (reduces maxWords by 30% and re-splits if needed).
 */
export function useContentSplitter(
  content: string,
  age: number,
  fontSizeSetting: FontSizeSetting,
  imagePositions: number[],
): ImmersivePage[] {
  return useMemo(() => {
    if (!content || !content.trim()) return [];

    let maxWords = getMaxWordsPerPage(age, fontSizeSetting);
    let pages = splitIntoPages(content, maxWords, imagePositions);

    // Validation: if too few pages, reduce maxWords and re-split
    if (pages.length < MIN_PAGES && content.split(/\s+/).length >= MIN_PAGES * 3) {
      maxWords = Math.round(maxWords * MIN_PAGES_REDUCTION_FACTOR);
      pages = splitIntoPages(content, maxWords, imagePositions);
    }

    return pages;
  }, [content, age, fontSizeSetting, imagePositions]);
}
