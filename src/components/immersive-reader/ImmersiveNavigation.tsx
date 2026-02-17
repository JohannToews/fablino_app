import React, { useCallback, useEffect, useRef } from 'react';

interface ImmersiveNavigationProps {
  onNext: () => void;
  onPrev: () => void;
  disabled: boolean;
  children: React.ReactNode;
}

const SWIPE_THRESHOLD = 50; // pixels
const TAP_ZONE_RIGHT = 0.7; // 70% width = next

/**
 * Wrapper that handles page navigation via:
 * - Tap zones (right 70% = next, left 30% = prev)
 * - Swipe (left = next, right = prev)
 * - Keyboard (→/Space = next, ← = prev)
 *
 * Critical: Taps on words (data-word="true") do NOT trigger navigation.
 */
const ImmersiveNavigation: React.FC<ImmersiveNavigationProps> = ({
  onNext,
  onPrev,
  disabled,
  children,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

  // ── Tap handling ──────────────────────────────────────────
  const handleClick = useCallback(
    (e: React.MouseEvent) => {
      if (disabled) return;

      const target = e.target as HTMLElement;

      // Don't navigate if the user tapped a word, button, link, or interactive element
      if (
        target.closest('[data-word]') ||
        target.closest('[data-word-clickable]') ||
        target.closest('button') ||
        target.closest('a') ||
        target.closest('[role="button"]') ||
        target.closest('.immersive-toolbar') ||
        target.closest('.immersive-word-sheet') ||
        target.closest('.immersive-progress-bar')
      ) {
        return;
      }

      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return;

      const relativeX = (e.clientX - rect.left) / rect.width;

      if (relativeX >= TAP_ZONE_RIGHT) {
        onNext();
      } else if (relativeX < 1 - TAP_ZONE_RIGHT) {
        onPrev();
      } else {
        // Middle zone — also advance (most natural for reading)
        onNext();
      }
    },
    [disabled, onNext, onPrev]
  );

  // ── Touch / Swipe handling ────────────────────────────────
  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (disabled) return;
      const touch = e.touches[0];
      touchStartRef.current = {
        x: touch.clientX,
        y: touch.clientY,
        time: Date.now(),
      };
    },
    [disabled]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (disabled || !touchStartRef.current) return;

      const touch = e.changedTouches[0];
      const dx = touch.clientX - touchStartRef.current.x;
      const dy = touch.clientY - touchStartRef.current.y;
      const elapsed = Date.now() - touchStartRef.current.time;

      touchStartRef.current = null;

      // Only register as swipe if horizontal movement is dominant and above threshold
      if (Math.abs(dx) > SWIPE_THRESHOLD && Math.abs(dx) > Math.abs(dy) && elapsed < 500) {
        e.preventDefault();
        if (dx < 0) {
          onNext(); // swipe left → next
        } else {
          onPrev(); // swipe right → prev
        }
      }
      // If not a swipe, let the click handler deal with it
    },
    [disabled, onNext, onPrev]
  );

  // ── Keyboard handling ─────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (disabled) return;

      // Don't capture if focused on input/textarea
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
          e.preventDefault();
          onNext();
          break;
        case 'ArrowLeft':
          e.preventDefault();
          onPrev();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, onNext, onPrev]);

  return (
    <div
      ref={containerRef}
      className="immersive-navigation relative w-full h-full"
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </div>
  );
};

export default ImmersiveNavigation;
