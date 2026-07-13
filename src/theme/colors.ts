export interface ThemeColors {
  background: string;
  surface: string;
  surfaceAlt: string;
  border: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  primary: string;
  primaryLight: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  headerBg: string;
  shadow: string;
  overlay: string;
  inputBg: string;
  skeleton: string;
  skeletonHighlight: string;
}

export const lightTheme: ThemeColors = {
  background: '#F8F9FA',
  surface: '#FFFFFF',
  surfaceAlt: '#F1F3F5',
  border: '#DFE6E9',
  text: '#2D3436',
  textSecondary: '#636E72',
  textMuted: '#95A5A6',
  primary: '#6C5CE7',
  primaryLight: '#A29BFE',
  success: '#00B894',
  warning: '#FDCB6E',
  danger: '#E17055',
  info: '#00CEC9',
  headerBg: '#6C5CE7',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
  inputBg: '#F8F9FA',
  skeleton: '#E9ECEF',
  skeletonHighlight: '#F8F9FA',
};

export const darkTheme: ThemeColors = {
  background: '#0F1419',
  surface: '#1A1F26',
  surfaceAlt: '#252B33',
  border: '#2D343E',
  text: '#FFFFFF',
  textSecondary: '#B2BEC3',
  textMuted: '#636E72',
  primary: '#A29BFE',
  primaryLight: '#6C5CE7',
  success: '#00B894',
  warning: '#FDCB6E',
  danger: '#FF7675',
  info: '#00CEC9',
  headerBg: '#1A1F26',
  shadow: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
  inputBg: '#252B33',
  skeleton: '#252B33',
  skeletonHighlight: '#2D343E',
};

export type ThemeMode = 'light' | 'dark';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
};

export const radius = {
  sm: 6,
  md: 8,
  lg: 12,
  xl: 16,
  full: 999,
};

export const typography = {
  h1: { fontSize: 28, fontWeight: '700' as const },
  h2: { fontSize: 22, fontWeight: '700' as const },
  h3: { fontSize: 18, fontWeight: '600' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  bodyBold: { fontSize: 14, fontWeight: '600' as const },
  small: { fontSize: 12, fontWeight: '400' as const },
  smallBold: { fontSize: 12, fontWeight: '600' as const },
  tiny: { fontSize: 10, fontWeight: '400' as const },
};