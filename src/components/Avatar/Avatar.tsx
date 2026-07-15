import React from 'react';

import {Image} from 'react-native';

import {avatarColors} from '@theme';

import {Box} from '../Box/Box';
import {Text} from '../Text/Text';

export interface AvatarProps {
  /** Iniciais exibidas (1-2 letras) */
  label: string;
  /** Cor de fundo (hex bruto vindo do dado); se ausente, deriva do label */
  color?: string;
  /** Foto do avatar — quando presente, cobre o fundo no lugar das iniciais */
  photoUri?: string;
  /** 'circle' p/ pessoas e grupos; 'squircle' p/ módulos e canais */
  shape?: 'circle' | 'squircle';
  size?: number;
}

/** Deriva uma cor estável da palette de avatares a partir de um seed. */
export function avatarColorFor(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 997;
  }
  return avatarColors[hash % avatarColors.length];
}

export function Avatar({
  label,
  color,
  photoUri,
  shape = 'circle',
  size = 50,
}: AvatarProps) {
  const backgroundColor = color ?? avatarColorFor(label);
  const borderRadius = shape === 'circle' ? size / 2 : Math.round(size * 0.29);

  return (
    <Box
      width={size}
      height={size}
      alignItems="center"
      justifyContent="center"
      overflow="hidden"
      style={{backgroundColor, borderRadius}}>
      {photoUri ? (
        <Image
          source={{uri: photoUri}}
          resizeMode="cover"
          style={{width: size, height: size}}
        />
      ) : (
        <Text
          fontWeight={shape === 'squircle' ? '700' : '600'}
          color="primaryContrast"
          style={{fontSize: Math.round(size * 0.34)}}>
          {label}
        </Text>
      )}
    </Box>
  );
}
