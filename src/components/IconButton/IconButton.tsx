import React from 'react';

import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';

import {Box, TouchableOpacityBox} from '../Box/Box';
import {Icon, IconName} from '../Icon/Icon';

export interface IconButtonProps {
  icon: IconName;
  onPress: () => void;
  /**
   * - glass: liquid glass (iOS 26+), fallback chip — padrão do app p/ headers
   * - chip: círculo cinza (visual cru do design)
   * - primary: círculo accent (ex.: "+" de Módulos/Chats)
   */
  preset?: 'glass' | 'chip' | 'primary';
  size?: number;
  iconSize?: number;
}

export function IconButton({
  icon,
  onPress,
  preset = 'glass',
  size = 38,
  iconSize,
}: IconButtonProps) {
  const isGlass = preset === 'glass' && isLiquidGlassSupported;
  const iconColor = preset === 'primary' ? 'primaryContrast' : 'text';
  const resolvedIconSize = iconSize ?? Math.round(size * 0.55);

  const touchable = (
    <TouchableOpacityBox
      onPress={onPress}
      activeOpacity={0.75}
      width={size}
      height={size}
      alignItems="center"
      justifyContent="center"
      backgroundColor={
        isGlass ? undefined : preset === 'primary' ? 'primary' : 'chip'
      }
      style={{borderRadius: size / 2}}>
      <Icon name={icon} size={resolvedIconSize} color={iconColor} />
    </TouchableOpacityBox>
  );

  if (isGlass) {
    return (
      <Box style={{borderRadius: size / 2}} overflow="hidden">
        <LiquidGlassView
          interactive
          effect="regular"
          style={{borderRadius: size / 2}}>
          {touchable}
        </LiquidGlassView>
      </Box>
    );
  }

  return touchable;
}
