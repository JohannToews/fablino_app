export const FABLINO_COLORS = {
  primary: '#E8863A',
  primaryHover: '#D4752E',
  orangeLight: '#F5A623',
  secondary: '#FFF8F0',
  text: '#2D1810',
  textSecondary: '#6B5B4E',
  textMuted: '#6B7280',
  white: '#FFFFFF',
  speechBubbleBg: '#FFFFFF',
  speechBubbleTip: '#FFF7ED',
  background: {
    top: '#FFF8F0',
    mid: '#FEF1E1',
    bottom: '#FDE8D0',
    gradient: 'linear-gradient(180deg, #FFF8F0 0%, #FEF1E1 50%, #FDE8D0 100%)',
  },
  card: {
    bg: '#FFFFFF',
    shadow: '0 2px 8px rgba(45, 24, 16, 0.08)',
    border: 'rgba(232, 134, 58, 0.12)',
  },
  progressTrack: '#F0E6DC',
} as const;

export const FABLINO_SIZES = {
  mascot: { sm: 96, md: 150, lg: 195 },
  speechBubble: { minWidth: 200, maxWidth: 300 },
  button: { height: 56, maxWidth: 448 },
  fontSize: {
    speechBubble: '1.125rem',    // 18px
    buttonPrimary: '1.125rem',   // 18px
    buttonSecondary: '1rem',     // 16px
    cardTitle: '1.125rem',       // 18px
    cardDescription: '0.875rem', // 14px
  },
} as const;

export const FABLINO_STYLES = {
  primaryButton: 'h-14 w-full max-w-md text-lg font-semibold rounded-2xl bg-[#E8863A] text-white hover:bg-[#D4752E] transition-colors',
  secondaryButton: 'h-14 w-full max-w-md text-lg font-semibold rounded-2xl bg-white border-2 border-[#E8863A] text-[#E8863A] hover:bg-[#FFF8F0] transition-colors',
} as const;
