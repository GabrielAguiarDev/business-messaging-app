import React from 'react';

import {ActivityIndicator, ScrollView} from 'react-native';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {
  Avatar,
  Box,
  Button,
  Icon,
  IconButton,
  Text,
  TouchableOpacityBox,
} from '@components';
import {useModuleContent, useModuleList} from '@domain';
import {AppStackScreenProps} from '@routes';

import {GroupListItem} from './components/GroupListItem';

export function CommunityScreen({
  navigation,
  route,
}: AppStackScreenProps<'CommunityScreen'>) {
  const {moduleId} = route.params;
  const insets = useSafeAreaInsets();

  const {modules} = useModuleList();
  const {content, isLoading} = useModuleContent(moduleId);
  const module = modules.find(m => m.id === moduleId);

  function openChat(chatId: string) {
    navigation.navigate('ChatScreen', {chatId});
  }

  return (
    <Box flex={1} backgroundColor="background">
      {/* Header */}
      <Box
        flexDirection="row"
        alignItems="center"
        gap="s10"
        paddingHorizontal="s12"
        paddingBottom="s10"
        backgroundColor="surface"
        borderBottomWidth={1}
        borderColor="separator"
        style={{paddingTop: insets.top + 6}}>
        <IconButton icon="back" onPress={navigation.goBack} />
        {module && (
          <>
            <Avatar
              label={module.initials}
              color={module.avatarColor}
              shape="squircle"
              size={40}
            />
            <Box flex={1}>
              <Text variant="headingSmall" numberOfLines={1}>
                {module.name}
              </Text>
              <Text variant="captionSmall">Community</Text>
            </Box>
          </>
        )}
        <IconButton icon="dots" onPress={() => {}} />
      </Box>

      {isLoading || !content ? (
        <Box flex={1} alignItems="center" justifyContent="center">
          <ActivityIndicator />
        </Box>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false}>
          {/* Anúncios */}
          <Box paddingHorizontal="s16" paddingTop="s14">
            <TouchableOpacityBox
              onPress={() => openChat(content.myGroups[0]?.id)}
              activeOpacity={0.8}
              flexDirection="row"
              alignItems="center"
              gap="s12"
              backgroundColor="primaryTint"
              borderWidth={1}
              borderColor="separator"
              borderRadius="br16"
              padding="s14">
              <Box
                width={46}
                height={46}
                borderRadius="br12"
                backgroundColor="primary"
                alignItems="center"
                justifyContent="center">
                <Icon name="megaphone" size={24} color="primaryContrast" />
              </Box>
              <Box flex={1}>
                <Box flexDirection="row" alignItems="center">
                  <Text variant="itemTitle" fontWeight="700">
                    Anúncios
                  </Text>
                  <Box flex={1} />
                  <Text variant="captionSmall">{content.announcement.date}</Text>
                </Box>
                <Text variant="caption" numberOfLines={1} marginTop="s2">
                  {content.announcement.lastMessage}
                </Text>
              </Box>
            </TouchableOpacityBox>
          </Box>

          {/* Grupos que você participa */}
          <Text
            variant="sectionLabel"
            paddingHorizontal="s20"
            paddingTop="s20"
            paddingBottom="s6">
            Grupos que você participa
          </Text>
          {content.myGroups.map(group => (
            <GroupListItem
              key={group.id}
              group={group}
              onPress={() => openChat(group.id)}
            />
          ))}

          {/* Grupos que você pode entrar */}
          {content.joinableGroups.length > 0 && (
            <>
              <Text
                variant="sectionLabel"
                paddingHorizontal="s20"
                paddingTop="s20"
                paddingBottom="s6">
                Grupos que você pode entrar
              </Text>
              {content.joinableGroups.map(group => (
                <TouchableOpacityBox
                  key={group.id}
                  onPress={() => {}}
                  activeOpacity={0.7}
                  flexDirection="row"
                  alignItems="center"
                  gap="s12"
                  paddingHorizontal="s16"
                  paddingTop="s8">
                  <Avatar
                    label={group.initials}
                    color={group.avatarColor}
                    shape="circle"
                    size={50}
                  />
                  <Box
                    flex={1}
                    flexDirection="row"
                    alignItems="center"
                    borderBottomWidth={1}
                    borderColor="separator"
                    paddingBottom="s12">
                    <Box flex={1}>
                      <Text variant="itemTitle">{group.name}</Text>
                      <Text variant="caption" marginTop="s2">
                        {group.membersCount} membros
                      </Text>
                    </Box>
                    <Icon name="chevronRight" size={16} color="textTertiary" />
                  </Box>
                </TouchableOpacityBox>
              ))}
            </>
          )}
          <Box height={14} />
        </ScrollView>
      )}

      {/* Footer */}
      <Box
        paddingHorizontal="s16"
        paddingTop="s10"
        backgroundColor="background"
        borderTopWidth={1}
        borderColor="separator"
        style={{paddingBottom: Math.max(insets.bottom, 16)}}>
        <Button title="Adicionar grupo" leftIcon="plus" onPress={() => {}} />
      </Box>
    </Box>
  );
}
