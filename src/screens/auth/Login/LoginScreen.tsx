import React, {useState} from 'react';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';

import {Box, Button, FormTextInput, Icon, Screen, Text} from '@components';
import {useAuthSignIn} from '@domain';
import {AuthScreenProps} from '@routes';
import {useAuthCredentials} from '@services';

import {loginSchema, LoginSchema} from './LoginSchema';

export function LoginScreen({navigation}: AuthScreenProps<'LoginScreen'>) {
  const {saveCredentials} = useAuthCredentials();
  const [signInError, setSignInError] = useState<string | null>(null);

  const {control, handleSubmit} = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: {email: '', password: ''},
  });

  const {signIn, isLoading} = useAuthSignIn({
    onSuccess: credentials => saveCredentials(credentials),
    onError: error => setSignInError(error.message),
  });

  function submitForm(data: LoginSchema) {
    setSignInError(null);
    signIn({email: data.email, password: data.password});
  }

  function navigateToForgotPassword() {
    navigation.navigate('ForgotPasswordScreen');
  }

  return (
    <Screen scrollable>
      <Box height={96} />
      <Box
        width={64}
        height={64}
        borderRadius="br18"
        backgroundColor="primary"
        alignItems="center"
        justifyContent="center"
        marginBottom="s24">
        <Icon name="chat" size={34} color="primaryContrast" />
      </Box>
      <Text variant="title">Entrar</Text>
      <Text variant="paragraphSecondary" marginTop="s6" marginBottom="s24">
        Acesse com seu email corporativo
      </Text>

      <FormTextInput
        control={control}
        name="email"
        label="Email"
        placeholder="voce@empresa.com"
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        boxProps={{marginBottom: 's14'}}
      />
      <FormTextInput
        control={control}
        name="password"
        label="Senha"
        placeholder="Sua senha"
        secureTextEntry
        autoComplete="password"
        boxProps={{marginBottom: 's6'}}
      />

      {signInError && (
        <Text variant="caption" color="danger" marginTop="s6">
          {signInError}
        </Text>
      )}

      <Button
        title="Entrar"
        onPress={handleSubmit(submitForm)}
        loading={isLoading}
        marginTop="s20"
      />
      <Button
        title="Esqueci a senha"
        preset="ghost"
        onPress={navigateToForgotPassword}
        marginTop="s12"
      />
    </Screen>
  );
}
