import React, {useEffect} from 'react';

import {FlatList, Image, ImageStyle, ViewStyle} from 'react-native';

import {PhotoIdentifier} from '@react-native-camera-roll/camera-roll';

import {
  BottomSheet,
  Box,
  Icon,
  IconName,
  Text,
  TouchableOpacityBox,
} from '@components';
import {toastService} from '@services';

import {useGalleryPhotos} from './useGalleryPhotos';

/** Quantas fotos recentes carregar/exibir na tira horizontal. */
const RECENT_THUMB = 92;
const RECENT_GAP = 8;

interface AttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  /** Abrir a grade completa da galeria. */
  onPickImage: () => void;
  /** Tocar numa foto recente — envia direto (igual à grade da galeria). */
  onSelectImage: (uri: string) => void;
}

type RowAction = 'gallery' | 'soon';

const ROWS: {
  icon: IconName;
  title: string;
  subtitle: string;
  action: RowAction;
}[] = [
  {
    icon: 'image',
    title: 'Galeria',
    subtitle: 'Ver todas as fotos',
    action: 'gallery',
  },
  {
    icon: 'file',
    title: 'Arquivo',
    subtitle: 'Enviar um documento',
    action: 'soon',
  },
  {
    icon: 'pin',
    title: 'Localização',
    subtitle: 'Compartilhe sua localização atual',
    action: 'soon',
  },
  {
    icon: 'person',
    title: 'Contato',
    subtitle: 'Envie um contato do diretório da empresa',
    action: 'soon',
  },
  {
    icon: 'poll',
    title: 'Enquete',
    subtitle: 'Crie uma votação nesta conversa',
    action: 'soon',
  },
];

/**
 * Sheet de anexos do chat: tira de "Fotos recentes" (botão de câmera +
 * miniaturas do rolo, rolagem horizontal) no topo e as demais opções em
 * lista abaixo. Tocar numa miniatura envia a foto direto; a câmera e a
 * grade completa da galeria abrem via callbacks do Composer.
 */
export function AttachmentSheet({
  visible,
  onClose,
  onCamera,
  onPickImage,
  onSelectImage,
}: AttachmentSheetProps) {
  const {photos, state, loadMore, reset} = useGalleryPhotos();

  // carrega o rolo na 1ª abertura; se falhou/negou antes, tenta de novo
  useEffect(() => {
    if (visible && photos.length === 0) {
      loadMore();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  function handleCamera() {
    onClose();
    onCamera();
  }

  function handleSelect(uri: string) {
    onClose();
    onSelectImage(uri);
  }

  function handleRow(action: RowAction) {
    onClose();
    if (action === 'gallery') {
      onPickImage();
      return;
    }
    toastService.show('Disponível em breve.');
  }

  function handleRetry() {
    reset();
    loadMore();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Anexar">
      {/* Fotos recentes */}
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        marginBottom="s10">
        <Text variant="captionSmall" fontWeight="700" color="textSecondary">
          Fotos recentes
        </Text>
        {photos.length > 0 && (
          <TouchableOpacityBox onPress={() => handleRow('gallery')} activeOpacity={0.7}>
            <Text variant="captionSmall" fontWeight="600" color="primary">
              Ver todas
            </Text>
          </TouchableOpacityBox>
        )}
      </Box>

      <Box marginBottom="s16" height={RECENT_THUMB} style={$stripBleed}>
        <FlatList<PhotoIdentifier>
          data={photos}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={item => item.node.id}
          onEndReachedThreshold={0.5}
          onEndReached={loadMore}
          contentContainerStyle={$stripContent}
          ListHeaderComponent={
            <Box flexDirection="row" marginRight="s8">
              {/* Botão da câmera */}
              <TouchableOpacityBox
                onPress={handleCamera}
                activeOpacity={0.8}
                width={RECENT_THUMB}
                height={RECENT_THUMB}
                borderRadius="br16"
                backgroundColor="chip"
                alignItems="center"
                justifyContent="center"
                gap="s4">
                <Icon name="camera" size={24} color="text" />
                <Text variant="captionSmall" color="textSecondary">
                  Câmera
                </Text>
              </TouchableOpacityBox>

              {/* Estado sem fotos: permissão negada → permitir */}
              {state === 'denied' && (
                <TouchableOpacityBox
                  onPress={handleRetry}
                  activeOpacity={0.8}
                  width={RECENT_THUMB * 2}
                  height={RECENT_THUMB}
                  marginLeft="s8"
                  borderRadius="br16"
                  backgroundColor="surface"
                  borderWidth={1}
                  borderColor="separator"
                  alignItems="center"
                  justifyContent="center"
                  paddingHorizontal="s12">
                  <Text variant="caption" color="textSecondary" textAlign="center">
                    Permitir acesso às fotos
                  </Text>
                </TouchableOpacityBox>
              )}
            </Box>
          }
          renderItem={({item}) => (
            <TouchableOpacityBox
              onPress={() => handleSelect(item.node.image.uri)}
              activeOpacity={0.8}
              style={$thumbWrap}>
              <Image source={{uri: item.node.image.uri}} style={$thumb} />
            </TouchableOpacityBox>
          )}
        />
      </Box>

      {/* Demais opções */}
      {ROWS.map(row => (
        <TouchableOpacityBox
          key={row.title}
          onPress={() => handleRow(row.action)}
          activeOpacity={0.7}
          flexDirection="row"
          alignItems="center"
          gap="s14"
          paddingVertical="s10">
          <Box
            width={42}
            height={42}
            borderRadius="br12"
            backgroundColor="chip"
            alignItems="center"
            justifyContent="center">
            <Icon name={row.icon} size={20} color="text" />
          </Box>
          <Box flex={1}>
            <Text variant="body" fontWeight="600">
              {row.title}
            </Text>
            <Text variant="caption" color="textSecondary" marginTop="s2">
              {row.subtitle}
            </Text>
          </Box>
          <Icon name="chevronRight" size={16} color="textTertiary" />
        </TouchableOpacityBox>
      ))}
    </BottomSheet>
  );
}

const $stripBleed: ViewStyle = {
  // sangra até as bordas do sheet (que tem padding horizontal de 20)
  marginHorizontal: -20,
};

const $stripContent: ViewStyle = {
  paddingHorizontal: 20,
  alignItems: 'center',
};

const $thumbWrap: ViewStyle = {
  width: RECENT_THUMB,
  height: RECENT_THUMB,
  borderRadius: 16,
  overflow: 'hidden',
  marginRight: RECENT_GAP,
};

const $thumb: ImageStyle = {
  width: '100%',
  height: '100%',
};
