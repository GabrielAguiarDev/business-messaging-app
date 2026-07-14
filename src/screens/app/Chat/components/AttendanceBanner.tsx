import React from 'react';

import {Box, Text, TouchableOpacityBox} from '@components';
import {Chat, useAttendanceResolve} from '@domain';
import {toastService} from '@services';
import {ThemeColors} from '@theme';

interface AttendanceBannerProps {
  chat: Chat;
}

const statusConfig: Record<
  string,
  {label: string; color: keyof ThemeColors}
> = {
  aguardando: {label: 'Aguardando', color: 'attendance'},
  atendimento: {label: 'Em atendimento', color: 'primary'},
  resolvida: {label: 'Resolvida', color: 'textSecondary'},
};

/** Banner de status exibido no chat de atendimento (abaixo do header). */
export function AttendanceBanner({chat}: AttendanceBannerProps) {
  const status = chat.status ?? 'atendimento';
  const config = statusConfig[status];

  const {resolve, isLoading} = useAttendanceResolve({
    onSuccess: () => toastService.show('Conversa resolvida.', 'success'),
    onError: error => toastService.show(error.message, 'error'),
  });

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      gap="s10"
      paddingHorizontal="s16"
      paddingVertical="s10"
      backgroundColor="primaryTint"
      borderBottomWidth={1}
      borderColor="separator">
      <Box
        width={9}
        height={9}
        borderRadius="full"
        backgroundColor={config.color}
      />
      <Box flex={1}>
        <Text variant="caption" fontWeight="700" color={config.color}>
          {config.label}
        </Text>
        <Text variant="labelSmall" fontWeight="400" color="textSecondary">
          {chat.product} ·{' '}
          {chat.assignedTo ? `Assumida por ${chat.assignedTo}` : 'Não atribuída'}
        </Text>
      </Box>
      {status === 'atendimento' && (
        <TouchableOpacityBox
          onPress={() => resolve(chat.id)}
          disabled={isLoading}
          activeOpacity={0.7}
          paddingHorizontal="s14"
          paddingVertical="s6"
          borderRadius="br16"
          borderWidth={1}
          borderColor="primary"
          opacity={isLoading ? 0.5 : 1}>
          <Text fontSize={12.5} fontWeight="600" color="primary">
            Resolver
          </Text>
        </TouchableOpacityBox>
      )}
      <TouchableOpacityBox
        onPress={() => toastService.show('Transferência disponível em breve.')}
        activeOpacity={0.7}
        paddingHorizontal="s12"
        paddingVertical="s6"
        borderRadius="br16"
        backgroundColor="chip">
        <Text fontSize={12.5} fontWeight="600" color="textSecondary">
          Transferir
        </Text>
      </TouchableOpacityBox>
    </Box>
  );
}
