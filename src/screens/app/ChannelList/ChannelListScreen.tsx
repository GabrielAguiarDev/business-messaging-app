import React from 'react';

import {ActivityIndicator, FlatList, ListRenderItemInfo} from 'react-native';

import {
  Avatar,
  Box,
  EmptyState,
  ErrorState,
  Icon,
  Screen,
  Tag,
  Text,
  TouchableOpacityBox,
} from '@components';
import {Channel, useChannelList} from '@domain';
import {AppTabScreenProps} from '@routes';

export function ChannelListScreen({
  navigation,
}: AppTabScreenProps<'AtendimentoTab'>) {
  const {channels, isLoading, isError, refetch} = useChannelList();

  function navigateToQueue(channelId: string) {
    navigation.navigate('AttendanceQueueScreen', {channelId});
  }

  function renderItem({item: channel}: ListRenderItemInfo<Channel>) {
    return (
      <TouchableOpacityBox
        onPress={() => navigateToQueue(channel.id)}
        activeOpacity={0.7}
        flexDirection="row"
        alignItems="center"
        gap="s14"
        paddingHorizontal="s16"
        paddingTop="s12">
        <Avatar
          label={channel.initials}
          color={channel.avatarColor}
          photoUri={channel.avatarUrl}
          shape="squircle"
          size={52}
        />
        <Box
          flex={1}
          borderBottomWidth={1}
          borderColor="separator"
          paddingBottom="s14">
          <Text variant="itemTitle">{channel.name}</Text>
          <Box marginTop="s6">
            <Tag
              label={`Atendimento · ${channel.product}`}
              preset="attendance"
            />
          </Box>
        </Box>
        <Box
          flexDirection="row"
          alignItems="center"
          gap="s10"
          borderBottomWidth={1}
          borderColor="separator"
          paddingBottom="s14">
          {channel.waitingCount > 0 && (
            <Box alignItems="center" gap="s2">
              <Box
                minWidth={22}
                height={22}
                paddingHorizontal="s6"
                borderRadius="br10"
                backgroundColor="attendance"
                alignItems="center"
                justifyContent="center">
                <Text fontSize={12} fontWeight="700" color="primaryContrast">
                  {channel.waitingCount}
                </Text>
              </Box>
              <Text fontSize={9} color="textSecondary">
                aguard.
              </Text>
            </Box>
          )}
          <Icon name="chevronRight" size={16} color="textTertiary" />
        </Box>
      </TouchableOpacityBox>
    );
  }

  return (
    <Screen contentProps={$content}>
      <Box paddingHorizontal="s20" paddingVertical="s8">
        <Text variant="largeTitle">Atendimento</Text>
        <Text variant="caption" marginTop="s2">
          Canais por produto
        </Text>
      </Box>
      {isLoading ? (
        <Box flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </Box>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={channels}
          keyExtractor={channel => channel.id}
          renderItem={renderItem}
          contentContainerStyle={$listContent}
          ListEmptyComponent={
            <EmptyState
              icon="headset"
              title="Nenhum canal disponível"
              message="Você ainda não tem acesso a canais de atendimento."
            />
          }
        />
      )}
    </Screen>
  );
}

const $content = {paddingHorizontal: 's0'} as const;
// tab bar flutuante — folga no fim da lista
const $listContent = {paddingBottom: 100, flexGrow: 1};
