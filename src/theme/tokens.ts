/**
 * Design token tema glassmorphism MKM:
 * latar charcoal gelap (elips hitam logo), aksen merah MKM,
 * permukaan kaca translusen dengan border cahaya.
 */
export const colors = {
  // Latar gelap
  bg: '#0A0C11',
  bgDeep: '#060709',
  bgAlt: 'rgba(255,255,255,0.06)',

  // Aksen merah MKM (diproba dari logo)
  red: '#FA1411',
  redSoft: 'rgba(250,20,17,0.16)',
  redMuted: '#FF6B62',

  // Kaca
  glass: 'rgba(255,255,255,0.07)',
  glassStrong: 'rgba(255,255,255,0.11)',
  glassBorder: 'rgba(255,255,255,0.14)',
  glassHighlight: 'rgba(255,255,255,0.22)',
  glassDeep: 'rgba(10,12,17,0.55)',

  // Teks
  white: '#FFFFFF',
  textOnDark: '#F4F6FA',
  textMuted: '#9AA3B2',
  textNavy: '#F4F6FA',

  // Status
  green: '#3DDC97',
  greenBg: 'rgba(61,220,151,0.12)',
  greenBorder: 'rgba(61,220,151,0.35)',
  grayTrack: 'rgba(255,255,255,0.18)',
} as const;

export const radius = {
  panel: 24,
  card: 18,
  pill: 999,
  tab: 12,
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const type = {
  hero: { fontSize: 34, fontWeight: '800' },
  section: { fontSize: 22, fontWeight: '700' },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  body: { fontSize: 14, fontWeight: '400' },
  small: { fontSize: 12.5, fontWeight: '400' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6 },
} as const;
