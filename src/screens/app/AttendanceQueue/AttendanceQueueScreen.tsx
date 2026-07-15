import React, {useState} from 'react';

import {ActivityIndicator, FlatList, ListRenderItemInfo} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  Avatar,
  Box,
  Button,
  EmptyState,
  Icon,
  IconButton,
  Text,
  TouchableOpacityBox,
} from '@components';
import {
  QueueItem,
  QueueTab,
  useAttendanceAssume,
  useAttendanceOpenQueueItem,
  useChannelList,
  useChannelQueues,
} from '@domain';
import {AppStackScreenProps} from '@routes';
import {toastService} from '@services';

const TABS: {key: QueueTab; label: string}[] = [
  {key: 'aguardando', label: 'Aguardando'},
  {key: 'atendimento', label: 'Em atend.'},
  {key: 'resolvidas', label: 'Resolvidas'},
];

export function AttendanceQueueScreen({
  navigation,
  route,
}: AppStackScreenProps<'AttendanceQueueScreen'>) {
  const {channelId} = route.params;
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<QueueTab>('aguardando');

  const {channels} = useChannelList();
  const channel = channels.find(c => c.id === channelId);
  const {queues, isLoading} = useChannelQueues(channelId);

  function navigateToChat(chatId: string) {
    navigation.navigate('ChatScreen', {chatId});
  }

  const {assume, isLoading: isAssuming} = useAttendanceAssume({
    onSuccess: navigateToChat,
    onError: error => toastService.show(error.message, 'error'),
  });

  const {openQueueItem} = useAttendanceOpenQueueItem({
    onSuccess: navigateToChat,
    onError: error => toastService.show(error.message, 'error'),
  });

  const items = queues?.[activeTab] ?? [];
  const counts = {
    aguardando: queues?.aguardando.length ?? 0,
    atendimento: queues?.atendimento.length ?? 0,
    resolvidas: queues?.resolvidas.length ?? 0,
  };
  const isWaitingTab = activeTab === 'aguardando';

  function renderItem({item}: ListRenderItemInfo<QueueItem>) {
    return (
      <TouchableOpacityBox
        onPress={
          isWaitingTab
            ? undefined
            : () => openQueueItem({channelId, itemId: item.id})
        }
        activeOpacity={isWaitingTab ? 1 : 0.7}
        flexDirection="row"
        alignItems="center"
        gap="s12"
        paddingHorizontal="s16"
        paddingVertical="s12"
        borderBottomWidth={1}
        borderColor="separator">
        <Avatar
          label={item.initials}
          color={item.avatarColor}
          photoUri={item.avatarUrl}
          shape="circle"
          size={50}
        />
        <Box flex={1}>
          <Box flexDirection="row" alignItems="center">
            <Text variant="itemTitle" numberOfLines={1} flexShrink={1}>
              {item.name}
            </Text>
            <Box flex={1} />
            <Text variant="captionSmall">{item.time}</Text>
          </Box>
          <Text variant="paragraphSecondary" numberOfLines={1} marginTop="s2">
            {item.preview}
          </Text>
          {!isWaitingTab && item.assignedTo && (
            <Box
              flexDirection="row"
              alignItems="center"
              gap="s4"
              marginTop="s4">
              <Icon name="check" size={12} color="primary" />
              <Text variant="captionSmall" fontWeight="600" color="primary">
                Assumida por {item.assignedTo}
              </Text>
            </Box>
          )}
        </Box>
        {isWaitingTab && (
          <Button
            title="Assumir"
            small
            loading={isAssuming}
            onPress={() => assume({channelId, itemId: item.id})}
          />
        )}
      </TouchableOpacityBox>
    );
  }

  return (
    <Box flex={1} backgroundColor="background">
      {/* Header */}
      <Box
        backgroundColor="surface"
        borderBottomWidth={1}
        borderColor="separator"
        style={{paddingTop: insets.top + 6}}>
        <Box
          flexDirection="row"
          alignItems="center"
          gap="s10"
          paddingHorizontal="s12">
          <IconButton icon="back" onPress={navigation.goBack} />
          {channel && (
            <>
              <Avatar
                label={channel.initials}
                color={channel.avatarColor}
                photoUri={channel.avatarUrl}
                shape="squircle"
                size={40}
              />
              <Box flex={1}>
                <Text variant="headingSmall" numberOfLines={1}>
                  {channel.name}
                </Text>
                <Text variant="captionSmall">
                  Atendimento · {channel.product}
                </Text>
              </Box>
            </>
          )}
          <IconButton icon="dots" onPress={() => {}} />
        </Box>

        {/* Filas */}
        <Box flexDirection="row" gap="s6" padding="s12">
          {TABS.map(tab => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacityBox
                key={tab.key}
                onPress={() => setActiveTab(tab.key)}
                activeOpacity={0.7}
                flex={1}
                flexDirection="row"
                alignItems="center"
                justifyContent="center"
                gap="s4"
                paddingVertical="s8"
                borderRadius="br12"
                backgroundColor={isActive ? 'primaryTint' : undefined}>
                <Text
                  fontSize={12.5}
                  fontWeight="600"
                  color={isActive ? 'primary' : 'textSecondary'}>
                  {tab.label}
                </Text>
                <Box
                  minWidth={18}
                  paddingHorizontal="s4"
                  borderRadius="br10"
                  backgroundColor={isActive ? 'primary' : 'textSecondary'}
                  alignItems="center">
                  <Text fontSize={11} color="primaryContrast">
                    {counts[tab.key]}
                  </Text>
                </Box>
              </TouchableOpacityBox>
            );
          })}
        </Box>
      </Box>

      {/* Lista */}
      {isLoading ? (
        <Box flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </Box>
      ) : (
        <FlatList
          data={items}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          contentContainerStyle={$listContent}
          ListEmptyComponent={
            <EmptyState
              icon="chat"
              title="Nenhuma conversa aqui"
              message="As conversas iniciadas por clientes neste produto aparecerão nesta fila."
            />
          }
        />
      )}
    </Box>
  );
}

const $listContent = {paddingBottom: 24, flexGrow: 1};
