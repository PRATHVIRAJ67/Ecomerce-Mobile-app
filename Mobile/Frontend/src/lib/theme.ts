/** Colour + shadow tokens for places where className can't reach (icons, gradients, animated styles). */
export const C = {
  forest: '#174D38',
  forestDeep: '#103B2C',
  forest900: '#0A2A1D',
  forest600: '#2C6B52',
  forest100: '#E7EFEA',
  forest50: '#F0F6F2',
  terracotta: '#D97745',
  terracotta600: '#B85E2F',
  terracotta200: '#F4CFB6',
  terracotta50: '#FDF6F1',
  cream: '#FAF7F0',
  creamDark: '#F1EBDD',
  sand: '#E9DFCA',
  white: '#FFFFFF',
  ink: '#1D2722',
  inkSoft: '#4A5650',
  muted: '#6E7873',
  line: '#E6E0D2',
  success: '#2E7D4F',
  warning: '#9A6416',
  danger: '#B83A2E',
} as const;

export const shadow = {
  card: {
    shadowColor: '#0F3526',
    shadowOpacity: 0.07,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  lift: {
    shadowColor: '#0F3526',
    shadowOpacity: 0.16,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} as const;
