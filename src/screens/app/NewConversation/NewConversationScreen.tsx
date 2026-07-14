import React, {useMemo, useState} from 'react';

import {
  ActivityIndicator,
  FlatList,
  ListRenderItemInfo,
  ScrollView,
} from 'react-native';

import {
  Avatar,
  Box,
  ErrorState,
  Screen,
  SearchBar,
  Text,
  TouchableOpacityBox,
} from '@components';
import {useChatStartDm, User, useUserList} from '@domain';
import {AppStackScreenProps} from '@routes';
import {toastService} from '@services';

export function NewConversationScreen({
  navigation,
}: AppStackScreenProps<'NewConversationScreen'>) {
  const [search, setSearch] = useState('');
  const [department, setDepartment] = useState<string | null>(null);
  const {users, isLoading, isError, refetch} = useUserList();

  const departments = useMemo(
    () => [...new Set(users.map(user => user.department))].sort(),
    [users],
  );

  const {startDm, isLoading: isStarting} = useChatStartDm({
    onSuccess: chat => navigation.replace('ChatScreen', {chatId: chat.id}),
    onError: error => toastService.show(error.message, 'error'),
  });

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return users.filter(user => {
      const matchesDepartment =
        department === null || user.department === department;
      const matchesQuery =
        !query ||
        user.name.toLowerCase().includes(query) ||
        user.role.toLowerCase().includes(query);
      return matchesDepartment && matchesQuery;
    });
  }, [users, search, department]);

  function renderItem({item: user}: ListRenderItemInfo<User>) {
    return (
      <TouchableOpacityBox
        onPress={() => startDm(user)}
        disabled={isStarting}
        activeOpacity={0.7}
        flexDirection="row"
        alignItems="center"
        gap="s12"
        paddingHorizontal="s16"
        paddingTop="s10">
        <Box>
          <Avatar
            label={user.initials}
            color={user.avatarColor}
            shape="circle"
            size={50}
          />
          {user.online && (
            <Box
              position="absolute"
              right={0}
              bottom={2}
              width={13}
              height={13}
              borderRadius="full"
              backgroundColor="online"
              borderWidth={2}
              borderColor="background"
            />
          )}
        </Box>
        <Box
          flex={1}
          flexDirection="row"
          alignItems="center"
          borderBottomWidth={1}
          borderColor="separator"
          paddingBottom="s12">
          <Box flex={1}>
            <Text variant="itemTitle">{user.name}</Text>
            <Text variant="caption" marginTop="s2">
              {user.role}
            </Text>
          </Box>
          {user.isAdmin && (
            <Box
              backgroundColor="primaryTint"
              borderRadius="br6"
              paddingHorizontal="s8"
              paddingVertical="s2">
              <Text fontSize={10.5} fontWeight="700" color="primary">
                Admin
              </Text>
            </Box>
          )}
        </Box>
      </TouchableOpacityBox>
    );
  }

  return (
    <Screen
      title="Nova conversa"
      canGoBack
      onBackPress={navigation.goBack}
      contentProps={$content}>
      <Box paddingHorizontal="s16" paddingBottom="s8">
        <SearchBar
          placeholder="Buscar por nome ou cargo"
          value={search}
          onChangeText={setSearch}
        />
      </Box>
      {/* Filtro por departamento */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={$chipsScroll}
        contentContainerStyle={$chipsContent}>
        <DepartmentChip
          label="Todos"
          isActive={department === null}
          onPress={() => setDepartment(null)}
        />
        {departments.map(item => (
          <DepartmentChip
            key={item}
            label={item}
            isActive={department === item}
            onPress={() => setDepartment(department === item ? null : item)}
          />
        ))}
      </ScrollView>
      <Text variant="sectionLabel" paddingHorizontal="s20" paddingVertical="s6">
        Diretório da empresa
      </Text>
      {isLoading ? (
        <Box flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </Box>
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={user => user.id}
          renderItem={renderItem}
          contentContainerStyle={$listContent}
        />
      )}
    </Screen>
  );
}

function DepartmentChip({
  label,
  isActive,
  onPress,
}: {
  label: string;
  isActive: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacityBox
      onPress={onPress}
      activeOpacity={0.7}
      paddingHorizontal="s14"
      paddingVertical="s8"
      borderRadius="full"
      backgroundColor={isActive ? 'primaryTint' : 'chip'}
      borderWidth={1}
      borderColor={isActive ? 'primary' : 'chip'}>
      <Text
        fontSize={13}
        fontWeight="600"
        color={isActive ? 'primary' : 'textSecondary'}>
        {label}
      </Text>
    </TouchableOpacityBox>
  );
}

const $content = {paddingHorizontal: 's0'} as const;
const $listContent = {paddingBottom: 24};
// flexGrow: 0 impede o ScrollView horizontal de ocupar o espaço vertical
// livre da tela (os chips esticavam junto)
const $chipsScroll = {flexGrow: 0};
const $chipsContent = {
  paddingHorizontal: 16,
  gap: 8,
  paddingBottom: 4,
  alignItems: 'center',
} as const;
