import React, {useState} from 'react';

import {zodResolver} from '@hookform/resolvers/zod';
import {useForm} from 'react-hook-form';

import {
  Box,
  Button,
  FormTextInput,
  Icon,
  Screen,
  Text,
} from '@components';
import {useAuthRequestNewPassword} from '@domain';
import {AuthScreenProps} from '@routes';
import {toastService} from '@services';

import {
  forgotPasswordSchema,
  ForgotPasswordSchema,
} from './ForgotPasswordSchema';

export function ForgotPasswordScreen({
  navigation,
}: AuthScreenProps<'ForgotPasswordScreen'>) {
  const [sentTo, setSentTo] = useState<string | null>(null);

  const {control, handleSubmit, getValues} = useForm<ForgotPasswordSchema>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {email: ''},
  });

  const {requestNewPassword, isLoading} = useAuthRequestNewPassword({
    onSuccess: () => setSentTo(getValues('email')),
    onError: error => toastService.show(error.message, 'error'),
  });

  function submitForm(data: ForgotPasswordSchema) {
    requestNewPassword(data.email);
  }

  return (
    <Screen canGoBack onBackPress={navigation.goBack}>
      <Text variant="title" marginTop="s24">
        Recuperar acesso
      </Text>
      <Text variant="paragraphSecondary" marginTop="s6" marginBottom="s24">
        Enviaremos um link de redefinição para seu email.
      </Text>

      {sentTo === null ? (
        <>
          <FormTextInput
            control={control}
            name="email"
            label="Email"
            placeholder="voce@empresa.com"
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <Button
            title="Enviar link"
            onPress={handleSubmit(submitForm)}
            loading={isLoading}
            marginTop="s20"
          />
        </>
      ) : (
        <Box alignItems="center" gap="s14" marginTop="s28">
          <Box
            width={64}
            height={64}
            borderRadius="full"
            backgroundColor="primaryTint"
            alignItems="center"
            justifyContent="center">
            <Icon name="check" size={30} color="primary" />
          </Box>
          <Text variant="headingSmall">Link enviado!</Text>
          <Text variant="paragraphSecondary" textAlign="center">
            Verifique {sentTo} e siga as instruções.
          </Text>
          <Button
            title="Voltar ao login"
            preset="ghost"
            onPress={navigation.goBack}
            marginTop="s6"
          />
        </Box>
      )}
    </Screen>
  );
}
