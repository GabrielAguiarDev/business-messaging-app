import {createTheme} from '@shopify/restyle';

import {darkColors, lightColors} from './colors';

const spacing = {
  s0: 0,
  s2: 2,
  s4: 4,
  s6: 6,
  s8: 8,
  s10: 10,
  s12: 12,
  s14: 14,
  s16: 16,
  s20: 20,
  s24: 24,
  s28: 28,
  s32: 32,
  s40: 40,
  s48: 48,
  s56: 56,
};

// Radii do design: tags 6, badges/pills de contagem 10, busca/tabs de fila 12,
// inputs e bolhas 14, avatar quadrado 15, cards 16, logo login 18, composer 22,
// botões pill 26, "full" para círculos.
const borderRadii = {
  br4: 4,
  br6: 6,
  br10: 10,
  br12: 12,
  br14: 14,
  br15: 15,
  br16: 16,
  br18: 18,
  br22: 22,
  br26: 26,
  full: 999,
};

const textVariants = {
  defaults: {
    fontSize: 16,
    color: 'text',
  },
  largeTitle: {
    fontSize: 30,
    fontWeight: '700',
    color: 'text',
  },
  title: {
    fontSize: 27,
    fontWeight: '700',
    color: 'text',
  },
  headingLarge: {
    fontSize: 23,
    fontWeight: '700',
    color: 'text',
  },
  headingMedium: {
    fontSize: 19,
    fontWeight: '700',
    color: 'text',
  },
  headingSmall: {
    fontSize: 17,
    fontWeight: '700',
    color: 'text',
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'text',
  },
  body: {
    fontSize: 16,
    color: 'text',
  },
  paragraph: {
    fontSize: 15,
    color: 'text',
  },
  paragraphSecondary: {
    fontSize: 14,
    color: 'textSecondary',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: 'textSecondary',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  caption: {
    fontSize: 13,
    color: 'textSecondary',
  },
  captionSmall: {
    fontSize: 12,
    color: 'textSecondary',
  },
  labelSmall: {
    fontSize: 11,
    fontWeight: '600',
    color: 'text',
  },
  tiny: {
    fontSize: 10,
    color: 'textTertiary',
  },
} as const;

export const theme = createTheme({
  colors: lightColors,
  spacing,
  borderRadii,
  textVariants,
});

export type Theme = typeof theme;

export const darkTheme: Theme = {
  ...theme,
  colors: darkColors,
};
