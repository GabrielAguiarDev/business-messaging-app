import React from 'react';

import {ThemeColors} from '@theme';

import {Box} from '../Box/Box';
import {Text} from '../Text/Text';

export interface BadgeProps {
  count: number;
  /** 'primary' (não lidas) ou 'attendance' (fila aguardando) */
  color?: Extract<keyof ThemeColors, 'primary' | 'attendance'>;
}

/** Pill de contagem (não lidas / aguardando). Não renderiza se count <= 0. */
export function Badge({count, color = 'primary'}: BadgeProps) {
  if (count <= 0) {
    return null;
  }

  return (
    <Box
      minWidth={20}
      height={20}
      paddingHorizontal="s6"
      borderRadius="br10"
      backgroundColor={color}
      alignItems="center"
      justifyContent="center">
      <Text fontSize={12} fontWeight="700" color="primaryContrast">
        {count > 99 ? '99+' : count}
      </Text>
    </Box>
  );
}
