import React from 'react';
import { syllabifyWithLog, isSyllableModeSupported } from '@/lib/syllabify';
export { isSyllableModeSupported };
export { countSyllables } from '@/lib/syllabify';

const COLORS = ['#2563EB', '#DC2626']; // blue-600, red-600

const PUNCT_RE_START = /^[.,!?;:'"«»„"\-–—\s()\[\]{}]+/;
const PUNCT_RE_END = /[.,!?;:'"«»„"\-–—\s()\[\]{}]+$/;

interface SyllableTextProps {
  text: string;
  language?: string;
  colorOffset?: number;
  className?: string;
  onClick?: (e: React.MouseEvent) => void;
  dataPosition?: string;
}

/**
 * Renders a word with syllables in alternating blue/red.
 * Every word gets colored — no exceptions when syllable mode is active.
 */
export const SyllableText: React.FC<SyllableTextProps> = ({
  text,
  language = 'de',
  colorOffset = 0,
  className,
  onClick,
  dataPosition,
}) => {
  if (/^\s+$/.test(text)) {
    return <span>{text}</span>;
  }

  const leadPunct = text.match(PUNCT_RE_START)?.[0] || '';
  const tailPunct = text.match(PUNCT_RE_END)?.[0] || '';
  const cleanWord = text.slice(
    leadPunct.length,
    tailPunct.length > 0 ? -tailPunct.length : undefined,
  );

  if (!cleanWord) {
    return (
      <span className={className} onClick={onClick} data-position={dataPosition}>
        <span style={{ color: COLORS[colorOffset % 2] }}>{text}</span>
      </span>
    );
  }

  const syllables = syllabifyWithLog(cleanWord, language);
  const firstColor = COLORS[colorOffset % 2];
  const lastColor = COLORS[(colorOffset + syllables.length - 1) % 2];

  return (
    <span
      className={className}
      onClick={onClick}
      data-position={dataPosition}
      data-word-clickable={onClick ? 'true' : undefined}
      style={onClick ? { cursor: 'pointer' } : undefined}
    >
      {leadPunct && <span style={{ color: firstColor }}>{leadPunct}</span>}
      {syllables.map((syl, i) => (
        <span key={i} style={{ color: COLORS[(colorOffset + i) % 2] }}>
          {syl}
        </span>
      ))}
      {tailPunct && <span style={{ color: lastColor }}>{tailPunct}</span>}
    </span>
  );
};

export default SyllableText;
