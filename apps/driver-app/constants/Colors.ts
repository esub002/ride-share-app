/**
 * Enhanced Design System for Driver App
 * Modern color palette with semantic colors, gradients, and accessibility considerations
 */

// Primary Brand Colors
const primaryBlue = '#2563EB';
const primaryBlueDark = '#1D4ED8';
const primaryBlueLight = '#3B82F6';

// Secondary Colors
const secondaryGreen = '#10B981';
const secondaryOrange = '#F59E0B';
const secondaryRed = '#EF4444';
const secondaryPurple = '#8B5CF6';

// Neutral Colors
const neutral50 = '#F9FAFB';
const neutral100 = '#F3F4F6';
const neutral200 = '#E5E7EB';
const neutral300 = '#D1D5DB';
const neutral400 = '#9CA3AF';
const neutral500 = '#6B7280';
const neutral600 = '#4B5563';
const neutral700 = '#374151';
const neutral800 = '#1F2937';
const neutral900 = '#111827';

// Semantic Colors
const success = '#10B981';
const warning = '#F59E0B';
const error = '#EF4444';
const info = '#3B82F6';

// Gradients
const gradients = {
  primary: ['#2563EB', '#1D4ED8'],
  secondary: ['#10B981', '#059669'],
  sunset: ['#F59E0B', '#D97706'],
  ocean: ['#3B82F6', '#1D4ED8'],
  purple: ['#8B5CF6', '#7C3AED'],
};

export const Colors = {
  light: {
    // Primary Colors
    primary: primaryBlue,
    primaryDark: primaryBlueDark,
    primaryLight: primaryBlueLight,
    
    // Background Colors
    background: neutral50,
    surface: '#FFFFFF',
    surfaceSecondary: neutral100,
    
    // Text Colors
    text: neutral900,
    textSecondary: neutral600,
    textTertiary: neutral500,
    textInverse: '#FFFFFF',
    
    // Semantic Colors
    success,
    warning,
    error,
    info,
    
    // Border Colors
    border: neutral200,
    borderLight: neutral100,
    
    // Status Colors
    online: success,
    offline: neutral400,
    busy: warning,
    
    // Icon Colors
    icon: neutral600,
    iconSelected: primaryBlue,
    iconDefault: neutral400,
    
    // Gradient Colors
    gradients,
    
    // Legacy Support
    tint: primaryBlue,
    tabIconDefault: neutral400,
    tabIconSelected: primaryBlue,
  },
  dark: {
    // Primary Colors
    primary: primaryBlueLight,
    primaryDark: primaryBlue,
    primaryLight: '#60A5FA',
    
    // Background Colors
    background: neutral900,
    surface: neutral800,
    surfaceSecondary: neutral700,
    
    // Text Colors
    text: neutral50,
    textSecondary: neutral300,
    textTertiary: neutral400,
    textInverse: neutral900,
    
    // Semantic Colors
    success,
    warning,
    error,
    info,
    
    // Border Colors
    border: neutral700,
    borderLight: neutral600,
    
    // Status Colors
    online: success,
    offline: neutral500,
    busy: warning,
    
    // Icon Colors
    icon: neutral300,
    iconSelected: primaryBlueLight,
    iconDefault: neutral500,
    
    // Gradient Colors
    gradients,
    
    // Legacy Support
    tint: primaryBlueLight,
    tabIconDefault: neutral500,
    tabIconSelected: primaryBlueLight,
  },
};

// Common color utilities
export const ColorUtils = {
  // Opacity variations
  withOpacity: (color: string, opacity: number) => {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  },
  
  // Status colors
  getStatusColor: (status: 'online' | 'offline' | 'busy', isDark: boolean = false) => {
    const theme = isDark ? Colors.dark : Colors.light;
    switch (status) {
      case 'online': return theme.online;
      case 'offline': return theme.offline;
      case 'busy': return theme.busy;
      default: return theme.offline;
    }
  },
  
  // Gradient helpers
  getGradient: (type: keyof typeof gradients) => gradients[type],
};
