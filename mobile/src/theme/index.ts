/** Design tokens shared by every screen and component. */

export const colors = {
  primary: '#7A2E5C',
  primaryPressed: '#5F2347',
  primarySoft: '#F7EAF1',
  background: '#FAF7F8',
  surface: '#FFFFFF',
  text: '#1F1A1D',
  textMuted: '#6E6469',
  textOnPrimary: '#FFFFFF',
  border: '#ECE4E8',
  disabled: '#D9D2D6',
  star: '#E3A008',
  success: '#1B7F52',
  successSoft: '#E5F4EC',
  danger: '#B42318',
  dangerSoft: '#FDECEA',
  neutralSoft: '#F1EEF0',
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

export const typography = {
  title: { fontSize: 22, fontWeight: '700', color: colors.text },
  heading: { fontSize: 18, fontWeight: '700', color: colors.text },
  subheading: { fontSize: 15, fontWeight: '600', color: colors.text },
  body: { fontSize: 15, color: colors.text },
  caption: { fontSize: 13, color: colors.textMuted },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
} as const;

export const shadow = {
  card: {
    shadowColor: '#2B1622',
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
} as const;
