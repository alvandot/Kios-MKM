/**
 * Design token dari referensi desain "Lock Mode":
 * latar navy gelap, aksen biru terang, panel putih membulat.
 */
export const colors = {
  // Latar navy
  bg: '#101D34',
  bgDeep: '#0B1526',
  bgAlt: '#152747',

  // Aksen
  blue: '#287BFF',
  blueSoft: '#E8F0FF',
  blueMuted: '#7C93B8',
  paleBlue: '#F4F7FC',

  // Panel
  white: '#FFFFFF',
  border: '#D8E1EE',

  // Teks
  textNavy: '#12203A',
  textMuted: '#6B7F9E',
  textOnDark: '#EAF1FF',

  // Status
  green: '#22A06B',
  greenBg: '#E9F7EF',
  greenBorder: '#9FE0BC',
  grayTrack: '#C9D4E3',
} as const;

export const radius = {
  panel: 24,
  card: 20,
  pill: 999,
  tab: 10,
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
  heroAccent: { fontSize: 34, fontWeight: '800' },
  section: { fontSize: 22, fontWeight: '700' },
  cardTitle: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 14, fontWeight: '400' },
  small: { fontSize: 12.5, fontWeight: '400' },
  label: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6 },
} as const;
