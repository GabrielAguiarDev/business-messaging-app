import React from 'react';

import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useChannelList, useChatList, useModuleList } from '@domain';
import { useAppTheme } from '@hooks';
import {
  AttendanceQueueScreen,
  ChannelListScreen,
  ChatListScreen,
  ChatProfileScreen,
  ChatScreen,
  CommunityScreen,
  EditProfileScreen,
  ForwardMessageScreen,
  ModuleListScreen,
  NewConversationScreen,
  SettingsScreen,
} from '@screens';

import { AppStackParamList, AppTabParamList } from './navigationTypes';

// Tab bar NATIVA (UITabBarController) — liquid glass real no iOS 26,
// Material BottomNavigation no Android. Ícones via SF Symbols no iOS.
const Tab = createNativeBottomTabNavigator<AppTabParamList>();
const Stack = createNativeStackNavigator<AppStackParamList>();

function AppTabs() {
  // Badge da aba Chats: soma das mensagens não lidas das conversas não
  // silenciadas (silenciadas não entram na contagem, como no WhatsApp).
  // O react-query reavalia ao enviar/receber/marcar lida → o badge é reativo.
  const { colors } = useAppTheme();
  const { chats } = useChatList();
  const { modules } = useModuleList();
  const { channels } = useChannelList();

  // Badge de cada aba = soma das não lidas do respectivo domínio. Todos os
  // hooks são react-query → os badges reagem a enviar/receber/marcar lida/assumir.
  const chatsUnread = chats.reduce(
    (total, chat) => (chat.muted ? total : total + chat.unreadCount),
    0,
  );
  const modulesUnread = modules.reduce(
    (total, module) => total + module.unreadCount,
    0,
  );
  // Atendimento: total aguardando nas filas dos canais (badge laranja da lista).
  const attendanceWaiting = channels.reduce(
    (total, channel) => total + channel.waitingCount,
    0,
  );

  // cor do badge fixa na primária em qualquer estado (ver AppDelegate p/ o
  // estado "selecionado" no iOS, que o react-navigation não customiza)
  const badgeStyle = { backgroundColor: colors.primary };
  const badgeFor = (count: number) => (count > 0 ? count : undefined);

  return (
    <Tab.Navigator
      initialRouteName="ChatsTab"
      screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="ModulosTab"
        component={ModuleListScreen}
        options={{
          title: 'Módulos',
          tabBarIcon: { type: 'sfSymbol', name: 'person.2' },
          tabBarBadge: badgeFor(modulesUnread),
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tab.Screen
        name="AtendimentoTab"
        component={ChannelListScreen}
        options={{
          title: 'Atend.',
          tabBarIcon: { type: 'sfSymbol', name: 'headphones' },
          tabBarBadge: badgeFor(attendanceWaiting),
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatListScreen}
        options={{
          title: 'Chats',
          tabBarIcon: { type: 'sfSymbol', name: 'message' },
          tabBarBadge: badgeFor(chatsUnread),
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tab.Screen
        name="ConfigTab"
        component={SettingsScreen}
        options={{
          title: 'Config',
          tabBarIcon: { type: 'sfSymbol', name: 'gearshape' },
          // Config não tem badge, mas a aparência da tela EM FOCO define a cor
          // dos badges da barra inteira no iOS — sem isto, ao abrir Config os
          // badges das outras abas caem na cor default (vermelho).
          tabBarBadgeStyle: badgeStyle,
        }}
      />
    </Tab.Navigator>
  );
}

export function AppStack() {
  const {colors} = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="AppTabs" component={AppTabs} />
      <Stack.Screen name="CommunityScreen" component={CommunityScreen} />
      <Stack.Screen
        name="AttendanceQueueScreen"
        component={AttendanceQueueScreen}
      />
      <Stack.Screen
        name="NewConversationScreen"
        component={NewConversationScreen}
      />
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} />
      <Stack.Screen
        name="ChatScreen"
        component={ChatScreen}
        options={{ fullScreenGestureEnabled: false }}
      />
      <Stack.Screen name="ChatProfileScreen" component={ChatProfileScreen} />
      <Stack.Screen
        name="ForwardMessageScreen"
        component={ForwardMessageScreen}
      />
    </Stack.Navigator>
  );
}
