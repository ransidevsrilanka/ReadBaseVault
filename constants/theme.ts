// Powered by OnSpace.AI
// ReadBase "The Vault" Design System

export const Colors = {
  // Core Backgrounds
  background: '#0a0a04',
  surface: '#121210',
  surfaceElevated: '#1a1a16',
  surfaceCard: '#16161200',

  // Glass
  glass: 'rgba(255,255,255,0.05)',
  glassBorder: 'rgba(255,255,255,0.10)',
  glassBorderStrong: 'rgba(255,255,255,0.18)',

  // Brand Accents — Blue as primary (replacing all purple)
  primary: '#1da1f2',                         // Brand Blue
  primaryLight: 'rgba(29, 161, 242, 0.18)',
  primaryGlow: 'rgba(29, 161, 242, 0.10)',

  gold: 'hsl(45, 93%, 47%)',                  // Gold — premium/platinum
  goldLight: 'rgba(245, 197, 24, 0.15)',
  goldGlow: 'rgba(245, 197, 24, 0.08)',

  blue: '#1da1f2',
  blueLight: 'rgba(29, 161, 242, 0.15)',

  // Tier Colors
  tierSilver: '#a1a1aa',
  tierGold: 'hsl(45, 93%, 47%)',
  tierPlatinum: '#e5e4e2',

  // Semantic
  success: 'hsl(142, 76%, 36%)',
  successLight: 'rgba(22, 163, 74, 0.15)',
  error: '#ef4444',
  errorLight: 'rgba(239, 68, 68, 0.15)',
  warning: '#f59e0b',
  warningLight: 'rgba(245, 158, 11, 0.15)',

  // Text
  textPrimary: '#ffffff',
  textSecondary: '#e4e4e7',
  textMuted: '#a1a1aa',
  textSubtle: '#71717a',
  textDisabled: '#52525b',

  // Borders
  border: 'rgba(255,255,255,0.08)',
  borderMuted: 'rgba(255,255,255,0.04)',

  // Overlays
  overlay: 'rgba(0,0,0,0.6)',
  overlayHeavy: 'rgba(0,0,0,0.85)',
};

export const Typography = {
  // Plus Jakarta Sans for headings/display
  fontDisplay: 'PlusJakartaSans_800ExtraBold',
  fontBold: 'PlusJakartaSans_700Bold',
  fontSemiBold: 'PlusJakartaSans_600SemiBold',
  fontMedium: 'PlusJakartaSans_500Medium',
  fontRegular: 'PlusJakartaSans_400Regular',

  // Scale (base 16)
  size: {
    xs: 11,
    sm: 13,
    base: 16,
    md: 18,
    lg: 20,
    xl: 22,
    '2xl': 26,
    '3xl': 30,
    '4xl': 36,
  },

  // Line Heights
  lineHeight: {
    tight: 1.2,
    normal: 1.4,
    relaxed: 1.6,
  },
};

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 40,
  '4xl': 48,
  '5xl': 64,
};

export const BorderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 24,
  full: 9999,
};

export const Shadows = {
  blue: {
    shadowColor: '#1da1f2',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  gold: {
    shadowColor: 'hsl(45, 93%, 47%)',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const TIER_DISPLAY: Record<string, { label: string; color: string; level: number }> = {
  starter: { label: 'Silver', color: Colors.tierSilver, level: 1 },
  standard: { label: 'Gold', color: Colors.tierGold, level: 2 },
  lifetime: { label: 'Platinum', color: Colors.tierPlatinum, level: 3 },
};

export const GRADE_DISPLAY: Record<string, string> = {
  al_grade12: 'Grade 12 (A/L)',
  al_grade13: 'Grade 13 (A/L)',
  al_combo: 'Full Syllabus (G12 + G13)',
  ol_grade10: 'Grade 10 (O/L)',
  ol_grade11: 'Grade 11 (O/L)',
};

export const STREAM_DISPLAY: Record<string, string> = {
  maths: 'Physical Science',
  biology: 'Biological Science',
  commerce: 'Commerce',
  arts: 'Arts',
  technology: 'Technology',
};
