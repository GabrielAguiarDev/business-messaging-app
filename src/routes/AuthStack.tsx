import React from 'react';

import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { useAppTheme } from '@hooks/useAppTheme';
import { ForgotPasswordScreen, LoginScreen } from '@screens';

import { AuthStackParamList } from './navigationTypes';

const Stack = createNativeStackNavigator<AuthStackParamList>();

export function AuthStack() {
  const {colors} = useAppTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
      }}>
      <Stack.Screen name="LoginScreen" component={LoginScreen} />
      <Stack.Screen
        name="ForgotPasswordScreen"
        component={ForgotPasswordScreen}
      />
    </Stack.Navigator>
  );
}
