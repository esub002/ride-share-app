/**
 * Spacing System for Driver App
 * Consistent spacing values for margins, padding, and layout
 */

// Base spacing unit (4px)
const baseUnit = 4;

// Spacing scale
export const Spacing = {
  // Micro spacing
  xs: baseUnit, // 4px
  sm: baseUnit * 2, // 8px
  md: baseUnit * 3, // 12px
  base: baseUnit * 4, // 16px
  lg: baseUnit * 5, // 20px
  xl: baseUnit * 6, // 24px
  '2xl': baseUnit * 8, // 32px
  '3xl': baseUnit * 10, // 40px
  '4xl': baseUnit * 12, // 48px
  '5xl': baseUnit * 16, // 64px
  '6xl': baseUnit * 20, // 80px
  '7xl': baseUnit * 24, // 96px
  '8xl': baseUnit * 32, // 128px
};

// Common spacing patterns
export const Layout = {
  // Container spacing
  container: {
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.lg,
  },
  containerLarge: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing['2xl'],
  },
  containerSmall: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.md,
  },

  // Section spacing
  section: {
    marginVertical: Spacing.xl,
  },
  sectionLarge: {
    marginVertical: Spacing['3xl'],
  },
  sectionSmall: {
    marginVertical: Spacing.lg,
  },

  // Card spacing
  card: {
    padding: Spacing.base,
    marginVertical: Spacing.sm,
  },
  cardLarge: {
    padding: Spacing.xl,
    marginVertical: Spacing.md,
  },
  cardSmall: {
    padding: Spacing.sm,
    marginVertical: Spacing.xs,
  },

  // Form spacing
  form: {
    marginBottom: Spacing.lg,
  },
  formGroup: {
    marginBottom: Spacing.base,
  },
  formField: {
    marginBottom: Spacing.md,
  },

  // Button spacing
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  buttonLarge: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing['2xl'],
  },
  buttonSmall: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.base,
  },

  // List spacing
  list: {
    marginVertical: Spacing.sm,
  },
  listItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
  listItemLarge: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },

  // Header spacing
  header: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  headerLarge: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },

  // Footer spacing
  footer: {
    paddingVertical: Spacing.base,
    paddingHorizontal: Spacing.base,
  },
  footerLarge: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },

  // Modal spacing
  modal: {
    padding: Spacing.xl,
  },
  modalLarge: {
    padding: Spacing['2xl'],
  },
  modalSmall: {
    padding: Spacing.base,
  },

  // Drawer spacing
  drawer: {
    padding: Spacing.base,
  },
  drawerHeader: {
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.base,
  },
  drawerItem: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
  },
};

// Border radius values
export const BorderRadius = {
  none: 0,
  sm: baseUnit, // 4px
  base: baseUnit * 1.5, // 6px
  md: baseUnit * 2, // 8px
  lg: baseUnit * 3, // 12px
  xl: baseUnit * 4, // 16px
  '2xl': baseUnit * 6, // 24px
  '3xl': baseUnit * 8, // 32px
  full: 9999,
};

// Shadow values
export const Shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  base: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 16,
  },
};

// Utility functions
export const SpacingUtils = {
  // Get spacing value
  get: (size: keyof typeof Spacing) => Spacing[size],
  
  // Create custom spacing
  custom: (value: number) => value,
  
  // Create responsive spacing
  responsive: (base: number, scale: number = 1) => Math.round(base * scale),
  
  // Create percentage spacing
  percentage: (value: number) => `${value}%`,
}; 