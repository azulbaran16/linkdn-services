export const colors = {
  primary: '#6D28D9',
  primaryDark: '#5B21B6',
  primaryLight: '#EDE9FE',

  neutral900: '#1A1A1A',
  neutral700: '#4A4A4A',
  neutral500: '#8E8E8E',
  neutral200: '#E8E8E8',
  neutral100: '#F6F7F8',
  neutral50: '#FAFAFA',
  white: '#FFFFFF',

  success: '#22C55E',
  successLight: '#F0FDF4',
  danger: '#EF4444',
  dangerLight: '#FEF2F2',
  warning: '#F59E0B',
  warningLight: '#FFFBEB',
  info: '#3B82F6',
  infoLight: '#EFF6FF',

  // Legacy aliases
  background: '#F6F7F8',
  card: '#FFFFFF',
  text: '#1A1A1A',
  textSecondary: '#4A4A4A',
  textMuted: '#8E8E8E',
  border: '#E8E8E8',
  inputBg: '#FFFFFF',
};

export const spacing = {
  xs: 4,
  sm: 8,
  ms: 12,
  md: 16,
  lg: 20,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const fontSize = {
  xs: 12,
  sm: 14,
  md: 16,
  lg: 18,
  xl: 24,
  xxl: 32,
};

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
};

export const shadows = {
  card: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  elevated: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 4,
  },
};

export const screenPadding = {
  paddingHorizontal: 20,
};
