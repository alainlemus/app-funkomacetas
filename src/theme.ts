// Identidad visual tomada del logo (misma paleta que el catálogo web y el panel).
export const colors = {
  primary: '#3A7F30', // verde hoja
  primaryLight: '#4C9A3F',
  primarySoft: '#DCEFD5',
  primaryTint: '#F1F8EE',
  danger: '#D93A35', // rojo del logo
  warning: '#F6B93B', // amarillo
  accent: '#A85A2E', // café maceta
  success: '#4C9A3F',
  ink: '#4A2C1A', // texto principal (café oscuro)
  muted: '#8A7466',
  placeholder: '#B8A99C',
  background: '#FFFAF0', // crema
  surface: '#FFFFFF',
  surfaceAlt: '#FFF3DC',
  border: '#F0E2C4',
  white: '#FFFFFF',
} as const;

export const fonts = {
  display: 'Fredoka_600SemiBold',
  regular: 'Nunito_400Regular',
  semibold: 'Nunito_600SemiBold',
  bold: 'Nunito_700Bold',
} as const;

export const radius = { sm: 10, md: 16, lg: 22, pill: 999 } as const;
