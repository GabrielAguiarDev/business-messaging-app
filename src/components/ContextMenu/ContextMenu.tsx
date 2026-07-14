import React from 'react';

import {
  Modal,
  Pressable,
  StyleSheet,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';

import { BlurView } from '@react-native-community/blur';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useResolvedTheme } from '@services';

import { Box, TouchableOpacityBox } from '../Box/Box';
import { Icon, IconName } from '../Icon/Icon';
import { Text } from '../Text/Text';

/** Retângulo em coordenadas de janela (measureInWindow). */
export interface AnchorFrame {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface MenuItemSpec {
  icon: IconName;
  label: string;
  danger?: boolean;
  /** Desenha um separador acima deste item. */
  separated?: boolean;
  onPress: () => void;
}

/** Altura estimada de cada linha (p/ decidir se o menu abre acima do anchor). */
const MENU_ROW_HEIGHT = 46;
const MENU_WIDTH = 250;
const GAP = 6;

/**
 * Card de menu (lista de ações com ícone) — o mesmo visual do menu de
 * long-press da mensagem. Usado pelo ContextMenu e pelo MessageActionsOverlay.
 */
export function MenuCard({
  items,
  width = MENU_WIDTH,
}: {
  items: MenuItemSpec[];
  width?: number;
}) {
  return (
    <Box
      width={width}
      backgroundColor="card"
      borderRadius="br16"
      paddingVertical="s4"
      shadowColor="text"
      shadowOpacity={0.18}
      shadowRadius={12}
      shadowOffset={$shadowOffset}
      elevation={8}
      overflow="hidden">
      {items.map(item => (
        <Box key={item.label}>
          {item.separated && (
            <Box height={1} backgroundColor="separator" marginVertical="s4" />
          )}
          <TouchableOpacityBox
            onPress={item.onPress}
            activeOpacity={0.6}
            flexDirection="row"
            alignItems="center"
            gap="s12"
            paddingHorizontal="s14"
            paddingVertical="s12">
            <Icon
              name={item.icon}
              size={19}
              color={item.danger ? 'danger' : 'text'}
            />
            <Text variant="paragraph" color={item.danger ? 'danger' : 'text'}>
              {item.label}
            </Text>
          </TouchableOpacityBox>
        </Box>
      ))}
    </Box>
  );
}

/**
 * Fundo dos menus de contexto: blur real (estilo WhatsApp) + leve
 * escurecimento por cima. Tocar em qualquer lugar dele fecha o menu.
 */
export function MenuBackdrop({
  onPress,
  children,
}: {
  onPress: () => void;
  children: React.ReactNode;
}) {
  const isDark = useResolvedTheme() === 'dark';
  return (
    <Pressable style={$flex} onPress={onPress}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={18}
        reducedTransparencyFallbackColor={isDark ? '#000000' : '#f2f2f7'}
      />
      <View
        style={[StyleSheet.absoluteFill, isDark ? $dimDark : $dimLight]}
        pointerEvents="none"
      />
      {children}
    </Pressable>
  );
}

interface ContextMenuProps {
  visible: boolean;
  /** Posição do elemento que abriu o menu (measureInWindow). */
  anchor: AnchorFrame | null;
  items: MenuItemSpec[];
  onClose: () => void;
}

/**
 * Menu de contexto ancorado (dropdown estilo WhatsApp): fundo escurecido e
 * o card de ações logo abaixo do anchor, alinhado à direita dele. Abre para
 * cima quando não há espaço abaixo. Tocar fora fecha.
 */
export function ContextMenu({
  visible,
  anchor,
  items,
  onClose,
}: ContextMenuProps) {
  const { width: windowWidth, height: windowHeight } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  if (!visible || !anchor) {
    return (
      <Modal visible={false} transparent>
        <Box />
      </Modal>
    );
  }

  const menuHeight = items.length * MENU_ROW_HEIGHT + 9;
  const fitsBelow =
    anchor.y + anchor.height + GAP + menuHeight <=
    windowHeight - insets.bottom - 12;
  const top = fitsBelow
    ? anchor.y + anchor.height + GAP
    : Math.max(insets.top + 12, anchor.y - GAP - menuHeight);
  const right = Math.max(12, windowWidth - (anchor.x + anchor.width));

  return (
    <Modal
      visible
      transparent
      statusBarTranslucent
      animationType="fade"
      onRequestClose={onClose}>
      <MenuBackdrop onPress={onClose}>
        <Box position="absolute" style={{ top, right }}>
          <Animated.View entering={FadeInDown.duration(180)}>
            <MenuCard items={items} />
          </Animated.View>
        </Box>
      </MenuBackdrop>
    </Modal>
  );
}

const $flex: ViewStyle = {flex: 1};

// escurecimento leve por cima do blur — o blur sozinho deixa o fundo claro demais
const $dimDark: ViewStyle = {backgroundColor: 'rgba(0,0,0,0.35)'};
const $dimLight: ViewStyle = {backgroundColor: 'rgba(0,0,0,0.12)'};

const $shadowOffset = { width: 0, height: 4 };
