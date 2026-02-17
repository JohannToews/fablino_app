import { useMemo } from 'react';
import {
  ImmersivePage,
  FontSizeSetting,
  getMaxWordsPerPage,
  MIN_PAGES,
  MIN_PAGES_REDUCTION_FACTOR,
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
function normalizeToParagraphs(content: string): string[] {
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

/**
 * Split a paragraph at the nearest sentence boundary within the word limit.
 * Sentence boundaries: `.` `!` `?` followed by space or end-of-string.
 */
function splitParagraphAtSentences(para: string, maxWords: number): string[] {
  const chunks: string[] = [];
  let remaining = para;

  while (remaining.trim()) {
    const words = remaining.split(/\s+/).filter(Boolean);
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
      lastBoundary = match.index + match[0].length - 1;
    }

    if (lastBoundary > 0) {
      const splitPoint = candidate.substring(0, lastBoundary + 1).trimEnd();
      chunks.push(splitPoint);
      remaining = remaining.substring(splitPoint.length).trimStart();
    } else {
      // No sentence boundary — take the whole chunk (avoid infinite loop)
      chunks.push(candidate);
      remaining = words.slice(maxWords).join(' ');
    }
  }

  return chunks.filter(c => c.length > 0);
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
 * Core splitting algorithm.
 *
 * Key behaviour: multiple paragraphs are packed onto the SAME page
 * until maxWordsPerPage is reached. A page break only happens when
 * adding the next paragraph would exceed the limit.
 */
function splitIntoPages(
  paragraphs: string[],
  maxWordsPerPage: number,
  imagePositions: number[],
): ImmersivePage[] {
  const pages: ImmersivePage[] = [];
  let current: PageDraft = newDraft();

  // paragraph index → image array index
  const paraToImageIdx = new Map<number, number>();
  imagePositions.forEach((paraIdx, imgIdx) => {
    paraToImageIdx.set(paraIdx, imgIdx);
  });

  for (let i = 0; i < paragraphs.length; i++) {
    const para = paragraphs[i];
    const wc = countWords(para);

    // ── Single paragraph too long → split at sentences ──
    if (wc > maxWordsPerPage) {
      // Flush accumulated content first
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

    // ── Would this paragraph overflow the current page? ──
    if (current.wordCount + wc > maxWordsPerPage && current.paragraphs.length > 0) {
      pages.push(finalizePage(current));
      current = newDraft();
    }

    // ── Add paragraph to current page ──
    current.paragraphs.push(para);
    current.wordCount += wc;

    if (paraToImageIdx.has(i)) {
      current.hasImage = true;
      current.imageIndex = paraToImageIdx.get(i);
    }
  }

  // Flush remaining
  if (current.paragraphs.length > 0) {
    pages.push(finalizePage(current));
  }

  return pages;
}

// ── Public hook ──────────────────────────────────────────────

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

    const paragraphs = normalizeToParagraphs(content);
    if (paragraphs.length === 0) return [];

    let maxWords = getMaxWordsPerPage(age, fontSizeSetting);
    let pages = splitIntoPages(paragraphs, maxWords, imagePositions);

    // If too few pages, reduce maxWords and re-split
    const totalWords = paragraphs.reduce((sum, p) => sum + countWords(p), 0);
    if (pages.length < MIN_PAGES && totalWords >= MIN_PAGES * 3) {
      maxWords = Math.round(maxWords * MIN_PAGES_REDUCTION_FACTOR);
      pages = splitIntoPages(paragraphs, maxWords, imagePositions);
    }

    return pages;
  }, [content, age, fontSizeSetting, imagePositions]);
}
