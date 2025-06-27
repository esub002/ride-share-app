/**
 * Typography System for Driver App
 * Consistent font sizes, weights, and line heights for better readability
 */

import { Platform } from 'react-native';

// Font families
export const FontFamily = {
  regular: Platform.select({
    ios: 'System',
    android: 'Roboto',
    default: 'System',
  }),
  medium: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  semibold: Platform.select({
    ios: 'System',
    android: 'Roboto-Medium',
    default: 'System',
  }),
  bold: Platform.select({
    ios: 'System',
    android: 'Roboto-Bold',
    default: 'System',
  }),
  monospace: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: 'monospace',
  }),
};

// Font sizes
export const FontSize = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  '2xl': 24,
  '3xl': 30,
  '4xl': 36,
  '5xl': 48,
  '6xl': 60,
};

// Font weights
export const FontWeight = {
  normal: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,
};

// Alias for compatibility
(FontWeight as any).semiBold = FontWeight.semibold;

// Line heights
export const LineHeight = {
  tight: 1.25,
  normal: 1.5,
  relaxed: 1.75,
};

// Letter spacing
export const LetterSpacing = {
  tight: -0.5,
  normal: 0,
  wide: 0.5,
  wider: 1,
};

// Typography presets
export const Typography = {
  // Display styles
  display1: {
    fontSize: FontSize['6xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['6xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
    fontFamily: FontFamily.bold,
  },
  display2: {
    fontSize: FontSize['5xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['5xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
    fontFamily: FontFamily.bold,
  },
  display3: {
    fontSize: FontSize['4xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['4xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
    fontFamily: FontFamily.bold,
  },

  // Heading styles
  h1: {
    fontSize: FontSize['3xl'],
    fontWeight: FontWeight.bold,
    lineHeight: FontSize['3xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
    fontFamily: FontFamily.bold,
  },
  h2: {
    fontSize: FontSize['2xl'],
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize['2xl'] * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
    fontFamily: FontFamily.semibold,
  },
  h3: {
    fontSize: FontSize.xl,
    fontWeight: FontWeight.semibold,
    lineHeight: FontSize.xl * LineHeight.tight,
    letterSpacing: LetterSpacing.tight,
    fontFamily: FontFamily.semibold,
  },
  h4: {
    fontSize: FontSize.lg,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.lg * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    fontFamily: FontFamily.medium,
  },

  // Body text styles
  body1: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.base * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    fontFamily: FontFamily.regular,
  },
  body2: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    fontFamily: FontFamily.regular,
  },
  body3: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    fontFamily: FontFamily.regular,
  },

  // Button styles
  button: {
    fontSize: FontSize.base,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.base * LineHeight.tight,
    letterSpacing: LetterSpacing.wide,
    fontFamily: FontFamily.medium,
  },
  buttonSmall: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.tight,
    letterSpacing: LetterSpacing.wide,
    fontFamily: FontFamily.medium,
  },

  // Caption styles
  caption: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    fontFamily: FontFamily.regular,
  },
  captionBold: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    fontFamily: FontFamily.medium,
  },

  // Label styles
  label: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.sm * LineHeight.tight,
    letterSpacing: LetterSpacing.wide,
    fontFamily: FontFamily.medium,
  },
  labelSmall: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.medium,
    lineHeight: FontSize.xs * LineHeight.tight,
    letterSpacing: LetterSpacing.wide,
    fontFamily: FontFamily.medium,
  },

  // Code styles
  code: {
    fontSize: FontSize.sm,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.sm * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    fontFamily: FontFamily.monospace,
  },
  codeSmall: {
    fontSize: FontSize.xs,
    fontWeight: FontWeight.normal,
    lineHeight: FontSize.xs * LineHeight.normal,
    letterSpacing: LetterSpacing.normal,
    fontFamily: FontFamily.monospace,
  },
};

// Utility function to get responsive font size
export const getResponsiveFontSize = (size: number, scale: number = 1) => {
  return Math.round(size * scale);
};

// Utility function to create custom typography
export const createTypography = (
  fontSize: number,
  fontWeight: keyof typeof FontWeight = 'normal',
  lineHeight?: number,
  letterSpacing?: number
) => ({
  fontSize,
  fontWeight: FontWeight[fontWeight],
  lineHeight: lineHeight || fontSize * LineHeight.normal,
  letterSpacing: letterSpacing || LetterSpacing.normal,
  fontFamily: FontFamily[fontWeight === 'bold' ? 'bold' : fontWeight === 'medium' ? 'medium' : 'regular'],
}); 