import React from 'react';

import {
  TextInput as RNTextInput,
  TextInputProps as RNTextInputProps,
  TextStyle,
} from 'react-native';

import {useAppTheme} from '@hooks';

import {Box, BoxProps} from '../Box/Box';
import {Icon} from '../Icon/Icon';

export interface SearchBarProps extends RNTextInputProps {
  boxProps?: BoxProps;
}

export function SearchBar({boxProps, ...rnProps}: SearchBarProps) {
  const {colors} = useAppTheme();

  const $input: TextStyle = {
    flex: 1,
    color: colors.text,
    fontSize: 15,
    padding: 0,
  };

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      gap="s8"
      backgroundColor="chip"
      borderRadius="br12"
      paddingHorizontal="s12"
      paddingVertical="s10"
      {...boxProps}>
      <Icon name="search" size={16} color="textTertiary" />
      <RNTextInput
        placeholderTextColor={colors.textTertiary}
        style={$input}
        {...rnProps}
      />
    </Box>
  );
}
