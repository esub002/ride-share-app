/**
 * Spacing System for Driver App
 * Consistent spacing values for margins, padding, and layout
 */

// Spacing, border-radius and shadow scale for consistent UI spacing across the Driver App.
// Values follow a 4-point grid for harmony.

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  base: 12,
  md: 16,
  lg: 24,
  xl: 32,
  '2xl': 40,
  '3xl': 48,
  large: 24,   // legacy alias 
  medium: 16,  // legacy alias
  small: 8,    // legacy alias
} as const;

export const BorderRadius = {
  xs: 2,
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
} as const;

export const Shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1.0,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3.0,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 6.0,
    elevation: 6,
  },
} as const;

export default Spacing;

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