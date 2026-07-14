import React from 'react';

import {
  BottomSheet,
  Box,
  Icon,
  IconName,
  Text,
  TouchableOpacityBox,
} from '@components';
import {toastService} from '@services';

interface AttachmentSheetProps {
  visible: boolean;
  onClose: () => void;
  onCamera: () => void;
  onPickImage: () => void;
}

const CARDS: {icon: IconName; label: string}[] = [
  {icon: 'image', label: 'Imagem'},
  {icon: 'camera', label: 'Câmera'},
  {icon: 'file', label: 'Arquivo'},
];

const ROWS: {icon: IconName; title: string; subtitle: string}[] = [
  {
    icon: 'pin',
    title: 'Localização',
    subtitle: 'Compartilhe sua localização atual',
  },
  {
    icon: 'person',
    title: 'Contato',
    subtitle: 'Envie um contato do diretório da empresa',
  },
  {
    icon: 'poll',
    title: 'Enquete',
    subtitle: 'Crie uma votação nesta conversa',
  },
];

/** Sheet de anexos do chat (layout de referência do usuário). */
export function AttachmentSheet({
  visible,
  onClose,
  onCamera,
  onPickImage,
}: AttachmentSheetProps) {
  function handleOption() {
    onClose();
    toastService.show('Disponível em breve.');
  }

  function handleCard(card: (typeof CARDS)[number]) {
    if (card.icon === 'camera') {
      onClose();
      onCamera();
      return;
    }
    if (card.icon === 'image') {
      onClose();
      onPickImage();
      return;
    }
    handleOption();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Anexar">
      {/* Cards principais */}
      <Box flexDirection="row" gap="s10" marginBottom="s16">
        {CARDS.map(card => (
          <TouchableOpacityBox
            key={card.label}
            onPress={() => handleCard(card)}
            activeOpacity={0.7}
            flex={1}
            alignItems="center"
            gap="s8"
            backgroundColor="chip"
            borderRadius="br16"
            paddingVertical="s16">
            <Icon name={card.icon} size={24} color="text" />
            <Text variant="caption" color="text">
              {card.label}
            </Text>
          </TouchableOpacityBox>
        ))}
      </Box>

      {/* Demais opções */}
      {ROWS.map(row => (
        <TouchableOpacityBox
          key={row.title}
          onPress={handleOption}
          activeOpacity={0.7}
          flexDirection="row"
          alignItems="center"
          gap="s14"
          paddingVertical="s12">
          <Icon name={row.icon} size={22} color="text" />
          <Box flex={1}>
            <Text variant="body">{row.title}</Text>
            <Text variant="caption" marginTop="s2">
              {row.subtitle}
            </Text>
          </Box>
          <Icon name="chevronRight" size={16} color="textTertiary" />
        </TouchableOpacityBox>
      ))}
    </BottomSheet>
  );
}
