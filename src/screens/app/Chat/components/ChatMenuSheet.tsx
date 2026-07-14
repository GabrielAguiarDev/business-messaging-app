import React from 'react';

import {
  BottomSheet,
  Box,
  Icon,
  IconName,
  Text,
  TouchableOpacityBox,
} from '@components';
import {Chat} from '@domain';
import {toastService} from '@services';

interface ChatMenuSheetProps {
  visible: boolean;
  onClose: () => void;
  chat: Chat;
  onViewProfile: () => void;
  onToggleMute: () => void;
  onDelete: () => void;
}

/** Menu de opções da conversa (botão ⋯ do header do chat). */
export function ChatMenuSheet({
  visible,
  onClose,
  chat,
  onViewProfile,
  onToggleMute,
  onDelete,
}: ChatMenuSheetProps) {
  function handle(action: () => void) {
    onClose();
    action();
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={chat.name}>
      <MenuRow
        icon="person"
        label="Ver perfil"
        onPress={() => handle(onViewProfile)}
      />
      <MenuRow
        icon={chat.muted ? 'bell' : 'bellOff'}
        label={
          chat.muted ? 'Reativar notificações' : 'Silenciar notificações'
        }
        onPress={() => handle(onToggleMute)}
      />
      <MenuRow
        icon="search"
        label="Buscar na conversa"
        onPress={() => handle(() => toastService.show('Disponível em breve.'))}
      />
      <MenuRow
        icon="trash"
        label="Apagar conversa"
        danger
        onPress={() => handle(onDelete)}
      />
    </BottomSheet>
  );
}

function MenuRow({
  icon,
  label,
  danger = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  danger?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacityBox
      onPress={onPress}
      activeOpacity={0.7}
      flexDirection="row"
      alignItems="center"
      gap="s14"
      paddingVertical="s12">
      <Icon name={icon} size={22} color={danger ? 'danger' : 'text'} />
      <Box flex={1}>
        <Text variant="body" color={danger ? 'danger' : 'text'}>
          {label}
        </Text>
      </Box>
      <Icon name="chevronRight" size={16} color="textTertiary" />
    </TouchableOpacityBox>
  );
}
