import React from 'react';

import {Box} from '../Box/Box';
import {Text} from '../Text/Text';

export interface TagProps {
  label: string;
  /** 'primary' (Community) ou 'attendance' (Atendimento · produto) */
  preset?: 'primary' | 'attendance';
}

const $presets = {
  primary: {backgroundColor: 'primaryTint', color: 'primary'},
  attendance: {backgroundColor: 'attendanceTint', color: 'attendanceText'},
} as const;

/** Etiqueta pequena de contexto (ex.: "Community", "Atendimento · App"). */
export function Tag({label, preset = 'primary'}: TagProps) {
  const {backgroundColor, color} = $presets[preset];

  return (
    <Box
      alignSelf="flex-start"
      backgroundColor={backgroundColor}
      borderRadius="br6"
      paddingHorizontal="s8"
      paddingVertical="s2">
      <Text fontSize={11} fontWeight="600" color={color}>
        {label}
      </Text>
    </Box>
  );
}
