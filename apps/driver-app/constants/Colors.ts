// Color palette and theme definitions for the Driver App
// Providing a single source of truth for colours throughout the application.
// Feel free to tweak the values to match your brand guidelines.

export const Colors = {
  light: {
    // Brand colours
    primary: '#007AFF',          // iOS blue / primary action
    secondary: '#5856D6',        // iOS purple / secondary action

    // Semantic colours
    success: '#34C759',          // iOS green – success states
    warning: '#FF9500',          // iOS orange – warning states
    error:   '#FF3B30',          // iOS red   – error states

    // Greyscale / surfaces
    background: '#FFFFFF',       // global app background
    surface:     '#F8F9FA',      // cards, list items, inputs
    surfaceSecondary: '#F0F0F0', // subtle backgrounds / borders

    // Text
    text: '#333333',             // primary text colour
    textSecondary: '#666666',    // secondary / hint text
    textInverse: '#FFFFFF',      // text on coloured surfaces
  },

  dark: {
    primary: '#0A84FF',          // iOS system blue (dark)
    secondary: '#5E5CE6',

    success: '#30D158',          // iOS green (dark)
    warning: '#FF9F0A',          // iOS orange (dark)
    error:   '#FF453A',          // iOS red (dark)

    background: '#000000',
    surface:     '#1C1C1E',
    surfaceSecondary: '#2C2C2E',

    text: '#FFFFFF',
    textSecondary: '#D1D1D6',
    textInverse: '#000000',
  },
} as const;

export default Colors;
