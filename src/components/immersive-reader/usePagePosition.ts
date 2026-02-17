import { useState, useCallback, useRef, useEffect } from 'react';
import { ImmersivePage } from './constants';

interface PagePositionReturn {
  currentPage: number;
  totalPages: number;
  paragraphAnchor: number;
  goToPage: (pageIndex: number) => void;
  goNext: () => void;
  goPrev: () => void;
  isFirstPage: boolean;
  isLastPage: boolean;
}

/**
 * Computes the cumulative paragraph index for the last paragraph on a given page.
 *
 * E.g. if pages have [2, 3, 1] paragraphs, then:
 *   page 0 → anchor 1 (paragraphs 0-1)
 *   page 1 → anchor 4 (paragraphs 2-4)
 *   page 2 → anchor 5 (paragraph 5)
 */
function getLastParagraphIndex(pages: ImmersivePage[], pageIndex: number): number {
  let total = 0;
  for (let i = 0; i <= pageIndex && i < pages.length; i++) {
    total += pages[i].paragraphs.length;
  }
  return Math.max(0, total - 1);
}

/**
 * Finds the page that contains the given paragraph anchor.
 * Ensures we NEVER jump forward — returns the page where the anchor paragraph lives,
 * or the earlier page if the anchor lands between pages after re-split.
 */
function findPageForAnchor(pages: ImmersivePage[], anchor: number): number {
  let cumulativeParas = 0;
  for (let i = 0; i < pages.length; i++) {
    cumulativeParas += pages[i].paragraphs.length;
    if (anchor < cumulativeParas) {
      return i;
    }
  }
  // Anchor beyond all pages — go to last page
  return Math.max(0, pages.length - 1);
}

/**
 * Tracks the current page and paragraph anchor.
 *
 * When pages change (e.g. after orientation change / re-split), the hook
 * automatically navigates to the page containing the anchor paragraph,
 * following the "NEVER jump forward" rule.
 */
export function usePagePosition(pages: ImmersivePage[]): PagePositionReturn {
  const [currentPage, setCurrentPage] = useState(0);
  const paragraphAnchorRef = useRef(0);
  const prevPagesRef = useRef(pages);

  // When pages array changes (re-split), re-anchor
  useEffect(() => {
    if (prevPagesRef.current !== pages && pages.length > 0) {
      const targetPage = findPageForAnchor(pages, paragraphAnchorRef.current);
      setCurrentPage(targetPage);
    }
    prevPagesRef.current = pages;
  }, [pages]);

  const goToPage = useCallback((pageIndex: number) => {
    if (pageIndex < 0 || pageIndex >= pages.length) return;
    setCurrentPage(pageIndex);
    paragraphAnchorRef.current = getLastParagraphIndex(pages, pageIndex);
  }, [pages]);

  const goNext = useCallback(() => {
    setCurrentPage(prev => {
      const next = Math.min(prev + 1, pages.length - 1);
      paragraphAnchorRef.current = getLastParagraphIndex(pages, next);
      return next;
    });
  }, [pages]);

  const goPrev = useCallback(() => {
    setCurrentPage(prev => {
      const prevPage = Math.max(prev - 1, 0);
      paragraphAnchorRef.current = getLastParagraphIndex(pages, prevPage);
      return prevPage;
    });
  }, [pages]);

  return {
    currentPage,
    totalPages: pages.length,
    paragraphAnchor: paragraphAnchorRef.current,
    goToPage,
    goNext,
    goPrev,
    isFirstPage: currentPage === 0,
    isLastPage: currentPage === pages.length - 1,
  };
}
