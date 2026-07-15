import React, {useRef, useState} from 'react';

import {ActivityIndicator, Image, Switch, View} from 'react-native';

import {Avatar, Box, Screen, Tag, Text, TouchableOpacityBox} from '@components';
import {Chat, useChatDetails, useChatToggleMute, useUserList} from '@domain';
import {useAppTheme} from '@hooks';
import {AppStackScreenProps} from '@routes';
import {toastService} from '@services';

import {
  ImageViewer,
  ImageViewerTarget,
} from '../Chat/components/ImageViewer';

const AVATAR_SIZE = 96;

/**
 * Perfil da conversa (padrão WhatsApp): avatar grande + nome + info
 * conforme o tipo (contato, grupo ou atendimento) + notificações + ações.
 */
export function ChatProfileScreen({
  navigation,
  route,
}: AppStackScreenProps<'ChatProfileScreen'>) {
  const {chatId} = route.params;
  const {colors} = useAppTheme();

  const {chat, isLoading} = useChatDetails(chatId);
  const {users} = useUserList();
  const contact =
    chat?.type === 'dm' ? users.find(u => chatId === `dm-${u.id}`) : undefined;

  const {setMuted} = useChatToggleMute({
    onError: error => toastService.show(error.message, 'error'),
  });

  const avatarRef = useRef<View>(null);
  const [photoTarget, setPhotoTarget] = useState<ImageViewerTarget | null>(
    null,
  );

  /**
   * Tap no avatar → abre a foto em tela cheia com shared element partindo
   * do círculo medido na tela (mesmo viewer do chat). Sem foto, não abre.
   */
  function openAvatarPhoto() {
    const uri = chat?.avatarUrl;
    if (!uri) {
      return;
    }
    const cornerRadius =
      chat.type === 'dm'
        ? AVATAR_SIZE / 2
        : Math.round(AVATAR_SIZE * 0.29);
    avatarRef.current?.measureInWindow((x, y, width, height) => {
      const base = {
        uri,
        frame: {x, y, width, height},
        cornerRadius,
        title: chat.name,
        subtitle: 'Foto de perfil',
      };
      Image.getSize(
        uri,
        (imageWidth, imageHeight) =>
          setPhotoTarget({...base, imageWidth, imageHeight}),
        () =>
          setPhotoTarget({...base, imageWidth: width, imageHeight: height}),
      );
    });
  }

  if (isLoading || !chat) {
    return (
      <Screen canGoBack onBackPress={navigation.goBack}>
        <Box flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </Box>
      </Screen>
    );
  }

  return (
    <Screen canGoBack onBackPress={navigation.goBack} scrollable>
      {/* Identidade */}
      <Box alignItems="center" gap="s8" paddingVertical="s16">
        <TouchableOpacityBox
          onPress={openAvatarPhoto}
          activeOpacity={0.8}
          disabled={!chat.avatarUrl}>
          <Box ref={avatarRef} collapsable={false}>
            <Avatar
              label={chat.initials}
              color={chat.avatarColor}
              photoUri={chat.avatarUrl}
              shape={chat.type === 'dm' ? 'circle' : 'squircle'}
              size={AVATAR_SIZE}
            />
          </Box>
        </TouchableOpacityBox>
        <Text variant="headingLarge" textAlign="center" marginTop="s8">
          {chat.name}
        </Text>
        <ProfileSubtitle chat={chat} />
        {contact?.isAdmin && <Tag label="Admin" />}
      </Box>

      {/* Informações por tipo */}
      {chat.type === 'dm' && contact && (
        <InfoCard
          rows={[
            {label: 'Cargo', value: contact.role},
            {label: 'Email', value: contact.email},
          ]}
        />
      )}
      {chat.type === 'group' && (
        <InfoCard
          rows={[
            {label: 'Community', value: chat.context ?? '—'},
            {label: 'Tipo', value: 'Grupo interno'},
          ]}
        />
      )}
      {chat.type === 'attendance' && (
        <InfoCard
          rows={[
            {label: 'Canal', value: chat.context ?? '—'},
            {
              label: 'Status',
              value:
                chat.status === 'resolvida'
                  ? 'Resolvida'
                  : chat.status === 'atendimento'
                  ? 'Em atendimento'
                  : 'Aguardando',
            },
            {label: 'Atendente', value: chat.assignedTo ?? 'Não atribuída'},
          ]}
        />
      )}

      {/* Notificações */}
      <Text
        variant="sectionLabel"
        paddingHorizontal="s4"
        paddingTop="s16"
        paddingBottom="s6">
        Notificações
      </Text>
      <Box
        backgroundColor="card"
        borderWidth={1}
        borderColor="separator"
        borderRadius="br16"
        flexDirection="row"
        alignItems="center"
        padding="s16">
        <Text variant="body" flex={1}>
          Silenciar notificações
        </Text>
        <Switch
          value={chat.muted}
          onValueChange={muted => setMuted(chat.id, muted)}
          trackColor={{true: colors.primary}}
        />
      </Box>

      {/* Ações */}
      <Box gap="s10" paddingTop="s20" paddingBottom="s24">
        <TouchableOpacityBox
          onPress={() => toastService.show('Disponível em breve.')}
          activeOpacity={0.7}
          backgroundColor="card"
          borderWidth={1}
          borderColor="separator"
          borderRadius="br16"
          padding="s16"
          alignItems="center">
          <Text variant="itemTitle" color="danger">
            Limpar conversa
          </Text>
        </TouchableOpacityBox>
        {chat.type === 'group' && (
          <TouchableOpacityBox
            onPress={() => toastService.show('Disponível em breve.')}
            activeOpacity={0.7}
            backgroundColor="card"
            borderWidth={1}
            borderColor="separator"
            borderRadius="br16"
            padding="s16"
            alignItems="center">
            <Text variant="itemTitle" color="danger">
              Sair do grupo
            </Text>
          </TouchableOpacityBox>
        )}
      </Box>

      <ImageViewer target={photoTarget} onClose={() => setPhotoTarget(null)} />
    </Screen>
  );
}

function ProfileSubtitle({chat}: {chat: Chat}) {
  if (chat.type === 'dm') {
    return (
      <Text
        variant="paragraphSecondary"
        color={chat.online ? 'primary' : 'textSecondary'}>
        {chat.online ? 'online' : 'visto por último hoje'}
      </Text>
    );
  }
  if (chat.type === 'group') {
    return <Text variant="paragraphSecondary">Grupo · {chat.context}</Text>;
  }
  return (
    <Text variant="paragraphSecondary">Atendimento · {chat.product}</Text>
  );
}

function InfoCard({rows}: {rows: {label: string; value: string}[]}) {
  return (
    <Box
      backgroundColor="card"
      borderWidth={1}
      borderColor="separator"
      borderRadius="br16"
      overflow="hidden">
      {rows.map((row, index) => (
        <Box
          key={row.label}
          padding="s16"
          borderBottomWidth={index < rows.length - 1 ? 1 : 0}
          borderColor="separator">
          <Text variant="captionSmall" fontWeight="600">
            {row.label}
          </Text>
          <Text variant="body" marginTop="s2">
            {row.value}
          </Text>
        </Box>
      ))}
    </Box>
  );
}
