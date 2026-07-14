import React from 'react';

import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppTheme } from '@hooks';
import {
  AttendanceQueueScreen,
  ChannelListScreen,
  ChatListScreen,
  ChatProfileScreen,
  ChatScreen,
  CommunityScreen,
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
        }}
      />
      <Tab.Screen
        name="AtendimentoTab"
        component={ChannelListScreen}
        options={{
          title: 'Atend.',
          tabBarIcon: { type: 'sfSymbol', name: 'headphones' },
        }}
      />
      <Tab.Screen
        name="ChatsTab"
        component={ChatListScreen}
        options={{
          title: 'Chats',
          tabBarIcon: { type: 'sfSymbol', name: 'message' },
        }}
      />
      <Tab.Screen
        name="ConfigTab"
        component={SettingsScreen}
        options={{
          title: 'Config',
          tabBarIcon: { type: 'sfSymbol', name: 'gearshape' },
        }}
      />
    </Tab.Navigator>
  );
}

/**
 * Stack raiz do app logado: tabs na base e telas de detalhe por cima
 * (sem tab bar), como no design.
 */
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
      <Stack.Screen name="ChatScreen" component={ChatScreen} />
      <Stack.Screen name="ChatProfileScreen" component={ChatProfileScreen} />
    </Stack.Navigator>
  );
}
