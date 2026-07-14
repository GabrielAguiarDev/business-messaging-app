import React from 'react';

import {ActivityIndicator} from 'react-native';

import {
  isLiquidGlassSupported,
  LiquidGlassView,
} from '@callstack/liquid-glass';

import {useAppTheme} from '@hooks';
import {ThemeColors} from '@theme';

import {Box, TouchableOpacityBox, TouchableOpacityBoxProps} from '../Box/Box';
import {Icon, IconName} from '../Icon/Icon';
import {Text} from '../Text/Text';

export type ButtonPreset = 'primary' | 'outline' | 'ghost' | 'glass';

export interface ButtonProps extends Omit<TouchableOpacityBoxProps, 'children'> {
  title: string;
  onPress: () => void;
  preset?: ButtonPreset;
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: IconName;
  /** Botão compacto (ex.: "Assumir" nas filas) */
  small?: boolean;
}

interface PresetStyle {
  container: Partial<TouchableOpacityBoxProps>;
  contentColor: keyof ThemeColors;
}

const $presets: Record<ButtonPreset, PresetStyle> = {
  primary: {
    container: {backgroundColor: 'primary'},
    contentColor: 'primaryContrast',
  },
  outline: {
    container: {borderWidth: 1, borderColor: 'primary'},
    contentColor: 'primary',
  },
  ghost: {
    container: {},
    contentColor: 'primary',
  },
  glass: {
    container: {backgroundColor: 'chip'},
    contentColor: 'text',
  },
};

/**
 * Botão do design system. Presets:
 * - primary: pill sólido accent (CTAs do design)
 * - outline: borda accent (ex.: "Resolver")
 * - ghost: só texto accent (ex.: "Esqueci a senha")
 * - glass: liquid glass nativo (iOS 26+) com fallback chip translúcido
 */
export function Button({
  title,
  onPress,
  preset = 'primary',
  loading = false,
  disabled = false,
  leftIcon,
  small = false,
  ...boxProps
}: ButtonProps) {
  const {colors} = useAppTheme();
  const isGlass = preset === 'glass' && isLiquidGlassSupported;
  const presetStyle = $presets[preset];
  const contentColor = presetStyle.contentColor;

  const container: Partial<TouchableOpacityBoxProps> = isGlass
    ? {}
    : presetStyle.container;

  const height = small ? 36 : 52;
  const borderRadius = height / 2;

  const content = (
    <TouchableOpacityBox
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      height={height}
      paddingHorizontal={small ? 's16' : 's24'}
      flexDirection="row"
      alignItems="center"
      justifyContent="center"
      gap="s8"
      opacity={disabled ? 0.5 : 1}
      style={{borderRadius}}
      {...container}
      {...boxProps}>
      {loading ? (
        <ActivityIndicator color={colors[contentColor]} />
      ) : (
        <>
          {leftIcon && <Icon name={leftIcon} size={18} color={contentColor} />}
          <Text
            fontSize={small ? 13 : 16}
            fontWeight="600"
            color={contentColor}>
            {title}
          </Text>
        </>
      )}
    </TouchableOpacityBox>
  );

  if (isGlass) {
    return (
      <Box style={{borderRadius}} overflow="hidden" {...boxProps}>
        <LiquidGlassView interactive effect="regular" style={{borderRadius}}>
          {content}
        </LiquidGlassView>
      </Box>
    );
  }

  return content;
}
