import React from 'react';

import {KeyboardAvoidingView, Platform, ScrollView} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ThemeColors} from '@theme';

import {Box, BoxProps} from '../Box/Box';
import {IconButton} from '../IconButton/IconButton';
import {Text} from '../Text/Text';

export interface ScreenProps {
  children: React.ReactNode;
  /** Título no header compacto (com back). Sem título e sem canGoBack → sem header. */
  title?: string;
  canGoBack?: boolean;
  onBackPress?: () => void;
  scrollable?: boolean;
  backgroundColor?: keyof ThemeColors;
  /** Conteúdo fixo abaixo do corpo (ex.: botão "Adicionar grupo", composer) */
  footer?: React.ReactNode;
  /** Ações à direita do header */
  headerRight?: React.ReactNode;
  contentProps?: BoxProps;
}

/**
 * Wrapper padrão de tela: safe area + header opcional + keyboard avoiding
 * + scroll opcional + footer fixo.
 */
export function Screen({
  children,
  title,
  canGoBack = false,
  onBackPress,
  scrollable = false,
  backgroundColor = 'background',
  footer,
  headerRight,
  contentProps,
}: ScreenProps) {
  const insets = useSafeAreaInsets();
  const hasHeader = canGoBack || !!title || !!headerRight;

  const body = (
    <Box flex={1} paddingHorizontal="s16" {...contentProps}>
      {children}
    </Box>
  );

  return (
    <Box flex={1} backgroundColor={backgroundColor}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={$flex}>
        <Box flex={1} style={{paddingTop: insets.top}}>
          {hasHeader && (
            <Box
              flexDirection="row"
              alignItems="center"
              gap="s10"
              paddingHorizontal="s12"
              paddingVertical="s10">
              {canGoBack && (
                <IconButton icon="back" onPress={() => onBackPress?.()} />
              )}
              {title && (
                <Text variant="headingMedium" numberOfLines={1}>
                  {title}
                </Text>
              )}
              {headerRight && (
                <Box flex={1} flexDirection="row" justifyContent="flex-end">
                  {headerRight}
                </Box>
              )}
            </Box>
          )}
          {scrollable ? (
            <ScrollView
              style={$flex}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              {body}
            </ScrollView>
          ) : (
            body
          )}
          {footer && (
            <Box
              paddingHorizontal="s16"
              paddingTop="s10"
              style={{paddingBottom: Math.max(insets.bottom, 16)}}>
              {footer}
            </Box>
          )}
        </Box>
      </KeyboardAvoidingView>
    </Box>
  );
}

const $flex = {flex: 1};
