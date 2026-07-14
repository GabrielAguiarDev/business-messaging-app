import React from 'react';

import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TextStyle,
} from 'react-native';

import {useAppTheme} from '@hooks';

import {Box, BoxProps} from '../Box/Box';
import {Text} from '../Text/Text';

export interface TextInputProps extends RNTextInputProps {
  label?: string;
  errorMessage?: string;
  boxProps?: BoxProps;
}

export function TextInput({
  label,
  errorMessage,
  boxProps,
  ...rnProps
}: TextInputProps) {
  const {colors} = useAppTheme();

  const $input: TextStyle = {
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: errorMessage ? colors.danger : colors.separator,
    backgroundColor: colors.card,
    color: colors.text,
    paddingHorizontal: 16,
    fontSize: 16,
  };

  return (
    <Box {...boxProps}>
      {label && (
        <Text
          fontSize={12}
          fontWeight="600"
          color="textSecondary"
          marginBottom="s6">
          {label}
        </Text>
      )}
      <RNTextInput
        placeholderTextColor={colors.textTertiary}
        style={$input}
        {...rnProps}
      />
      {errorMessage && (
        <Text variant="caption" color="danger" marginTop="s6">
          {errorMessage}
        </Text>
      )}
    </Box>
  );
}
