import React, {useCallback, useEffect, useRef} from 'react';

import {
  ActivityIndicator,
  Image,
  ImageStyle,
  Platform,
  useWindowDimensions,
  ViewStyle,
} from 'react-native';

import {
  BottomSheetBackdrop,
  BottomSheetBackdropProps,
  BottomSheetFlatList,
  BottomSheetModal,
} from '@gorhom/bottom-sheet';
import {PhotoIdentifier} from '@react-native-camera-roll/camera-roll';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {FullWindowOverlay} from 'react-native-screens';

import {Box, IconButton, Text, TouchableOpacityBox} from '@components';
import {useAppTheme} from '@hooks';

import {useGalleryPhotos} from './useGalleryPhotos';

const COLUMNS = 3;
const GAP = 2;

interface GalleryPickerSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (uri: string) => void;
}

/**
 * Grid próprio de fotos do rolo da câmera (estilo WhatsApp/Instagram) —
 * sem abrir o picker/modal nativo do SO. Tocar numa foto já envia.
 */
export function GalleryPickerSheet({
  visible,
  onClose,
  onSelect,
}: GalleryPickerSheetProps) {
  const modalRef = useRef<BottomSheetModal>(null);
  const insets = useSafeAreaInsets();
  const {colors} = useAppTheme();
  const {width} = useWindowDimensions();
  const {photos, state, loadMore, reset} = useGalleryPhotos();
  const isPresentedRef = useRef(false);

  useEffect(() => {
    if (visible) {
      isPresentedRef.current = true;
      modalRef.current?.present();
      // só busca se ainda não tem nada — reabrir o sheet não deve refazer a
      // paginação do zero, mas se a última tentativa falhou/foi negada,
      // tenta de novo (ex.: usuário concedeu a permissão nos Ajustes e voltou)
      if (photos.length === 0) {
        loadMore();
      }
    } else if (isPresentedRef.current) {
      isPresentedRef.current = false;
      modalRef.current?.dismiss();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleDismiss() {
    isPresentedRef.current = false;
    onClose();
  }

  function handleRetry() {
    reset();
    loadMore();
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

  const renderContainer = useCallback(
    ({children}: {children?: React.ReactNode}) =>
      Platform.OS === 'ios' ? (
        <FullWindowOverlay>{children}</FullWindowOverlay>
      ) : (
        <>{children}</>
      ),
    [],
  );

  const itemSize = (width - GAP * (COLUMNS - 1)) / COLUMNS;

  function renderItem({item}: {item: PhotoIdentifier}) {
    return (
      <TouchableOpacityBox
        onPress={() => onSelect(item.node.image.uri)}
        activeOpacity={0.8}
        style={{width: itemSize, height: itemSize, marginBottom: GAP}}>
        <Image source={{uri: item.node.image.uri}} style={$thumb} />
      </TouchableOpacityBox>
    );
  }

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
      snapPoints={$snapPoints}
      backdropComponent={renderBackdrop}
      containerComponent={renderContainer}
      backgroundStyle={$background}
      handleIndicatorStyle={$handle}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="s20"
        marginBottom="s12">
        <Text variant="headingMedium">Galeria</Text>
        <IconButton icon="close" preset="chip" size={32} onPress={onClose} />
      </Box>

      {state === 'denied' ? (
        <Box flex={1} alignItems="center" justifyContent="center" padding="s24" gap="s12">
          <Text variant="body" textAlign="center">
            Permissão de fotos negada. Habilite o acesso nos ajustes do
            aparelho para escolher imagens da galeria.
          </Text>
          <TouchableOpacityBox onPress={handleRetry}>
            <Text variant="body" color="primary">
              Tentar de novo
            </Text>
          </TouchableOpacityBox>
        </Box>
      ) : state === 'error' ? (
        <Box flex={1} alignItems="center" justifyContent="center" padding="s24" gap="s12">
          <Text variant="body" textAlign="center">
            Não foi possível carregar suas fotos.
          </Text>
          <TouchableOpacityBox onPress={handleRetry}>
            <Text variant="body" color="primary">
              Tentar de novo
            </Text>
          </TouchableOpacityBox>
        </Box>
      ) : (
        <BottomSheetFlatList
          data={photos}
          keyExtractor={item => item.node.id}
          numColumns={COLUMNS}
          renderItem={renderItem}
          columnWrapperStyle={$row}
          contentContainerStyle={{
            paddingHorizontal: GAP,
            paddingBottom: Math.max(insets.bottom, 20),
          }}
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
          ListFooterComponent={
            state === 'loading' ? (
              <Box paddingVertical="s16">
                <ActivityIndicator color={colors.primary} />
              </Box>
            ) : null
          }
        />
      )}
    </BottomSheetModal>
  );
}

const $snapPoints = ['85%'];

const $row: ViewStyle = {gap: GAP};

const $thumb: ImageStyle = {width: '100%', height: '100%'};
