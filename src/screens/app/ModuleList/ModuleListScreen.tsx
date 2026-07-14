import React from 'react';

import {ActivityIndicator, FlatList, ListRenderItemInfo} from 'react-native';

import {
  Avatar,
  Badge,
  Box,
  EmptyState,
  ErrorState,
  IconButton,
  Screen,
  Tag,
  Text,
  TouchableOpacityBox,
} from '@components';
import {Module, useModuleList} from '@domain';
import {AppTabScreenProps} from '@routes';

export function ModuleListScreen({
  navigation,
}: AppTabScreenProps<'ModulosTab'>) {
  const {modules, isLoading, isError, refetch} = useModuleList();

  function navigateToCommunity(moduleId: string) {
    navigation.navigate('CommunityScreen', {moduleId});
  }

  function renderItem({item: module}: ListRenderItemInfo<Module>) {
    return (
      <TouchableOpacityBox
        onPress={() => navigateToCommunity(module.id)}
        activeOpacity={0.7}
        flexDirection="row"
        alignItems="center"
        gap="s14"
        paddingHorizontal="s16"
        paddingTop="s10">
        <Avatar
          label={module.initials}
          color={module.avatarColor}
          shape="squircle"
          size={52}
        />
        <Box
          flex={1}
          borderBottomWidth={1}
          borderColor="separator"
          paddingBottom="s12">
          <Box flexDirection="row" alignItems="center" gap="s8">
            <Text variant="itemTitle">{module.name}</Text>
            <Box flex={1} />
            <Badge count={module.unreadCount} />
          </Box>
          <Box marginTop="s6">
            <Tag label="Community" />
          </Box>
        </Box>
      </TouchableOpacityBox>
    );
  }

  return (
    <Screen contentProps={$content}>
      <Box
        flexDirection="row"
        alignItems="center"
        justifyContent="space-between"
        paddingHorizontal="s20"
        paddingVertical="s8">
        <Text variant="largeTitle">Módulos</Text>
        <IconButton icon="plus" preset="primary" onPress={() => {}} />
      </Box>
      <Text variant="sectionLabel" paddingHorizontal="s20" paddingVertical="s6">
        Communities
      </Text>
      {isLoading ? (
        <Box flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </Box>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={modules}
          keyExtractor={module => module.id}
          renderItem={renderItem}
          contentContainerStyle={$listContent}
          ListEmptyComponent={
            <EmptyState
              icon="modules"
              title="Nenhum módulo"
              message="Você ainda não participa de nenhuma community."
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
