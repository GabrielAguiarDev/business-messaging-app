import React from 'react';

import {
  DarkTheme,
  DefaultTheme,
  NavigationContainer,
} from '@react-navigation/native';

import {useAppTheme} from '@hooks';
import {SplashScreen} from '@screens';
import {useAuthCredentials, useResolvedTheme} from '@services';

import {AppStack} from './AppStack';
import {AuthStack} from './AuthStack';

/**
 * Guarda de rotas: splash enquanto restaura credenciais;
 * depois AuthStack (sem sessão) ou AppTabs (logado).
 */
export function Routes() {
  const {authCredentials, isLoading} = useAuthCredentials();
  const appTheme = useAppTheme();
  const isDark = useResolvedTheme() === 'dark';

  const navigationTheme = {
    ...(isDark ? DarkTheme : DefaultTheme),
    colors: {
      ...(isDark ? DarkTheme : DefaultTheme).colors,
      primary: appTheme.colors.primary,
      background: appTheme.colors.background,
      card: appTheme.colors.surface,
      text: appTheme.colors.text,
      border: appTheme.colors.separator,
      notification: appTheme.colors.danger,
    },
  };

  if (isLoading) {
    return <SplashScreen />;
  }

  return (
    <NavigationContainer theme={navigationTheme}>
      {authCredentials ? <AppStack /> : <AuthStack />}
    </NavigationContainer>
  );
}
