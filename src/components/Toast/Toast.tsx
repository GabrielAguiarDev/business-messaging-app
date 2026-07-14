import React, {useEffect} from 'react';

import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {useToastStore} from '@services';
import {ThemeColors} from '@theme';

import {Box} from '../Box/Box';
import {Text} from '../Text/Text';

const AUTO_HIDE_MS = 3000;

const colorByType: Record<string, keyof ThemeColors> = {
  success: 'online',
  error: 'danger',
  info: 'primary',
};

/** Montado uma única vez no App; exibe o toast do toastService. */
export function Toast() {
  const insets = useSafeAreaInsets();
  const toast = useToastStore(state => state.toast);
  const hide = useToastStore(state => state.hide);

  useEffect(() => {
    if (!toast) {
      return;
    }
    const timeout = setTimeout(hide, AUTO_HIDE_MS);
    return () => clearTimeout(timeout);
  }, [toast, hide]);

  if (!toast) {
    return null;
  }

  return (
    <Box
      position="absolute"
      left={0}
      right={0}
      alignItems="center"
      pointerEvents="none"
      style={{top: insets.top + 10}}>
      <Box
        flexDirection="row"
        alignItems="center"
        gap="s8"
        backgroundColor="card"
        borderColor="separator"
        borderWidth={1}
        borderRadius="br14"
        paddingHorizontal="s16"
        paddingVertical="s12"
        marginHorizontal="s20"
        shadowColor="text"
        shadowOpacity={0.12}
        shadowRadius={12}
        shadowOffset={$shadowOffset}
        elevation={4}>
        <Box
          width={9}
          height={9}
          borderRadius="full"
          backgroundColor={colorByType[toast.type]}
        />
        <Text variant="paragraphSecondary" color="text">
          {toast.message}
        </Text>
      </Box>
    </Box>
  );
}

const $shadowOffset = {width: 0, height: 4};
