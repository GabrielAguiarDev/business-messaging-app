import React, {useCallback, useEffect, useRef} from 'react';

import {Platform, ViewStyle} from 'react-native';

import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetModal,
  BottomSheetView,
} from '@gorhom/bottom-sheet';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FullWindowOverlay} from 'react-native-screens';

import {useAppTheme} from '@hooks';

import {Box} from '../Box/Box';
import {IconButton} from '../IconButton/IconButton';
import {Text} from '../Text/Text';

const MIN_BOTTOM_PADDING = 20;
const $content: ViewStyle = {paddingHorizontal: 20};

export interface BottomSheetProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

/**
 * Bottom sheet (via @gorhom/bottom-sheet): arraste para fechar,
 * backdrop que fecha ao tocar, alça, título + botão X.
 * Altura dinâmica conforme o conteúdo.
 */
export function BottomSheet({
  visible,
  onClose,
  title,
  children,
}: BottomSheetProps) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const {colors} = useAppTheme();

  // dismiss() num modal que não está apresentado corrompe o estado interno
  // do BottomSheetModal (presents futuros viram no-op). Isso acontece na
  // montagem (visible=false) e ao fechar por arraste/backdrop (o modal já
  // se dispensou nativamente quando o efeito roda) — só chamar dismiss()
  // enquanto realmente apresentado.
  const isPresentedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isPresentedRef.current = true;
      modalRef.current?.present();
    } else if (isPresentedRef.current) {
      isPresentedRef.current = false;
      modalRef.current?.dismiss();
    }
  }, [visible]);

  function handleDismiss() {
    isPresentedRef.current = false;
    onClose();
  }

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    [],
  );

  // com native-stack (react-native-screens), o portal do modal fica ATRÁS
  // das telas nativas no iOS — FullWindowOverlay renderiza acima de tudo
  const renderContainer = useCallback(
    ({children: containerChildren}: {children?: React.ReactNode}) =>
      Platform.OS === 'ios' ? (
        <FullWindowOverlay>{containerChildren}</FullWindowOverlay>
      ) : (
        <>{containerChildren}</>
      ),
    [],
  );

  const $background: ViewStyle = {
    backgroundColor: colors.surface,
    borderRadius: 24,
  };

  const $handle: ViewStyle = {
    backgroundColor: colors.chip,
    width: 36,
  };

  return (
    <BottomSheetModal
      ref={modalRef}
      onDismiss={handleDismiss}
      enablePanDownToClose
      enableDynamicSizing
      backdropComponent={renderBackdrop}
      containerComponent={renderContainer}
      backgroundStyle={$background}
      handleIndicatorStyle={$handle}>
      <BottomSheetView
        style={[
          $content,
          {paddingBottom: Math.max(insets.bottom, MIN_BOTTOM_PADDING)},
        ]}>
        <Box
          flexDirection="row"
          alignItems="center"
          justifyContent="space-between"
          marginBottom="s16">
          <Text variant="headingMedium">{title}</Text>
          <IconButton icon="close" preset="chip" size={32} onPress={onClose} />
        </Box>
        {children}
      </BottomSheetView>
    </BottomSheetModal>
  );
}
