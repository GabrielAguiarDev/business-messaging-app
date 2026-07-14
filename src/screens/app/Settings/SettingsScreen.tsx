import React from 'react';

import {ScrollView, Switch} from 'react-native';

import {
  Avatar,
  Box,
  Screen,
  Text,
  TouchableOpacityBox,
} from '@components';
import {useAppTheme} from '@hooks';
import {
  useAuthCredentials,
  useResolvedTheme,
  useSettingsStore,
} from '@services';

export function SettingsScreen() {
  const {authCredentials, removeCredentials} = useAuthCredentials();
  const user = authCredentials?.user;
  const {colors} = useAppTheme();

  const resolvedTheme = useResolvedTheme();
  const {setThemePreference, pushEnabled, setPushEnabled, soundEnabled, setSoundEnabled} =
    useSettingsStore();

  return (
    <Screen contentProps={$content}>
      <Box paddingHorizontal="s20" paddingVertical="s8">
        <Text variant="largeTitle">Configurações</Text>
      </Box>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={$scrollContent}>
        {/* Perfil */}
        {user && (
          <Box paddingHorizontal="s16" paddingTop="s14">
            <Box
              flexDirection="row"
              alignItems="center"
              gap="s14"
              backgroundColor="card"
              borderWidth={1}
              borderColor="separator"
              borderRadius="br16"
              padding="s16">
              <Avatar
                label={user.initials}
                color={user.avatarColor}
                shape="circle"
                size={58}
              />
              <Box flex={1}>
                <Text variant="headingSmall">{user.name}</Text>
                <Text variant="caption" marginTop="s2">
                  {user.role}
                </Text>
                <Text variant="captionSmall" color="textTertiary" marginTop="s2">
                  {user.email}
                </Text>
              </Box>
            </Box>
          </Box>
        )}

        {/* Aparência */}
        <Text
          variant="sectionLabel"
          paddingHorizontal="s20"
          paddingTop="s16"
          paddingBottom="s6">
          Aparência
        </Text>
        <Box
          marginHorizontal="s16"
          backgroundColor="card"
          borderWidth={1}
          borderColor="separator"
          borderRadius="br16"
          padding="s12">
          <Box flexDirection="row" gap="s8">
            <ThemeOption
              label="☀︎ Claro"
              isActive={resolvedTheme === 'light'}
              onPress={() => setThemePreference('light')}
            />
            <ThemeOption
              label="☾ Escuro"
              isActive={resolvedTheme === 'dark'}
              onPress={() => setThemePreference('dark')}
            />
          </Box>
        </Box>

        {/* Notificações */}
        <Text
          variant="sectionLabel"
          paddingHorizontal="s20"
          paddingTop="s16"
          paddingBottom="s6">
          Notificações
        </Text>
        <Box
          marginHorizontal="s16"
          backgroundColor="card"
          borderWidth={1}
          borderColor="separator"
          borderRadius="br16"
          overflow="hidden">
          <Box
            flexDirection="row"
            alignItems="center"
            padding="s16"
            borderBottomWidth={1}
            borderColor="separator">
            <Text variant="body" flex={1}>
              Notificações push
            </Text>
            <Switch
              value={pushEnabled}
              onValueChange={setPushEnabled}
              trackColor={{true: colors.primary}}
            />
          </Box>
          <Box flexDirection="row" alignItems="center" padding="s16">
            <Text variant="body" flex={1}>
              Som de mensagens
            </Text>
            <Switch
              value={soundEnabled}
              onValueChange={setSoundEnabled}
              trackColor={{true: colors.primary}}
            />
          </Box>
        </Box>

        {/* Sair */}
        <Box paddingHorizontal="s16" paddingTop="s20">
          <TouchableOpacityBox
            onPress={() => removeCredentials()}
            activeOpacity={0.7}
            backgroundColor="card"
            borderWidth={1}
            borderColor="separator"
            borderRadius="br16"
            padding="s16"
            alignItems="center">
            <Text variant="itemTitle" color="danger">
              Sair
            </Text>
          </TouchableOpacityBox>
        </Box>
      </ScrollView>
    </Screen>
  );
}

function ThemeOption({
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
      flex={1}
      paddingVertical="s12"
      borderRadius="br12"
      borderWidth={1.5}
      borderColor={isActive ? 'primary' : 'separator'}
      backgroundColor={isActive ? 'primaryTint' : undefined}
      alignItems="center">
      <Text
        variant="paragraphSecondary"
        fontWeight="600"
        color={isActive ? 'primary' : 'text'}>
        {label}
      </Text>
    </TouchableOpacityBox>
  );
}

const $content = {paddingHorizontal: 's0'} as const;
// tab bar flutuante — folga no fim do scroll
const $scrollContent = {paddingBottom: 110};
